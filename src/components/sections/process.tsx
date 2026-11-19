"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Container, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/motion-primitives";
import { processSteps } from "@/data/site-content";

export function ProcessSection() {
  return (
    <Section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-60 mask-fade-b"
      />
      <Container>
        <SectionHeading
          eyebrow="How we work"
          title="A process built to ship"
          description="Six deliberate stages that turn ambitious ideas into products people love — with progress you can see every week."
        />

        <div className="relative mt-16">
          <div
            aria-hidden
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent lg:block"
          />
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-12">
            {processSteps.map((step, i) => (
              <Reveal
                key={step.step}
                delay={0.05}
                className={i % 2 === 1 ? "lg:mt-16" : ""}
              >
                <div className="group relative rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur-sm transition-colors hover:border-brand-500/40">
                  <div className="flex items-center gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-500 transition-all group-hover:bg-brand-500 group-hover:text-white">
                      <FontAwesomeIcon icon={step.icon} className="size-5" />
                    </span>
                    <span className="font-mono text-4xl font-bold text-border transition-colors group-hover:text-brand-500/40">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
