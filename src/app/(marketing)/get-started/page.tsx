import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faClock,
  faShieldHalved,
  faEnvelope,
  faPhone,
  faStar,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import { Container, Section } from "@/components/section";
import { Reveal } from "@/components/motion-primitives";
import { LeadForm } from "@/components/lead-form";
import { JsonLd, pageSchemas } from "@/components/seo/json-ld";
import { getServices, getTestimonials, getClientLogos } from "@/lib/content";
import { resolveServiceIcon } from "@/lib/service-icons";
import { stats } from "@/data/site-content";
import { siteConfig } from "@/lib/site";

const description =
  "Request a quotation or send an enquiry to Setups Works. Tell us about your web, mobile, or AI project and we'll reply within one business day.";

export const metadata: Metadata = {
  alternates: { canonical: "/get-started" },
  title: "Start a Project",
  description,
  openGraph: {
    title: `Start a Project · ${siteConfig.name}`,
    description,
    url: "/get-started",
  },
};

export const revalidate = 300;

const nextSteps = [
  {
    title: "We read it properly",
    body: "A real person reviews your enquiry — not an autoresponder, not a chatbot.",
    when: "Same day",
  },
  {
    title: "We reply with questions",
    body: "Usually a short note covering scope, constraints, and anything unclear.",
    when: "Within 1 business day",
  },
  {
    title: "A call, if it helps",
    body: "Thirty minutes to talk through the problem. No pitch deck, no pressure.",
    when: "At your convenience",
  },
  {
    title: "A written proposal",
    body: "Scope, approach, and cost in writing so you can compare it against anyone else.",
    when: "After the call",
  },
];

const assurances = [
  {
    icon: faClock,
    title: "Reply within a day",
    body: "A real person reads every submission and responds within one business day.",
  },
  {
    icon: faShieldHalved,
    title: "Your details stay private",
    body: "We never share or sell your information, and we don't add you to a mailing list.",
  },
  {
    icon: faCircleCheck,
    title: "No obligation",
    body: "A quotation is just a conversation. There's nothing to commit to.",
  },
];

