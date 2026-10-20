import { z } from "zod";
import { requireDB } from "@/lib/db";
import { Contact, Lead } from "@/models";
import { submitToPerfex } from "@/lib/perfex";
import {
  ok,
  created,
  parseBody,
  requireAuth,
  serverError,
  parseListParams,
} from "@/lib/api-utils";
import { toCSV } from "@/lib/helpers";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  budget: z.string().optional(),
  subject: z.string().min(2),
  message: z.string().min(10),
});

// Public: submit a contact message
export async function POST(req: Request) {
  const { data, error } = await parseBody(req, schema);
  if (error) return error;
  try {
    await requireDB();
    await Contact.create(data);

    // Mirror into the CRM as a lead so every inbound conversation is in one
    // place. Best-effort: the message is already saved, so a CRM outage must
    // not fail the visitor's request. The lead is also stored locally so a
    // failure is retried by /api/cron/perfex-sync.
    const crm = await submitToPerfex({
      name: data.name,
      email: data.email,
      phonenumber: "",
      company: data.company,
      description: [
        "Type: Contact form message",
        `Subject: ${data.subject}`,
        data.budget && `Budget: ${data.budget}`,
        `\n${data.message}`,
      ]
        .filter(Boolean)
        .join("\n"),
    }).catch((e) => ({ ok: false, error: (e as Error).message }) as const);

    await Lead.create({
      name: data.name,
      email: data.email,
      phonenumber: "n/a",
      company: data.company ?? "",
      type: "enquiry",
      service: data.subject,
      budget: data.budget ?? "",
      message: data.message,
      source: "/contact",
      crmStatus: crm.ok ? "synced" : "failed",
      crmError: crm.ok ? "" : (crm.error ?? "").slice(0, 500),
      ...(crm.ok && "leadId" in crm && crm.leadId ? { crmLeadId: crm.leadId } : {}),
    });

    return created({ success: true });
  } catch (err) {
    console.error("[contact.POST]", err);
    return serverError("Could not send your message. Please try again.");
  }
}

// Admin: list messages (with ?export=csv)
export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { page, limit, search } = parseListParams(req);
  const url = new URL(req.url);
  const isExport = url.searchParams.get("export") === "csv";

  try {
    await requireDB();
    const filter = search
      ? { $or: [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }, { subject: new RegExp(search, "i") }] }
      : {};

    if (isExport) {
      const all = await Contact.find(filter).sort({ createdAt: -1 }).lean();
      const csv = toCSV(
        all.map((c) => ({
          name: c.name,
          email: c.email,
          company: c.company ?? "",
          budget: c.budget ?? "",
          subject: c.subject,
          message: c.message,
          replied: c.replied ? "yes" : "no",
          date: c.createdAt,
        })),
      );
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="contacts.csv"`,
        },
      });
    }

    const total = await Contact.countDocuments(filter);
    const items = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return ok({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      pages: Math.ceil(total / limit),
      unread: await Contact.countDocuments({ replied: false }),
    });
  } catch (err) {
    console.error("[contact.GET]", err);
    return serverError();
  }
}
