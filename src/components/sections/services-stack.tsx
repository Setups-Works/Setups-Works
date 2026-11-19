import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Container, Section } from "@/components/section";
import { resolveServiceIcon } from "@/lib/service-icons";
import type { Service } from "@/lib/types";

const CATEGORY_ORDER = [
  "Development",
  "Design",
  "Growth",
  "Platforms",
  "Intelligence",
] as const;

/** Short positioning line per category, shown under the heading on each card. */
const CATEGORY_BLURB: Record<(typeof CATEGORY_ORDER)[number], string> = {
  Development: "Engineering across web, mobile, and backend — from first commit to production scale.",
  Design: "Research-driven product design and brand systems that stay consistent everywhere.",
  Growth: "Getting the work in front of people, and proving what actually moved.",
  Platforms: "The commerce, CMS, and infrastructure layers your product runs on.",
  Intelligence: "AI and automation that remove real work rather than demo well.",
};

/**
 * Category scroll-stack for /services.
 *
 * Same technique as the homepage products stack: each card is `position:
 * sticky` with an incrementally larger `top`, so as you scroll every card pins
 * just below the previous one and the next slides over it, leaving a visible
 * peek of each.
 *
 * IMPORTANT: no ancestor of these cards may set `overflow: hidden` — it clips
 * the sticky containing block and the pinning silently stops working.
 * `body { overflow-x: clip }` in globals.css handles the page-level case.
 */
export function ServicesStack({ services }: { services: Service[] }) {
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: services.filter((s) => s.category === category),
  })).filter((g) => g.items.length > 0);

  if (!groups.length) return null;

  return (
    <Section className="relative">
      <Container>
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 sm:gap-8">
          {groups.map((group, i) => (
            <div
              key={group.category}
              className="sticky"
              style={{ top: `${80 + i * 14}px` }}
            >
              <CategoryStackCard
                category={group.category}
                items={group.items}
                index={i}
              />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

function CategoryStackCard({
  category,
  items,
  index,
}: {
  category: (typeof CATEGORY_ORDER)[number];
  items: Service[];
  index: number;
}) {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-lg shadow-black/10">
      <div className="flex flex-col gap-6 p-6 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold text-brand-500">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {category}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              {CATEGORY_BLURB[category]}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border/60 bg-surface-2/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            {items.length} {items.length === 1 ? "service" : "services"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group flex h-full items-start gap-3 rounded-xl border border-border/60 bg-surface-2/40 p-4 transition-colors hover:border-brand-500/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-500/10 text-brand-500 transition-all group-hover:bg-brand-500 group-hover:text-white">
                <FontAwesomeIcon
                  icon={resolveServiceIcon(s.icon)}
                  className="size-3.5"
                />
              </span>
              {/* Titles wrap rather than truncate — "Spring Boot Development"
                  and "Mobile App Development" were being cut mid-word in the
                  three-column grid. */}
              <span className="min-w-0 flex-1">
                <span className="block font-medium leading-snug">{s.title}</span>
                <span className="mt-1 block text-xs leading-snug text-muted-foreground">
                  {s.short}
                </span>
              </span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="ml-auto mt-1 size-3 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
