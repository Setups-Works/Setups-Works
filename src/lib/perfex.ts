/**
 * Perfex CRM integration.
 *
 * Preferred path: the REST API (`PERFEX_API_TOKEN`). It returns the new lead's
 * id, which lets the site track the lead's status afterwards (see
 * `fetchPerfexLead` and /api/cron/perfex-sync).
 *
 * Fallback path (no token configured): web-to-lead form submission, described
 * below. It cannot return an id, so those leads are never status-tracked.
 *
 * Perfex CRM web-to-lead submission.
 *
 * Perfex runs on CodeIgniter, whose CSRF protection is a matched pair: a
 * `csrf_cookie_name` cookie and a `csrf_token_name` form field carrying the
 * same value. Neither can be hardcoded — the token rotates. So every
 * submission is a two-step handshake:
 *
 *   1. GET the public form, read the token out of the HTML and the cookie out
 *      of the response headers.
 *   2. POST multipart/form-data carrying both.
 *
 * The form is also `enctype="multipart/form-data"`, so the body must be
 * FormData; a urlencoded body is rejected.
 *
 * Verified against the live form: no reCAPTCHA is enabled on it, so a
 * server-side submission is accepted. If reCAPTCHA is ever switched on in the
 * CRM, this will start failing and the lead will fall back to `crmStatus:
 * "failed"` — visible in the admin rather than silently dropped.
 */

const FORM_URL =
  process.env.PERFEX_WTL_URL ||
  "https://crm.setups.works/forms/wtl/0a48d75db8dc944eeaf03c8951696d5f";

/** The form key is the last path segment of the web-to-lead URL. */
function formKey(url: string): string {
  return url.split("/").filter(Boolean).pop() ?? "";
}

export interface PerfexLead {
  name: string;
  email: string;
  phonenumber: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  /** Perfex numeric country id, e.g. "102" for India. */
  country?: string;
  zip?: string;
  /**
   * Perfex's form has no description field by default. It is sent anyway —
   * CodeIgniter ignores unknown POST fields — so that it lands in the CRM
   * automatically if a Description field is ever added to the form.
   */
  description?: string;
}

export interface PerfexResult {
  ok: boolean;
  status?: number;
  error?: string;
  /** Perfex lead id. Only the REST API path can return one. */
  leadId?: string;
}

const API_URL = (
  process.env.PERFEX_API_URL || "https://crm.setups.works/api"
).replace(/\/+$/, "");
const API_TOKEN = process.env.PERFEX_API_TOKEN || "";

/** Lead source / status / owner ids in the CRM (Setup > Leads). */
const LEAD_SOURCE = process.env.PERFEX_LEAD_SOURCE_ID || "1";
const LEAD_STATUS = process.env.PERFEX_LEAD_STATUS_ID || "2";
const LEAD_ASSIGNED = process.env.PERFEX_ASSIGNED_STAFF_ID || "1";

export const perfexApiEnabled = Boolean(API_TOKEN);

async function api<T>(
  path: string,
  init: { method?: string; json?: unknown } = {},
): Promise<{ ok: boolean; status: number; body: T | null }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      authtoken: API_TOKEN,
      Accept: "application/json",
      ...(init.json ? { "Content-Type": "application/json" } : {}),
    },
    body: init.json ? JSON.stringify(init.json) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await res.json().catch(() => null)) as T | null;
  return { ok: res.ok, status: res.status, body };
}

interface ApiEnvelope<D = unknown> {
  status?: boolean;
  message?: string;
  error?: string;
  record_id?: string | number;
  data?: D;
}

/** Create a lead through the REST API. */
async function createViaApi(lead: PerfexLead): Promise<PerfexResult> {
  const { ok, status, body } = await api<ApiEnvelope>("/leads", {
    method: "POST",
    json: {
      name: lead.name,
      email: lead.email,
      phonenumber: lead.phonenumber,
      company: lead.company ?? "",
      address: lead.address ?? "",
      city: lead.city ?? "",
      state: lead.state ?? "",
      country: lead.country ?? "",
      zip: lead.zip ?? "",
      description: lead.description ?? "",
      source: LEAD_SOURCE,
      status: LEAD_STATUS,
      assigned: LEAD_ASSIGNED,
    },
  });

  if (!ok || body?.status === false) {
    return {
      ok: false,
      status,
      error: body?.message || body?.error || `CRM API returned ${status}`,
    };
  }

  const id =
    body?.record_id ??
    (body?.data as { record_id?: string | number; id?: string | number } | undefined)?.record_id ??
    (body?.data as { id?: string | number } | undefined)?.id;
  return { ok: true, status, leadId: id != null ? String(id) : undefined };
}

