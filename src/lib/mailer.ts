import nodemailer from "nodemailer";
import { siteConfig } from "@/lib/site";

/**
 * SMTP mail sending. Configured entirely from environment (see .env.example);
 * when SMTP_HOST/USER/PASS are unset, `sendMail` reports a clear failure rather
 * than throwing, so a missing mail config can never take down a form
 * submission — the lead is still saved and visible in the admin.
 */
export const mailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let cached: nodemailer.Transporter | null = null;

function transporter() {
  if (cached) return cached;
  const port = Number(process.env.SMTP_PORT || 465);
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cached;
}

export interface MailResult {
  ok: boolean;
  error?: string;
}

export async function sendMail(opts: {
  subject: string;
  html: string;
  text?: string;
  to?: string;
  replyTo?: string;
}): Promise<MailResult> {
  if (!mailConfigured()) {
    return { ok: false, error: "SMTP is not configured." };
  }
  const to = opts.to || process.env.SMTP_TO || process.env.SMTP_USER;
  if (!to) return { ok: false, error: "No recipient configured (SMTP_TO)." };

  try {
    await transporter().sendMail({
      from: process.env.SMTP_FROM || `"${siteConfig.name}" <${process.env.SMTP_USER}>`,
      to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/**
 * Send a new mail or a reply, and return the raw MIME so the caller can append
 * it to the Sent folder — SMTP delivery alone never puts a copy there, which is
 * why replies sent from an app usually go missing from webmail.
 *
 * `inReplyTo`/`references` are what make a mail client thread the reply under
 * the original instead of starting a new conversation.
 */
export async function sendReply(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  references?: string[];
}): Promise<MailResult & { raw?: Buffer }> {
  if (!mailConfigured()) return { ok: false, error: "SMTP is not configured." };

  try {
    const info = await transporter().sendMail({
      from: process.env.SMTP_FROM || `"${siteConfig.name}" <${process.env.SMTP_USER}>`,
      to: opts.to,
      cc: opts.cc || undefined,
      bcc: opts.bcc || undefined,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      inReplyTo: opts.inReplyTo || undefined,
      references: opts.references?.length ? opts.references.join(" ") : undefined,
    });
    return { ok: true, raw: (info as { message?: Buffer }).message };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** Wrap a reply body in the site's branding, with the quoted original below. */
export function replyTemplate(body: string, quoted?: { from: string; date: string; html: string }) {
  const quotedBlock = quoted
    ? `
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px">
        <p style="margin:0 0 10px">On ${esc(quoted.date)}, ${esc(quoted.from)} wrote:</p>
        <blockquote style="margin:0;padding-left:14px;border-left:3px solid #e5e7eb">${quoted.html}</blockquote>
      </div>`
    : "";

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0a0b0f">
    <div style="white-space:pre-wrap">${esc(body)}</div>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">
      <p style="margin:0;font-weight:600;color:#0a0b0f">${esc(siteConfig.name)}</p>
      <p style="margin:2px 0 0">${esc(siteConfig.tagline)}</p>
      <p style="margin:6px 0 0">
        <a href="${siteConfig.url}" style="color:#4D86F7;text-decoration:none">${esc(siteConfig.url.replace(/^https?:\/\//, ""))}</a>
        &nbsp;·&nbsp; ${esc(siteConfig.email)}
      </p>
    </div>
    ${quotedBlock}
  </div>`;
}

const esc = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Branded notification email for a new lead. Plain table markup on purpose —
 * it's what survives Gmail, Outlook, and Apple Mail without a build step.
 */
/** Acknowledgement sent to the visitor the moment they submit. */
export function autoReplyTemplate(opts: { name: string; type: string }) {
  const first = esc(opts.name.split(" ")[0]);
  const what = opts.type === "quotation" ? "quotation request" : "enquiry";
  return `
  <div style="margin:0;padding:24px;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <tr><td style="padding:24px 28px;background:#0a0b0f"><p style="margin:0;color:#ffffff;font-size:18px;font-weight:700">${esc(siteConfig.name)}</p></td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0 0 12px;font-size:16px;color:#0a0b0f">Hi ${first},</p>
        <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#374151">Thanks — we've received your ${what}. A real person is reading it now.</p>
        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:#0a0b0f">What happens next</p>
        <ol style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.7;color:#374151">
          <li>We review your details and prepare a written proposal.</li>
          <li>You'll hear back from us within one business day.</li>
          <li>If it helps, we'll set up a short call to talk it through.</li>
        </ol>
        <p style="margin:0;font-size:14px;color:#374151">Just reply to this email if you want to add anything.</p>
      </td></tr>
    </table>
  </div>`;
}

export function leadEmailTemplate(lead: Record<string, string | undefined>) {
  const label = lead.type === "quotation" ? "Quotation request" : "New enquiry";
  const rows: [string, string | undefined][] = [
    ["Type", label],
    ["Service", lead.service],
    ["Budget", lead.budget],
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phonenumber],
    ["Company", lead.company],
    ["Address", lead.address],
    ["City", lead.city],
    ["State", lead.state],
    ["Country", lead.countryName],
    ["Pin code", lead.zip],
    ["Submitted from", lead.source],
    ["CRM lead", lead.crmLeadLink],
    ["Draft proposal", lead.crmProposalLink],
  ];

  const body = rows
    .filter(([, v]) => v && String(v).trim())
    .map(
      ([k, v]) => `
        <tr>
          <td style="padding:10px 16px;border-bottom:1px solid #eceef2;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top">${esc(k)}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #eceef2;color:#0a0b0f;font-size:14px;font-weight:500">${esc(String(v))}</td>
        </tr>`,
    )
    .join("");

  const message = lead.message
    ? `
      <div style="margin:24px 0 0;padding:16px 20px;background:#f6f8fb;border-left:3px solid #4D86F7;border-radius:8px">
        <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-weight:600">Project details</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#0a0b0f;white-space:pre-wrap">${esc(lead.message)}</p>
      </div>`
    : "";

  return `
  <div style="margin:0;padding:24px;background:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <tr>
        <td style="padding:24px 28px;background:#0a0b0f">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-.01em">${esc(siteConfig.name)}</p>
          <p style="margin:4px 0 0;color:#4D86F7;font-size:13px;font-weight:600">${esc(label)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${body}</table>
          ${message}
          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
            Sent from ${esc(siteConfig.url)} · also pushed to Perfex CRM
          </p>
        </td>
      </tr>
    </table>
  </div>`;
}
