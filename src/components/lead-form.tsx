"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowLeft,
  faSpinner,
  faCircleCheck,
  faFileInvoiceDollar,
  faCommentDots,
} from "@fortawesome/free-solid-svg-icons";
import { countries, DEFAULT_COUNTRY_ID } from "@/data/countries";
import { cn } from "@/lib/utils";

const BUDGETS = [
  "Under ₹50k",
  "₹50k – ₹2L",
  "₹2L – ₹5L",
  "₹5L – ₹10L",
  "₹10L+",
  "Not sure yet",
];

export interface LeadFormProps {
  /** Pre-selects the service dropdown, e.g. from a service detail page. */
  defaultService?: string;
  /** Available service names for the dropdown. */
  services?: string[];
  /** Recorded against the lead so you can see which page produced it. */
  source?: string;
  /** Called after a successful submit — used to close the modal. */
  onSuccess?: () => void;
  className?: string;
}

interface FormState {
  type: "quotation" | "enquiry";
  name: string;
  email: string;
  phonenumber: string;
  company: string;
  service: string;
  budget: string;
  message: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  website: string;
}

const initial = (defaultService = ""): FormState => ({
  type: "quotation",
  name: "",
  email: "",
  phonenumber: "",
  company: "",
  service: defaultService,
  budget: "",
  message: "",
  address: "",
  city: "",
  state: "",
  country: DEFAULT_COUNTRY_ID,
  zip: "",
  website: "",
});

const inputCls =
  "w-full rounded-xl border border-border/60 bg-surface-2/50 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-brand-500/60 focus:bg-surface-2";

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 block text-sm font-medium">
      {children}
      {required && <span className="ml-0.5 text-brand-500">*</span>}
    </span>
  );
}