/** Where the CRM's admin UI lives, for links in notification emails. */
export const crmAdminUrl = API_URL.replace(/\/api$/, "") + "/admin";
export const crmLeadLink = (id: string) => `${crmAdminUrl}/leads/index/${id}`;
export const crmProposalLink = (id: string) =>
  `${crmAdminUrl}/proposals/list_proposals/${id}`;

const CURRENCY = process.env.PERFEX_CURRENCY_ID || "3";
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Next working day (Mon–Fri), matching the "reply within one business day" promise. */
export function nextBusinessDay(from = new Date()): Date {
  const d = new Date(from);
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  return d;
}

function recordId(body: ApiEnvelope | null): string | undefined {
  const id =
    body?.record_id ?? (body?.data as { record_id?: string | number } | undefined)?.record_id;
  return id != null ? String(id) : undefined;
}

/**
 * Create a DRAFT proposal on the lead, pre-filled from the enquiry, for the
 * owner to price and send from the CRM. Draft = status 6; nothing reaches the
 * customer until someone sends it. One placeholder line at rate 0 because the
 * API requires at least one item.
 */
export async function createDraftProposal(opts: {
  leadId: string;
  name: string;
  email: string;
  subject: string;
  itemDescription: string;
  details: string;
}): Promise<{ ok: boolean; proposalId?: string; error?: string }> {
  const today = new Date();
  const until = new Date(today);
  until.setDate(until.getDate() + 30);
  const { ok, status, body } = await api<ApiEnvelope>("/proposals", {
    method: "POST",
    json: {
      subject: opts.subject,
      Related: "lead",
      rel_id: opts.leadId,
      proposal_to: opts.name,
      Email: opts.email,
      date: iso(today),
      open_till: iso(until),
      currency: CURRENCY,
      discount_type: "",
      status: "6",
      Assigned: LEAD_ASSIGNED,
      content: opts.details,
      newitems: [
        {
          description: opts.itemDescription,
          long_description: "",
          qty: "1",
          rate: "0",
          unit: "",
          order: "1",
        },
      ],
    },
  });
  if (!ok || body?.status === false) {
    return { ok: false, error: body?.message || body?.error || `CRM API returned ${status}` };
  }
  return { ok: true, proposalId: recordId(body) };
}

/** Create a task on the lead so "prepare proposal" shows up in the CRM to-do list. */
export async function createLeadTask(opts: {
  leadId: string;
  name: string;
  description: string;
  due: Date;
}): Promise<{ ok: boolean; taskId?: string; error?: string }> {
  const { ok, status, body } = await api<ApiEnvelope>("/tasks", {
    method: "POST",
    json: {
      name: opts.name,
      startdate: iso(new Date()),
      duedate: iso(opts.due),
      priority: "3",
      rel_type: "lead",
      rel_id: opts.leadId,
      assignees: LEAD_ASSIGNED,
      description: opts.description,
    },
  });
  if (!ok || body?.status === false) {
    return { ok: false, error: body?.message || body?.error || `CRM API returned ${status}` };
  }
  return { ok: true, taskId: recordId(body) };
}

export interface PerfexLeadState {
  /** Status name, e.g. "Active". */
  status: string;
  lost: boolean;
  junk: boolean;
  converted: boolean;
}

/**
 * Read a lead's current state. `null` means the lead no longer exists in the
 * CRM (deleted there); throws on transport errors so callers can retry later.
 */
