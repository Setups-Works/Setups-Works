import type { Metadata } from "next";

export const siteConfig = {
  name: "Setups Works",
  shortName: "Setups Works",
  tagline: "The Digital Agency.",
  description:
    "Setups Works is a premium digital agency crafting high-performance websites, web & mobile apps, AI products, and brand experiences that move businesses forward.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "info@setups.works",
  phone: "+91 6383984698",
  location: "Chennai, Tamil Nadu, India",
  /** ISO 8601. Full dates are preferred over a bare year. */
  foundingDate: "2020-06-20",
  priceRange: "$$",
  address: {
    /**
     * Street address for LocalBusiness schema. Google treats a PostalAddress
     * without a street as a weak local signal, and it should match the Google
     * Business Profile listing exactly. Left blank rather than guessed —
     * emitted only when filled in.
     */
    street: "1009G, Govintha Reddy Street, Elavur",
    /**
     * The town the street address is actually in. This said "Chennai", which
     * contradicted every other geographic field: the street is in Elavur, the
     * postcode 601201 is Gummidipoondi, and the coordinates below sit ~45km
     * north of central Chennai. Google cross-checks locality against postcode,
     * coordinates, and the Business Profile — a mismatch weakens all of them.
     * Chennai is still claimed, honestly, through `areaServed`.
     *
     * Must match the Google Business Profile listing exactly.
     */
    locality: "Gummidipoondi",
    region: "Tamil Nadu",
    postalCode: "601201",
    country: "IN",
  },
  /**
   * Business identifiers Google lists as recommended Organization properties
   * (developers.google.com/search/docs/appearance/structured-data/organization).
   * Each is emitted only when non-empty — a blank identifier is worse than an
   * absent one. Nothing here is guessed; fill in what the business actually has.
   *
   * For an Indian services business, realistically only two of these apply:
   *   taxID            — your GSTIN (or PAN). The one worth filling in.
   *   numberOfEmployees — a plain count, e.g. "12".
   *
   * The rest are registry-specific and only apply if you're enrolled:
   *   vatID   — EU/UK VAT. India uses GST, so normally blank.
   *   duns    — Dun & Bradstreet, only if you hold a DUNS number.
   *   leiCode — ISO 17442, effectively finance-sector only.
   *   naics   — North American industry classification.
   *   globalLocationNumber — GS1, supply-chain/retail.
   */
  identifiers: {
    taxID: "",
    vatID: "",
    duns: "",
    leiCode: "",
    naics: "",
    globalLocationNumber: "",
  },
  /** Headcount for Organization.numberOfEmployees. Blank = not emitted. */
  numberOfEmployees: "10",
  geo: { lat: 13.459948725379245, lng: 80.11290785179675 },
  googleBusiness: "https://share.google/Du9pH2y5ZFtvl847t",
  /** Canonical Google Maps listing URL (CID form) — stable entity anchor for hasMap. */
  googleMaps: "https://maps.google.com/?cid=12795956607791697816",
  /** Google Maps embed for the contact page. */
  mapEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3385.096180109854!2d80.11040097442232!3d13.459936386902154!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4d8367c3c32a81%3A0xb1945ebd28bc8f98!2sSetups%20Works!5e1!3m2!1sen!2sin!4v1784478521137!5m2!1sen!2sin",
  wikidata: "https://www.wikidata.org/wiki/Q140500419",
  /**
   * Crunchbase profile. Independent corroboration of the organization from a
   * database Google already trusts — the kind of third-party source the
   * Knowledge Graph weights far above anything self-published here.
   */
  crunchbase: "https://www.crunchbase.com/organization/setups-works",
  areaServed: ["Chennai", "Tamil Nadu", "India", "Worldwide"],
  founderProfile: {
    name: "Nitheesh Rajendran",
    jobTitle: "Founder & CEO",
    /**
     * Where the founder is based, which is not the agency's registered
     * locality. `address.locality` stays "Gummidipoondi" because it has to
     * match postcode 601201 and the Business Profile; the person lives in the
     * village the street address is actually in.
     */
    homeLocation: "Elavur, Tamil Nadu",
    /** 1500x1500. Used when the CMS founder record has no photo of its own. */
    image: {
      url: "https://res.cloudinary.com/dvtsr6ch/image/upload/v1783274785/setupsworks/jtlq18stwgen5swe3dwv.jpg",
      width: 1500,
      height: 1500,
    },
    description:
      "Founder & CEO of Setups Works. Passionate about Artificial Intelligence, software engineering, and building developer tools that help programmers prepare for coding interviews.",
    /**
     * Family relationships — feeds Person.parent / Person.sibling in the
     * JSON-LD schema below. Corroborates the Person entity for Knowledge
     * Graph reconciliation the same way alumniOf and worksFor do: named
     * relationships, not just text.
     */
    family: {
      father: "Rajendran",
      mother: "Mari Rajendran",
      siblings: ["Thilac Rajendran", "Abinash Rajendran"],
    },
    /**
     * The university exactly as Google's own entity names it — the founder is
     * already listed under its "Notable alumni", so matching that string and
     * pointing at the same Wikidata/Wikipedia identifiers lets Google tie our
     * Person node to the institution it already knows rather than to a
     * differently-named one. "Vels University" is the former/common name and
     * does not match the entity.
     */
    alumniOf: {
      name: "Vels Institute of Science, Technology & Advanced Studies",
      alternateName: "VISTAS",
      url: "https://vistas.ac.in",
      sameAs: [
        "https://www.wikidata.org/wiki/Q7919327",
        "https://en.wikipedia.org/wiki/Vels_Institute_of_Science,_Technology_%26_Advanced_Studies",
      ],
    },
    knowsAbout: [
      "Artificial Intelligence",
      "Software Engineering",
      "Competitive Programming",
      "Data Structures and Algorithms",
      "Technical Interview Preparation",
      "Frontend Development",
      "React",
      "Next.js",
      "TypeScript",
      "Machine Learning",
      "Web Development",
    ],
    sameAs: [
      "https://www.linkedin.com/in/nitheeshdr/",
      "https://github.com/nitheeshdr",
      "https://www.imdb.com/name/nm16304237/",
      "https://www.youtube.com/@nitheeshrajendran",
      "https://www.wikidata.org/wiki/Q140500455",
      // Google Knowledge Panel share link — helps Google reconcile this Person
      // entity with its existing panel.
      "https://share.google/R49gz3hj0ZA74MmQt",
      // Crunchbase person profile. Deliberately the person URL, not the
      // organization one — the org's Crunchbase page belongs in `orgSameAs`,
      // and crossing the two is what makes a search engine merge the person
      // and the company into a single entity.
      "https://www.crunchbase.com/person/nitheesh-rajendran",
    ],
  },
  ogImage: "/opengraph-image",
  links: {
    twitter: "https://x.com/setupsworks",
    github: "https://github.com/nitheeshdr",
    linkedin: "https://linkedin.com/company/setups-works",
    instagram: "https://instagram.com/setups.works",
    /**
     * Google Play developer page. A strong entity signal: it is a Google-owned
     * property carrying a verified developer identity, which corroborates the
     * organization independently of anything we publish about ourselves.
     */
    playStore: "https://play.google.com/store/apps/dev?id=5478157836712207943",
    /**
     * Podcast. Another independent source asserting the same organization
     * name, founder, and location — which is the corroboration entity
     * reconciliation runs on. The Spotify show page is the canonical public
     * URL; the RSS feed is the machine-readable one.
     */
    podcast: "https://open.spotify.com/show/033X7FZ7Z2eoDwq5wj60y9",
    podcastApple: "https://podcasts.apple.com/us/podcast/setups-works/id6795401285",
    /**
     * Amazon Music. All regional domains (.com/.in/.co.uk) serve the same show
     * id and Amazon declares no canonical, so the region here is arbitrary —
     * switch to music.amazon.in if you'd rather point at the home market.
     */
    podcastAmazon:
      "https://music.amazon.co.uk/podcasts/b084455b-d0c3-4048-b8c3-bde624ba7fb8/setups-works",
    podcastFeed: "https://anchor.fm/s/115683bdc/podcast/rss",
  },
  keywords: [
    "digital agency",
    "web development",
    "react development",
    "next.js agency",
    "MERN stack",
    "UI UX design",
    "mobile app development",
    "AI development",
    "SEO",
    "branding",
  ],
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * The full postal address as one display string, built from the same fields
 * `localBusinessSchema()` emits — so the text visitors (and citation
 * directories) see can never drift from what's in the structured data or the
 * Google Business Profile listing. Matches GBP formatting exactly: no comma
 * before the postal code.
 */
export const fullAddress =
  `${siteConfig.address.street}, ${siteConfig.address.locality}, ` +
  `${siteConfig.address.region} ${siteConfig.address.postalCode}`;

/**
 * One page description, fanned out to every tag that carries one.
 *
 * Next inherits an un-set `openGraph` object from the root layout wholesale —
 * setting only `description` on a page leaves `og:description` and
 * `twitter:description` as the site-wide blurb. Every index page did exactly
 * that, so a crawler saw the same sentence on /careers, /blog and /portfolio
 * no matter what the meta description said, and shares of those URLs previewed
 * the generic agency line instead of the page's own.
 *
 * Pass `openGraph` to add or override fields (images, `type`) without losing
 * the description wiring.
 */
export function pageMetadata({
  title,
  description,
  path,
  openGraph,
}: {
  /** Page title, unqualified — the root layout appends the site name. */
  title: string;
  description: string;
  /** Root-relative, e.g. "/careers". Resolved against `metadataBase`. */
  path: string;
  openGraph?: Metadata["openGraph"];
}): Metadata {
  // og:title gets the site name spelled out, because the root layout's
  // `%s · Setups Works` template applies to <title> only.
  const qualified = `${title} · ${siteConfig.name}`;
  // Matches the `alt` exported by app/opengraph-image.tsx.
  const ogAlt = `${siteConfig.name} — ${siteConfig.tagline}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title: qualified,
      description,
      siteName: siteConfig.name,
      // Declared, not inherited. Next injects the `opengraph-image` file
      // convention only into pages that don't set `openGraph` themselves —
      // declaring the object to fix the description would otherwise drop
      // og:image entirely, which is what happened to the homepage.
      images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: ogAlt }],
      ...openGraph,
    },
    twitter: { title: qualified, description, images: [siteConfig.ogImage] },
  };
}
