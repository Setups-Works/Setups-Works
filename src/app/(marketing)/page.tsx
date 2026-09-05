import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { ClientsMarquee } from "@/components/sections/marquee";
import { StatsSection } from "@/components/sections/stats";
import { BentoServices } from "@/components/sections/bento-services";
import { ScrollShowcase } from "@/components/sections/scroll-showcase";
import { ProductsHome } from "@/components/sections/products-home";
import { PortfolioPreview } from "@/components/sections/portfolio-preview";
import { TechStackSection } from "@/components/sections/tech-stack";
import { WhyUsSection } from "@/components/sections/why-us";
import { TestimonialsSection } from "@/components/sections/testimonials";
import { BlogPreview } from "@/components/sections/blog-preview";
import { FAQSection } from "@/components/sections/faq";
import { CTASection } from "@/components/sections/cta";
import { ReferralPopup } from "@/components/referral-popup";
import {
  JsonLd,
  organizationSchema,
  localBusinessSchema,
  websiteSchema,
  siteNavigationSchema,
  faqSchema,
  webPageSchema,
} from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/site";
import { sitelinkNav } from "@/data/nav";
import { faqs } from "@/data/site-content";
import {
  getFeaturedBlogs,
  getPortfolio,
  getTestimonials,
  getProducts,
  getClientLogos,
  getServices,
} from "@/lib/content";

/**
 * The homepage was the only route on the site without a canonical, so Google had
 * to guess which of `/`, `https://www.…`, and the sitemap's untrailed
 * `https://setups.works` was the real brand entry point. Pinning it here
 * consolidates every brand-query signal onto one URL.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  // Brand name first and unqualified — for the query "setups works" the exact
  // string needs to lead the title, not sit behind a tagline.
  title: {
    absolute: `${siteConfig.name} — Digital Agency for Web, App & AI Development`,
  },
  description: siteConfig.description,
  openGraph: {
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    // Setting `openGraph` at all opts the page out of the `opengraph-image`
    // file convention, so the image has to be named here. Without this the
    // homepage shared with no preview image at all.
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
};

export const revalidate = 300;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; utm_source?: string }>;
}) {
  const [{ from, utm_source }, blogs, portfolio, testimonials, products, logos, services] =
    await Promise.all([
      searchParams,
      getFeaturedBlogs(3),
      getPortfolio(),
      getTestimonials(true),
      getProducts(),
      getClientLogos(),
      getServices(),
    ]);

  // Any inbound link tagged with `?from=` or `?utm_source=` — a "Developed by
  // Setups Works" credit on a client site, a directory listing, anything —
  // gets a quote-request popup instead of silently landing on the homepage
  // with no way to act on that traffic.
  const ref = from || utm_source;

  return (
    <>
      {ref && (
        <ReferralPopup
          services={services.map((s) => s.title)}
          source={`homepage (ref: ${ref})`}
        />
      )}
      <JsonLd
        data={[
          organizationSchema(),
          localBusinessSchema(),
          websiteSchema(),
          webPageSchema({
            path: "/",
            name: `${siteConfig.name} — ${siteConfig.tagline}`,
            description: siteConfig.description,
            isHomePage: true,
          }),
          faqSchema(faqs),
          siteNavigationSchema(
            sitelinkNav.map((l) => ({
              name: l.label,
              url: l.href,
              description: l.description,
            })),
          ),
        ]}
      />
      <Hero />
      <ClientsMarquee logos={logos} />
      <StatsSection />
      <BentoServices services={services} />
      <ScrollShowcase />
      <ProductsHome products={products} />
      <PortfolioPreview projects={portfolio} />
      <TechStackSection />
      <WhyUsSection />
      <TestimonialsSection testimonials={testimonials} />
      <BlogPreview blogs={blogs} />
      <FAQSection />
      <CTASection />
    </>
  );
}
