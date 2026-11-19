"use client";

import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { Container, Section, Eyebrow } from "@/components/section";
import { Reveal } from "@/components/motion-primitives";
import GlareHover from "@/components/reactbits/GlareHover";
import ShinyText from "@/components/reactbits/ShinyText";
import type { Product } from "@/lib/types";

export function FeaturedProduct({ product }: { product: Product }) {
  return (
    <Section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 grid-bg opacity-40 mask-fade-b"
      />
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Reveal>
              <Eyebrow>Our own product</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid size-12 place-items-center overflow-hidden rounded-2xl border border-border/60 bg-surface-2">
                  <Image src={product.logo} alt="" width={30} height={30} className="size-8" />
                </span>
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {product.name}
                </h2>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-500">
                  Coming Soon
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 text-lg text-muted-foreground text-balance">
                {product.description}
              </p>
            </Reveal>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {product.features.slice(0, 4).map((f, i) => (
                <Reveal key={f.title} delay={0.12 + i * 0.05}>
                  <li className="flex items-start gap-2.5">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="mt-0.5 size-4 shrink-0 text-brand-500"
                    />
                    <span className="text-sm">
                      <span className="font-medium">{f.title}</span>
                      <span className="block text-muted-foreground">
                        {f.description}
                      </span>
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href={`/products/${product.slug}`}
                  className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 font-semibold text-white transition-all hover:bg-brand-600"
                >
                  Join the waitlist
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="size-3.5 transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <ShinyText
                  text={product.version || "Private beta"}
                  speed={4}
                  className="text-sm font-medium"
                />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <GlareHover
              width="100%"
              height="auto"
              borderRadius="24px"
              glareColor="#4D86F7"
              glareOpacity={0.25}
              className="!border-border/60 !bg-card/40"
            >
              <div className="relative aspect-[16/11] w-full overflow-hidden rounded-3xl">
                <Image
                  src={product.banner}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </GlareHover>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
