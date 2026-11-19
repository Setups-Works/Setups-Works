import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Container, Section, SectionHeading } from "@/components/section";
import { Reveal } from "@/components/motion-primitives";
import { ServiceCard } from "@/components/cards";
import { services } from "@/data/services";

export function ServicesPreview() {
  const featured = services.slice(0, 8);
  return (
    <Section id="services" className="relative">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            align="left"
            eyebrow="What we do"
            title={
              <>
                Full-service digital
                <br className="hidden sm:block" /> product studio
              </>
            }
            description="From first pixel to production scale — one team for design, engineering, and growth."
          />
          <Reveal>
            <Link
              href="/services"
              className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-border/60 px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-500/40"
            >
              All {services.length} services
              <FontAwesomeIcon
                icon={faArrowRight}
                className="size-3 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 4) * 0.06}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