export async function fetchPerfexLead(id: string): Promise<PerfexLeadState | null> {
  const { ok, status, body } = await api<
    ApiEnvelope<{
      status_name?: string;
      lost?: string;
      junk?: string;
      date_converted?: string | null;
    }>
  >(`/leads/${encodeURIComponent(id)}`);

  if (status === 404) return null;
  if (!ok || !body?.data) throw new Error(`CRM API returned ${status}`);

  // Single-record responses may arrive as an object or a one-item array.
  const d = Array.isArray(body.data) ? body.data[0] : body.data;
  if (!d) return null;
  return {
    status: d.status_name ?? "",
    lost: d.lost === "1",
    junk: d.junk === "1",
    converted: Boolean(d.date_converted),
  };
}

/** Pull the CSRF token value out of the rendered form HTML. */
function extractToken(html: string): string | null {
  const m = html.match(
    /name="csrf_token_name"[^>]*value="([^"]+)"|value="([^"]+)"[^>]*name="csrf_token_name"/,
  );
  return m ? (m[1] ?? m[2] ?? null) : null;
}

/** Collect the Set-Cookie pairs we need to echo back on the POST. */
function extractCookies(res: Response): string {
  // getSetCookie() is the only way to see multiple Set-Cookie headers; Perfex
  // sends both csrf_cookie_name and sp_session and the POST needs both.
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : ([res.headers.get("set-cookie")].filter(Boolean) as string[]);
  return raw.map((c) => c.split(";")[0]).join("; ");
}

export async function submitToPerfex(lead: PerfexLead): Promise<PerfexResult> {
  if (perfexApiEnabled) {
    try {
      return await createViaApi(lead);
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }
  return submitViaWebToLead(lead);
}

async function submitViaWebToLead(lead: PerfexLead): Promise<PerfexResult> {
  const url = FORM_URL;

  try {
    // --- 1. Handshake: fetch a fresh token + session cookies -------------
    const pageRes = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "SetupsWorksSite/1.0" },
      cache: "no-store",
    });

    if (!pageRes.ok) {
      return { ok: false, status: pageRes.status, error: `Form fetch failed (${pageRes.status})` };
    }

    const html = await pageRes.text();
    const token = extractToken(html);
    const cookies = extractCookies(pageRes);

    if (!token) {
      return { ok: false, error: "Could not read CSRF token from the CRM form." };
    }

    // --- 2. Submit -------------------------------------------------------
    const body = new FormData();
    body.append("csrf_token_name", token);
    body.append("key", formKey(url));
    body.append("name", lead.name);
    body.append("email", lead.email);
    body.append("phonenumber", lead.phonenumber);
    body.append("company", lead.company ?? "");
    body.append("address", lead.address ?? "");
    body.append("city", lead.city ?? "");
    body.append("state", lead.state ?? "");
    body.append("country", lead.country ?? "");
    body.append("zip", lead.zip ?? "");
    if (lead.description) body.append("description", lead.description);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Cookie: cookies,
        Referer: url,
        "User-Agent": "SetupsWorksSite/1.0",
      },
      body,
      redirect: "manual",
      cache: "no-store",
    });

    // Verified against the live form: on success Perfex replies 200 with the
    // JSON body {"success":true}. Some configurations redirect to a thank-you
    // page instead, so both are treated as success. A 200 that re-renders the
    // form is CodeIgniter reporting validation failure.
    if (res.status >= 300 && res.status < 400) {
      return { ok: true, status: res.status };
    }

    if (res.ok) {
      const text = await res.text();

      try {
        const json = JSON.parse(text) as { success?: boolean; message?: string };
        if (typeof json.success === "boolean") {
          return json.success
            ? { ok: true, status: res.status }
            : {
                ok: false,
                status: res.status,
                error: json.message || "CRM rejected the submission.",
              };
        }
      } catch {
        // Not JSON — fall through to the HTML checks below.
      }

      if (!text.includes('name="csrf_token_name"')) {
        return { ok: true, status: res.status };
      }
      const err = text.match(/<div[^>]*class="[^"]*alert[^"]*"[^>]*>([\s\S]{0,300}?)<\/div>/i);
      return {
        ok: false,
        status: res.status,
        error: err
          ? err[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
          : "CRM rejected the submission (validation failed).",
      };
    }

    return { ok: false, status: res.status, error: `CRM returned ${res.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
