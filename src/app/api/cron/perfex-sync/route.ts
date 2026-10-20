import { timingSafeEqual } from "node:crypto";
import { requireDB } from "@/lib/db";
import { Lead } from "@/models";
import { fetchPerfexLead, perfexApiEnabled, submitToPerfex } from "@/lib/perfex";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Per run, so one slow CRM can't eat the whole function budget. */
const BATCH = 25;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

/**
 * Keeps the site and the CRM in step. Vercel Cron calls this (see vercel.json)
 * with `Authorization: Bearer $CRON_SECRET`.
 *
 *   1. Retry leads whose CRM push failed — the original request already
 *      returned success to the visitor, so this is the only second chance.
 *   2. Read back the status of leads that were pushed, so the admin shows
 *      whether the lead is Active / lost / converted without opening the CRM.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!perfexApiEnabled) {
    return Response.json({ skipped: "PERFEX_API_TOKEN not set" });
  }

  await requireDB();
  const result = { retried: 0, recovered: 0, refreshed: 0, errors: 0 };

  const failed = await Lead.find({ crmStatus: "failed" })
    .sort({ createdAt: 1 })
    .limit(BATCH);
  for (const lead of failed) {
    result.retried++;
    const crm = await submitToPerfex({
      name: lead.name,
      email: lead.email,
      phonenumber: lead.phonenumber === "n/a" ? "" : lead.phonenumber,
      company: lead.company,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      zip: lead.zip,
      description: [
        `Type: ${lead.type === "quotation" ? "Quotation request" : "General enquiry"}`,
        lead.service && `Service: ${lead.service}`,
        lead.budget && `Budget: ${lead.budget}`,
        lead.countryName && `Country: ${lead.countryName}`,
        lead.source && `Submitted from: ${lead.source}`,
        lead.message && `\n${lead.message}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    if (crm.ok) {
      result.recovered++;
      lead.crmStatus = "synced";
      lead.crmError = "";
      if (crm.leadId) lead.crmLeadId = crm.leadId;
    } else {
      lead.crmError = (crm.error ?? "").slice(0, 500);
    }
    await lead.save();
  }

  // Oldest-checked first, so every lead gets its turn across runs.
  const tracked = await Lead.find({
    crmLeadId: { $ne: "" },
    crmLost: false,
    crmConverted: false,
  })
    .sort({ crmCheckedAt: 1 })
    .limit(BATCH);
  for (const lead of tracked) {
    try {
      const state = await fetchPerfexLead(lead.crmLeadId);
      lead.crmCheckedAt = new Date();
      if (state) {
        lead.crmLeadStatus = state.status;
        lead.crmLost = state.lost || state.junk;
        lead.crmConverted = state.converted;
        if (state.converted || state.lost) lead.handled = true;
      } else {
        // Deleted in the CRM; stop polling it and say so.
        lead.crmLeadStatus = "Deleted in CRM";
        lead.crmLost = true;
      }
      await lead.save();
      result.refreshed++;
    } catch (e) {
      result.errors++;
      console.error("[perfex-sync] refresh failed:", lead.crmLeadId, (e as Error).message);
    }
  }

  return Response.json(result);
}