export function LeadForm({
  defaultService = "",
  services = [],
  source = "",
  onSuccess,
  className,
}: LeadFormProps) {
  const [form, setForm] = useState<FormState>(initial(defaultService));
  const [step, setStep] = useState<1 | 2>(1);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  /** Step 1 is validated on the client so people aren't sent to step 2 with
      broken contact details they'd have to come back for. */
  function validateStep1() {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) e.name = "Please enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (form.phonenumber.replace(/\D/g, "").length < 6)
      e.phonenumber = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Submission failed");
      }
      setDone(true);
      toast.success("Thanks — we'll be in touch within one business day.");
      onSuccess?.();
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className={cn("rounded-2xl border border-border/60 bg-card/50 p-10 text-center", className)}>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-500/10 text-brand-500">
          <FontAwesomeIcon icon={faCircleCheck} className="size-6" />
        </span>
        <h3 className="mt-5 font-display text-2xl font-bold tracking-tight">
          Request received
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
          Thanks {form.name.split(" ")[0]}. We&apos;ve got your{" "}
          {form.type === "quotation" ? "quotation request" : "enquiry"} and
          sent a confirmation to <span className="font-medium text-foreground">{form.email}</span>.
        </p>
        <ol className="mx-auto mt-8 max-w-sm space-y-4 text-left">
          {[
            { t: "Received", d: "Your details are with our team.", on: true },
            {
              t: form.type === "quotation" ? "Proposal being prepared" : "We read it properly",
              d: "A real person reviews your project and writes it up.",
              on: false,
            },
            { t: "Reply within 1 business day", d: "Your proposal or answer lands in your inbox.", on: false },
          ].map((x) => (
            <li key={x.t} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                  x.on ? "bg-brand-500 text-white" : "bg-surface-2 text-muted-foreground",
                )}
              >
                {x.on ? "✓" : ""}
              </span>
              <span>
                <span className="block text-sm font-semibold">{x.t}</span>
                <span className="block text-sm text-muted-foreground">{x.d}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* What are they here for */}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            { v: "quotation", label: "Get a quotation", icon: faFileInvoiceDollar },
            { v: "enquiry", label: "General enquiry", icon: faCommentDots },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => set("type", o.v)}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
              form.type === o.v
                ? "border-brand-500 bg-brand-500/10"
                : "border-border/60 bg-surface-2/40 hover:border-brand-500/40",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg transition-colors",
                form.type === o.v
                  ? "bg-brand-500 text-white"
                  : "bg-brand-500/10 text-brand-500",
              )}
            >
              <FontAwesomeIcon icon={o.icon} className="size-4" />
            </span>
            <span className="text-sm font-semibold">{o.label}</span>
          </button>
        ))}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-3">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                step >= n
                  ? "bg-brand-500 text-white"
                  : "bg-surface-2 text-muted-foreground",
              )}
            >
              {n}
            </span>
            <span
              className={cn(
                "h-px flex-1 transition-colors",
                step > n ? "bg-brand-500" : "bg-border",
              )}
            />
          </div>
        ))}
      </div>

      {/* Honeypot — visually hidden, never focusable. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={form.website}
        onChange={(e) => set("website", e.target.value)}
        className="sr-only"
      />

      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground">
            About you and your project
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label required>Name</Label>
              <input
                className={cn(inputCls, errors.name && "border-destructive")}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
              />
              {errors.name && (
                <span className="mt-1 block text-xs text-destructive">{errors.name}</span>
              )}
            </label>
            <label className="block">
              <Label required>Email</Label>
              <input
                type="email"
                className={cn(inputCls, errors.email && "border-destructive")}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-destructive">{errors.email}</span>
              )}
            </label>
            <label className="block">
              <Label required>Phone</Label>
              <input
                className={cn(inputCls, errors.phonenumber && "border-destructive")}
                value={form.phonenumber}
                onChange={(e) => set("phonenumber", e.target.value)}
                placeholder="+91 00000 00000"
                autoComplete="tel"
              />
              {errors.phonenumber && (
                <span className="mt-1 block text-xs text-destructive">
                  {errors.phonenumber}
                </span>
              )}
            </label>
            <label className="block">
              <Label>Company</Label>
              <input
                className={inputCls}
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
                placeholder="Company name"
                autoComplete="organization"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label>Service</Label>
              <select
                className={inputCls}
                value={form.service}
                onChange={(e) => set("service", e.target.value)}
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>Budget</Label>
              <select
                className={inputCls}
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
              >
                <option value="">Select a range</option>
                {BUDGETS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <Label>Tell us about your project</Label>
            <textarea
              rows={4}
              className={cn(inputCls, "resize-y")}
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              placeholder="What are you building, and what does success look like?"
            />
          </label>

          <button
            type="button"
            onClick={() => validateStep1() && setStep(2)}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white transition-all hover:bg-brand-600 sm:w-auto"
          >
            Continue
            <FontAwesomeIcon
              icon={faArrowRight}
              className="size-3.5 transition-transform group-hover:translate-x-1"
            />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground">
            Where you&apos;re based
          </p>
          <label className="block">
            <Label>Address</Label>
            <textarea
              rows={2}
              className={cn(inputCls, "resize-y")}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street address"
              autoComplete="street-address"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <Label>City</Label>
              <input
                className={inputCls}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                autoComplete="address-level2"
              />
            </label>
            <label className="block">
              <Label>State</Label>
              <input
                className={inputCls}
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                autoComplete="address-level1"
              />
            </label>
            <label className="block">
              <Label>Country</Label>
              <select
                className={inputCls}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Label>Pin code</Label>
              <input
                className={inputCls}
                value={form.zip}
                onChange={(e) => set("zip", e.target.value)}
                autoComplete="postal-code"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 px-6 py-3.5 font-semibold transition-colors hover:border-brand-500/40"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="size-3.5" />
              Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-60"
            >
              <FontAwesomeIcon
                icon={sending ? faSpinner : faArrowRight}
                className={cn("size-3.5", sending && "animate-spin")}
              />
              {sending
                ? "Sending…"
                : form.type === "quotation"
                  ? "Request quotation"
                  : "Send enquiry"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            We reply within one business day. Your details are never shared.
          </p>
        </div>
      )}
    </div>
  );
}
