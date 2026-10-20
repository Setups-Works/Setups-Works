import { Lead } from "@/models";
import {
  createDraftProposal,
  createLeadTask,
  crmLeadLink,
  crmProposalLink,
  nextBusinessDay,
  perfexApiEnabled,
} from "@/lib/perfex";

export interface AutomationInput {
  name: string;
  email: string;
  type: "quotation" | "enquiry";
  service?: string;
  budget?: string;
  message?: string;
  company?: string;
  source?: string;
}

export interface AutomationResult {
  proposalId?: string;
  taskId?: string;
  /** Deep links into the CRM, for the notification email. */
  links: { lead?: string; proposal?: string };
  errors: string[];
}

/**
 * Everything that happens after a lead exists in the CRM, with no human step:
 *
 *   - a DRAFT proposal on the lead, pre-filled, ready to price and send
 *   - a task "Prepare proposal for X", due the next business day
 *
 * Each step is independent and best-effort: the lead is already safe in both
 * systems, so a failure here is recorded and never fails the visitor's request.
 */
export async function runLeadAutomation(
  leadDbId: string,
  crmLeadId: string,
  d: AutomationInput,
): Promise<AutomationResult> {
  const result: AutomationResult = { links: { lead: crmLeadLink(crmLeadId) }, errors: [] };
  if (!perfexApiEnabled) return result;

  const what = d.service || (d.type === "quotation" ? "Project" : "Enquiry");
  const details = [
    d.company && `Company: ${d.company}`,
    d.service && `Service: ${d.service}`,
    d.budget && `Budget: ${d.budget}`,
    d.source && `Submitted from: ${d.source}`,
    d.message && `\n${d.message}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Only quotation requests get a proposal; a general question doesn't need one.
  const [proposal, task] = await Promise.all([
    d.type === "quotation"
      ? createDraftProposal({
          leadId: crmLeadId,
          name: d.name,
          email: d.email,
          subject: `Proposal — ${what} (${d.name})`,
          itemDescription: what,
          details,
        }).catch((e) => ({ ok: false as const, error: (e as Error).message }))
      : Promise.resolve(null),
    createLeadTask({
      leadId: crmLeadId,
      name:
        d.type === "quotation"
          ? `Prepare proposal for ${d.name}`
          : `Reply to enquiry from ${d.name}`,
      description: details,
      due: nextBusinessDay(),
    }).catch((e) => ({ ok: false as const, error: (e as Error).message })),
  ]);

  if (proposal) {
    if (proposal.ok && proposal.proposalId) {
      result.proposalId = proposal.proposalId;
      result.links.proposal = crmProposalLink(proposal.proposalId);
    } else if (!proposal.ok) result.errors.push(`proposal: ${proposal.error}`);
  }
  if (task.ok && task.taskId) result.taskId = task.taskId;
  else if (!task.ok) result.errors.push(`task: ${task.error}`);

  await Lead.findByIdAndUpdate(leadDbId, {
    crmProposalId: result.proposalId ?? "",
    crmTaskId: result.taskId ?? "",
  });
  return result;
}