export default async function GetStartedPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const [{ ref }, services, testimonials, logos] = await Promise.all([
    searchParams,
    getServices(),
    getTestimonials(true),
    getClientLogos(),
  ]);

  const quote = testimonials[0];

  return (
    <>
      <JsonLd
        data={pageSchemas({ path: "/get-started", label: "Start a Project", description })}
      />

      {/* Hero + form share one section so the form sits in the hero rather than
          below it — the whole point of this page is the form. */}
      <section className="relative isolate overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-36">

        <Container className="relative">
          {/* Pitch on the left, form on the right. The form column is the wider
              of the two so the inputs never feel cramped. Order classes are the
              same on mobile and desktop — the pitch reads first either way, so
              the page opens with context rather than a wall of inputs. */}
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            {/* Form */}
            <Reveal className="order-2">
              <div className="relative">
                {ref && (
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-brand-500" />
                    Thanks for checking us out — glad you liked what you saw.
                  </p>
                )}
                <div className="rounded-3xl border border-border/60 bg-card/80 p-6 backdrop-blur-xl sm:p-8">
                  <LeadForm
                    services={services.map((s) => s.title)}
                    source={ref ? `/get-started (ref: ${ref})` : "/get-started"}
                  />
                </div>
              </div>
            </Reveal>

            {/* Pitch */}
            <div className="order-1 lg:sticky lg:top-28">
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-500">
                  <span className="size-1.5 rounded-full bg-brand-500" />
                  Start a project
                </span>
              </Reveal>

              <Reveal delay={0.05}>
                <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Tell us what
                  <br />
                  you&apos;re{" "}
<span className="text-brand-500">building</span>
                </h1>
              </Reveal>

              <Reveal delay={0.1}>
                <p className="mt-5 max-w-md text-lg text-muted-foreground text-balance">
                  Request a quotation or ask a question. Either way you&apos;ll
                  hear back from a real person within one business day.
                </p>
              </Reveal>

              {/* Proof */}
              <Reveal delay={0.15}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FontAwesomeIcon
                          key={i}
                          icon={faStar}
                          className="size-3.5 text-amber-400"
                        />
                      ))}
                    </span>
                    <span className="font-semibold">4.9/5</span>
                    <span className="text-muted-foreground">from 10+ clients</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FontAwesomeIcon icon={faLocationDot} className="size-3.5 text-brand-500" />
                    {siteConfig.location}
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border/60 pt-8">
                  {stats.slice(0, 3).map((s) => (
                    <div key={s.label}>
                      <p className="font-display text-2xl font-bold tracking-tight text-brand-500 sm:text-3xl">
                        {s.value}
                        {s.suffix}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </Reveal>

              {quote && (
                <Reveal delay={0.25}>
                  <figure className="mt-8 rounded-2xl border border-border/60 bg-card/50 p-6">
                    <blockquote className="text-sm leading-relaxed text-muted-foreground">
                      “{quote.review}”
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      {quote.photo ? (
                        <Image
                          src={quote.photo}
                          alt=""
                          width={36}
                          height={36}
                          className="size-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="grid size-9 place-items-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-500">
                          {quote.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="text-sm">
                        <span className="block font-semibold">{quote.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {[quote.role, quote.company].filter(Boolean).join(", ")}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Client logos */}
      {logos.length > 0 && (
        <Section className="border-y border-border/60 py-10">
          <Container>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Trusted by ambitious teams worldwide
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {logos.slice(0, 6).map((l) => (
                <span key={l._id ?? l.name} className="relative h-8 w-28 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0">
                  {l.logo && (
                    <Image
                      src={l.logo}
                      alt={l.name}
                      fill
                      sizes="112px"
                      className="object-contain"
                    />
                  )}
                </span>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* What happens after they hit send — the single biggest unknown for
          anyone filling in an enquiry form. */}
      <Section>
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-500">
                What happens next
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                No black holes, no chasing
              </h2>
              <p className="mt-3 text-muted-foreground">
                You&apos;ll always know where things stand. Here&apos;s exactly
                what follows once you hit send.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nextSteps.map((s, i) => (
              <Reveal key={s.title} delay={0.05 * i}>
                <div className="relative h-full rounded-2xl border border-border/60 bg-card/50 p-6">
                  <span className="font-mono text-sm font-bold text-brand-500">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-500">
                    <FontAwesomeIcon icon={faClock} className="size-3" />
                    {s.when}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* What we can help with — turns a blank "which service?" into a menu. */}
      <Section className="py-12">
        <Container>
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  Not sure what you need?
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  Pick the closest fit in the form, or just describe the problem
                  — we&apos;ll tell you honestly whether we&apos;re the right team.
                </p>
              </div>
            </div>
          </Reveal>
          <div className="mt-8 flex flex-wrap gap-2">
            {services.slice(0, 14).map((s, i) => (
              <Reveal key={s.slug} delay={(i % 7) * 0.03}>
                <Link
                  href={`/services/${s.slug}`}
                  className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-surface-2/40 px-4 py-2.5 text-sm font-medium transition-colors hover:border-brand-500/40 hover:text-brand-500"
                >
                  <FontAwesomeIcon
                    icon={resolveServiceIcon(s.icon)}
                    className="size-3.5 text-brand-500"
                  />
                  {s.title}
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* Assurances + direct contact */}
      <Section>
        <Container>
          <div className="grid gap-4 lg:grid-cols-4">
            {assurances.map((a, i) => (
              <Reveal key={a.title} delay={0.05 * i}>
                <div className="h-full rounded-2xl border border-border/60 bg-card/50 p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
                    <FontAwesomeIcon icon={a.icon} className="size-4" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold tracking-tight">
                    {a.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{a.body}</p>
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.15}>
              <div className="h-full rounded-2xl border border-brand-500/30 bg-brand-500/10 p-6">
                <h3 className="font-display text-base font-semibold tracking-tight">
                  Prefer to talk?
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-brand-500"
                  >
                    <FontAwesomeIcon icon={faEnvelope} className="size-3.5 text-brand-500" />
                    {siteConfig.email}
                  </a>
                  <a
                    href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-brand-500"
                  >
                    <FontAwesomeIcon icon={faPhone} className="size-3.5 text-brand-500" />
                    {siteConfig.phone}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}
