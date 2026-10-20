import { z } from "zod";
import { requireDB } from "@/lib/db";
import { Lead } from "@/models";
import {
  ok,
  created,
  parseBody,
  requireAuth,
  serverError,
  parseListParams,
} from "@/lib/api-utils";
import { toCSV } from "@/lib/helpers";
import { submitToPerfex } from "@/lib/perfex";
import { sendMail, leadEmailTemplate } from "@/lib/mailer";
import { countryNameById } from "@/data/countries";

export const runtime = "nodejs";
export const maxDuration = 30;

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phonenumber: z.string().min(6, "Enter a valid phone number"),
  company: z.string().optional().default(""),
  address: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z.string().optional().default(""),
  zip: z.string().optional().default(""),
  type: z.enum(["quotation", "enquiry"]).default("enquiry"),
  service: z.string().optional().default(""),
  budget: z.string().optional().default(""),
  message: z.string().optional().default(""),
  source: z.string().optional().default(""),
  /** Honeypot — real users never fill this; bots fill every field. */
  website: z.string().optional().default(""),
});

/**
 * Public lead submission.
 *
 * Order matters: the lead is written to our database FIRST, then pushed to
 * Perfex and emailed. Both of those are best-effort — if the CRM is down or
 * SMTP rejects, the visitor still gets a success response and the lead is
 * safe in the admin with `crmStatus`/`emailStatus` recording what failed.
 * Losing a lead because a third party had a bad minute is the one outcome
 * worth engineering against.
 */
export async function POST(req: Request) {
  const { data, error } = await parseBody(req, schema);
  if (error) return error;

  // Silently accept-and-drop bot submissions so they don't retry.
  if (data.website) return created({ success: true });

  const countryName = countryNameById(data.country);

  try {
    await requireDB();

    const lead = await Lead.create({
      name: data.name,
      email: data.email,
      phonenumber: data.phonenumber,
      company: data.company,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      countryName,
      zip: data.zip,
      type: data.type,
      service: data.service,
      budget: data.budget,
      message: data.message,
      source: data.source,
    });

    // Fire both side effects together; neither can fail the request.
    const [crm, mail] = await Promise.all([
      submitToPerfex({
        name: data.name,
        email: data.email,
        phonenumber: data.phonenumber,
        company: data.company,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        zip: data.zip,
        description: buildDescription(data, countryName),
      }).catch((e) => ({ ok: false, error: (e as Error).message })),

      sendMail({
        subject:
          data.type === "quotation"
            ? `Quotation request — ${data.name}${data.service ? ` (${data.service})` : ""}`
            : `New enquiry — ${data.name}${data.service ? ` (${data.service})` : ""}`,
        html: leadEmailTemplate({ ...data, countryName }),
        replyTo: data.email,
      }).catch((e) => ({ ok: false, error: (e as Error).message })),
    ]);

    await Lead.findByIdAndUpdate(lead._id, {
      crmStatus: crm.ok ? "synced" : "failed",
      crmError: crm.ok ? "" : (crm.error ?? "").slice(0, 500),
      ...(crm.ok && "leadId" in crm && crm.leadId ? { crmLeadId: crm.leadId } : {}),
      emailStatus: mail.ok ? "sent" : "failed",
    });

    if (!crm.ok) console.error("[leads] CRM sync failed:", crm.error);
    if (!mail.ok) console.error("[leads] email failed:", mail.error);

    return created({ success: true });
  } catch (err) {
    console.error("[leads.POST]", err);
    return serverError("Could not submit your request. Please try again.");
  }
}

/** Everything Perfex has no field for, folded into one description blob. */
function buildDescription(
  d: z.infer<typeof schema>,
  countryName: string,
): string {
  return [
    `Type: ${d.type === "quotation" ? "Quotation request" : "General enquiry"}`,
    d.service && `Service: ${d.service}`,
    d.budget && `Budget: ${d.budget}`,
    countryName && `Country: ${countryName}`,
    d.source && `Submitted from: ${d.source}`,
    d.message && `\n${d.message}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Admin: list leads, with ?export=csv. */
export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { page, limit, search, status } = parseListParams(req);
  const url = new URL(req.url);
  const isExport = url.searchParams.get("export") === "csv";

  try {
    await requireDB();
    const filter: Record<string, unknown> = {};
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { company: new RegExp(search, "i") },
        { service: new RegExp(search, "i") },
      ];
    }
    if (status && status !== "All") filter.type = status;

    if (isExport) {
      const all = await Lead.find(filter).sort({ createdAt: -1 }).lean();
      const csv = toCSV(
        all.map((l) => ({
          date: l.createdAt,
          type: l.type,
          name: l.name,
          email: l.email,
          phone: l.phonenumber,
          company: l.company ?? "",
          service: l.service ?? "",
          budget: l.budget ?? "",
          message: l.message ?? "",
          address: l.address ?? "",
          city: l.city ?? "",
          state: l.state ?? "",
          country: l.countryName ?? "",
          zip: l.zip ?? "",
          crm: l.crmStatus,
          email_sent: l.emailStatus,
        })),
      );
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="leads.csv"`,
        },
      });
    }

    const total = await Lead.countDocuments(filter);
    const items = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return ok({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      limit,
      unhandled: await Lead.countDocuments({ handled: false }),
    });
  } catch (err) {
    console.error("[leads.GET]", err);
    return serverError();
  }
}
