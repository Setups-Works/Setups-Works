import { siteConfig } from "@/lib/site";
import type { Blog, Product, Portfolio, Founder, Service, TeamMember } from "@/lib/types";
import type { JobOpening } from "@/data/site-content";
import { stripHtml, truncate, slugify } from "@/lib/helpers";

/**
 * Renders every schema for a page as ONE `@graph` document.
 *
 * Previously each node became its own `<script>` tag with its own `@context`,
 * which repeated the context on every node and left consumers to work out that
 * separate tags describe one connected graph. A single `@graph` states the
 * relationship directly: the nodes are siblings, and an `@id` in one resolves
 * against the others in the same document.
 *
 * Per-node `@context` keys are stripped here rather than at each call site, so
 * the builders below stay independently usable and there is one place that
 * decides how the document is assembled.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const nodes = (Array.isArray(data) ? data : [data]).filter(Boolean);
  if (!nodes.length) return null;

  const graph = nodes.map((node) => {
    const { "@context": _context, ...rest } = node as Record<string, unknown>;
    return rest;
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }),
      }}
    />
  );
}

/**
 * Brand/company social profiles ONLY — the accounts that belong to Setups Works
 * itself. The founder's personal profiles (his GitHub, LinkedIn, IMDb, YouTube)
 * must NOT appear here, or search engines conflate the org with the person.
 */
const orgSameAs: string[] = [
  siteConfig.links.twitter, // x.com/setupsworks
  siteConfig.links.linkedin, // linkedin.com/company/setups-works
  siteConfig.links.instagram, // instagram.com/setups.works
  siteConfig.links.playStore, // Google Play developer page — verified publisher
  siteConfig.links.podcast, // Spotify show — third-party corroboration
  siteConfig.links.podcastApple, // Apple Podcasts — second independent directory
  siteConfig.links.podcastAmazon, // Amazon Music — third
  siteConfig.googleBusiness, // GBP share link
  siteConfig.googleMaps, // canonical Maps listing (CID) — local entity anchor
  siteConfig.wikidata, // wikidata.org/wiki/Q140500419 — entity anchor
  siteConfig.crunchbase, // independent company database
].filter(Boolean);
/**
 * Founding date as a full ISO 8601 datetime, for the schemas that require one.
 *
 * Google's ProfilePage needs a datetime with time and offset, not a bare date.
 * This normalizes whatever `foundingDate` holds — a bare year like "2020" or a
 * full "2020-06-20" — into a valid value. The previous code appended
 * "-01-01T00:00:00+05:30" unconditionally, which silently produced the
 * malformed "2020-06-20-01-01T00:00:00+05:30" the moment the config gained a
 * real date. +05:30 is IST.
 */
const FOUNDED_DATETIME = (() => {
  const d = siteConfig.foundingDate;
  const full = /^\d{4}$/.test(d) ? `${d}-01-01` : d;
  return `${full}T00:00:00+05:30`;
})();

/** Canonical path for the founder's own page. */
export const FOUNDER_PATH = "/about/nitheesh-rajendran";

const ORG_ID = `${siteConfig.url}/#organization`;
const LOCAL_BUSINESS_ID = `${siteConfig.url}/#localbusiness`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

/**
 * Spelling/format variants shared by the Organization and LocalBusiness
 * nodes — same real-world entity, so the same alternate names apply to both.
 * See the inline comment at each call site for why these specific forms
 * (and not a longer typo list) are the right set.
 */
const ORG_ALT_NAMES = [
  "SetupsWorks",
  "setups.works",
  "Setups Works Digital Agency",
  "Setup Works",
  "Setups Work",
  "Setup Work",
  "Setupworks",
];

/** Self-contained Organization reference used by the founder Person node. */
const orgReference = {
  "@id": ORG_ID,
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
};

/**
 * Mirror of the above for the other direction. Carrying a name and url rather
 * than a bare `@id` means `Organization.founder` resolves inside every page's
 * graph, not only on /about where the full Person node lives. Same `@id`, so
 * the two merge into one entity rather than competing — which is exactly what
 * `@graph` is for.
 */
const personReference = {
  "@id": `${siteConfig.url}/#founder`,
  "@type": "Person",
  name: siteConfig.founderProfile.name,
  url: `${siteConfig.url}${FOUNDER_PATH}`,
};

/* --------------------------- Organization ------------------------------ */
/**
 * The brand/legal entity — Knowledge-Panel-facing facts (identity, founder,
 * staff, offer catalogue, business identifiers). Split from the physical
 * storefront on purpose: `localBusinessSchema()` below carries the
 * address/geo/hours/price-range signals that power Maps and the local pack.
 * The two are the same real-world business, joined by a `department` /
 * `parentOrganization` edge pair rather than merged into one multi-typed
 * node, so each can be read (and validated) as its own schema.org type.
 */
export function organizationSchema(services?: Service[], team?: TeamMember[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: siteConfig.name,
    // "Setups Works" is two ordinary English words, so brand queries compete
    // with generic results. Listing the spellings people actually type helps
    // Google bind the query to this entity rather than to the dictionary sense.
    // Only forms that differ from `name` by more than capitalisation. Search
    // matching is case-insensitive, so "SETUPS WORKS", "setups works" and
    // "Setups Works" are one string to a crawler — listing them separately adds
    // length, not reach. What genuinely varies is spacing and punctuation:
    //   SetupsWorks   — closed up, how it gets typed as one word
    //   setups.works  — the domain form
    //   …Digital Agency — descriptive long form
    // Misspellings: both words are ordinary nouns that read naturally in the
    // singular, so dropping either plural is the mistake people actually make.
    // Kept to the four that are one dropped "s" from the real name — this is
    // an alternate-name field, not a keyword list, and a long tail of invented
    // typos would be stuffing. Prune or extend from the real query data in
    // Search Console once it has accumulated. Shared with the LocalBusiness
    // node via ORG_ALT_NAMES since it's the same entity either way.
    alternateName: ORG_ALT_NAMES,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/icon-512.png`,
      width: 512,
      height: 512,
    },
    // ImageObject rather than a bare URL: dimensions let a consumer decide
    // whether the image suits a given surface without fetching it first.
    image: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    legalName: siteConfig.name,
    foundingDate: siteConfig.foundingDate,
    // Derived from the same address fields as `address`, so the two can never
    // drift apart the way a hand-written string would.
    foundingLocation: {
      "@type": "Place",
      name: `${siteConfig.address.locality}, ${siteConfig.address.region}, India`,
      address: {
        "@type": "PostalAddress",
        addressLocality: siteConfig.address.locality,
        addressRegion: siteConfig.address.region,
        addressCountry: siteConfig.address.country,
      },
    },
    slogan: siteConfig.tagline,
    knowsAbout: [
      "Web Development",
      "Mobile App Development",
      "AI Development",
      "Automation",
      "CRM Development",
      "UI/UX Design",
      "SEO",
      "Digital Marketing",
      "SaaS Products",
    ],
    keywords: siteConfig.keywords.join(", "),
    // Business identifiers Google recommends for Organization. Spread in only
    // when set, so the markup never carries empty strings.
    ...Object.fromEntries(
      Object.entries(siteConfig.identifiers).filter(([, v]) => v),
    ),
    ...(siteConfig.numberOfEmployees
      ? {
          numberOfEmployees: {
            "@type": "QuantitativeValue",
            value: siteConfig.numberOfEmployees,
          },
        }
      : {}),
    /**
     * CodeForge AI, stated as a subsidiary on its own domain rather than only
     * as a product row here.
     *
     * The @id is the Organization node codeforgeai.io publishes, and that node
     * names this one as its `parentOrganization` with a matching @id — so the
     * relationship is asserted from both sides and from both domains. A
     * one-directional claim is a company talking about itself; two graphs that
     * agree is corroboration.
     */
    subOrganization: {
      "@type": "Organization",
      "@id": "https://codeforgeai.io/#org",
      name: "CodeForge AI",
      url: "https://codeforgeai.io",
      description:
        "AI-powered coding interview preparation platform — problem bank, multi-language compiler, AI mentoring and skill analytics.",
    },
    /**
     * The physical storefront, as a department of this Organization —
     * schema.org's own example for "a store with a pharmacy, or a bakery with
     * a cafe": same company, different (more location-specific) node. Mirrors
     * `localBusinessSchema()`'s `parentOrganization` edge back to this @id, so
     * the relationship holds from both directions like `founder`/`worksFor`
     * above.
     */
    department: [
      {
        "@id": LOCAL_BUSINESS_ID,
        "@type": ["LocalBusiness", "ProfessionalService"],
        name: siteConfig.name,
        url: siteConfig.url,
      },
    ],
    // Currency and payment terms are business facts, not guesses — add them to
    // siteConfig when known. Deliberately absent rather than invented.
    //
    // NOTE: no aggregateRating here on purpose. Google does not allow
    // self-serving reviews for LocalBusiness/Organization — ratings a business
    // collects and publishes about itself are ineligible for review rich
    // results and risk a manual action. The 4.9/5 shown on the site is fine as
    // page content; it must not be marked up as aggregateRating on this entity.
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: siteConfig.phone,
        email: siteConfig.email,
        contactType: "customer service",
        areaServed: siteConfig.areaServed,
        availableLanguage: ["English"],
      },
    ],
    founder: personReference,
    /**
     * The founder is also staff, so he always appears; published team members
     * follow when the page supplies them.
     *
     * One key, not two. This was previously a lone `personReference`, and
     * adding a second `employee` key earlier in the object literal did nothing
     * — the later key silently won and the team edges vanished from the output.
     *
     * `numberOfEmployees` is a number a crawler must take on trust. An
     * `employee` edge points at a Person node with its own page and its own
     * sameAs profiles, which is checkable. Drafts are excluded upstream, so
     * the graph never claims a colleague who has no page.
     */
    employee: [
      personReference,
      ...(team ?? []).map((m) => ({
        "@id": `${siteConfig.url}${teamPath(m.slug)}#person`,
        "@type": "Person",
        name: m.name,
        jobTitle: m.role,
        url: `${siteConfig.url}${teamPath(m.slug)}`,
      })),
    ],
    // Brand and legal entity are the same here, but naming the Brand explicitly
    // gives the marketing identity its own node for consumers that separate the
    // two — Google's own Organization docs treat brand as distinct.
    brand: {
      "@type": "Brand",
      "@id": `${siteConfig.url}/#brand`,
      name: siteConfig.name,
      logo: `${siteConfig.url}/icon-512.png`,
      slogan: siteConfig.tagline,
    },
    // Wikidata as a typed identifier, not only a sameAs link. sameAs says "this
    // page is also me"; identifier says "this is my id in that authority".
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Wikidata",
      value: siteConfig.wikidata.split("/").pop(),
      url: siteConfig.wikidata,
    },
    // Every service actually sold, as a catalogue of Offers. This is the single
    // largest factual expansion available to the org node — 22 real services
    // already in the database, previously described only in prose.
    ...(services?.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            "@id": `${siteConfig.url}/#services`,
            name: `${siteConfig.name} services`,
            itemListElement: services.map((svc) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                "@id": `${siteConfig.url}/services/${svc.slug}#service`,
                name: svc.title,
                serviceType: svc.category,
                url: `${siteConfig.url}/services/${svc.slug}`,
              },
            })),
          },
        }
      : {}),
    sameAs: orgSameAs,
  };
}

/* -------------------------- LocalBusiness ------------------------------- */
/**
 * The physical storefront — everything Google reads for Maps / the local
 * pack: address, geo, opening hours, price range, and its own `sameAs` so
 * the location itself (not just the brand) corroborates against the same
 * social/business profiles. Kept a separate node from `organizationSchema()`
 * on purpose — see the comment there — and joined to it via
 * `parentOrganization` (this direction) and `department` (the other).
 *
 * Typed `["LocalBusiness", "ProfessionalService"]` rather than bare
 * LocalBusiness: ProfessionalService is the more specific schema.org subtype
 * for a business selling expertise/services rather than physical goods,
 * which is what a digital agency actually is.
 */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": LOCAL_BUSINESS_ID,
    name: siteConfig.name,
    alternateName: ORG_ALT_NAMES,
    url: siteConfig.url,
    image: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/icon-512.png`,
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    telephone: siteConfig.phone,
    email: siteConfig.email,
    priceRange: siteConfig.priceRange,
    address: {
      "@type": "PostalAddress",
      // Only emitted when set — an empty streetAddress is worse than none,
      // and it must match the Google Business Profile listing exactly.
      ...(siteConfig.address.street
        ? { streetAddress: siteConfig.address.street }
        : {}),
      addressLocality: siteConfig.address.locality,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: siteConfig.geo.lat,
      longitude: siteConfig.geo.lng,
    },
    hasMap: siteConfig.googleMaps,
    areaServed: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
    serviceArea: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    // Same-direction mirror of Organization.department — see that field's
    // comment. Explicit @type + name so this edge resolves even in a document
    // that, for whatever reason, doesn't carry the Organization node itself.
    parentOrganization: {
      "@id": ORG_ID,
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    // Wikidata as a typed identifier (not just a sameAs link) on this node
    // too — same convention as Organization.identifier, since it's the same
    // real-world entity Wikidata describes.
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Wikidata",
      value: siteConfig.wikidata.split("/").pop(),
      url: siteConfig.wikidata,
    },
    // NOTE: no aggregateRating here either, for the same reason as the
    // Organization node — see the comment there.
    //
    // Social/business profiles, explicitly on the LocalBusiness node so the
    // physical location itself corroborates against them, not only the
    // brand. Same list as Organization.sameAs (`orgSameAs`) — it's one real
    // business behind both nodes, so the profiles don't differ by node.
    sameAs: orgSameAs,
  };
}

/* ------------------------- Person (the founder) ------------------------ */
export function personSchema(founder?: Founder, products?: Product[]) {
  const p = siteConfig.founderProfile;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${siteConfig.url}/#founder`,
    name: founder?.name || p.name,
    /**
     * Legal name and the variants people actually type. "Rajendran" is a Tamil
     * patronymic — his father's name — so his legal name is the initialised
     * form, and both appear in the wild. Matching the aliases on the Wikidata
     * item means a query for either resolves to one entity rather than two.
     */
    alternateName: ["Nitheesh D R", "Nitheesh DR", "Nitheesh D.R."],
    givenName: (founder?.name || p.name).split(" ")[0],
    familyName: (founder?.name || p.name).split(" ").slice(1).join(" "),
    // Multiple titles when set — Google's own panel describes him as director,
    // web designer and digital marketer, not only as a founder.
    jobTitle: founder?.titles?.length
      ? [founder.role || p.jobTitle, ...founder.titles]
      : founder?.role || p.jobTitle,
    description: founder?.bio || p.description,
    url: `${siteConfig.url}${FOUNDER_PATH}`,
    // The CMS photo wins; the configured portrait is the fallback so the
    // Person node always carries an image. ImageObject either way — a bare URL
    // tells a consumer nothing about dimensions.
    image: founder?.photo
      ? { "@type": "ImageObject", url: founder.photo }
      : {
          "@type": "ImageObject",
          url: p.image.url,
          width: p.image.width,
          height: p.image.height,
        },
    // Explicit (not just @id) so Google reads the employment relationship
    // unambiguously — this is what surfaces the company in his Knowledge Panel.
    //
    // "Founded this organization" is expressed only in the other direction, by
    // Organization.founder pointing at this Person (see organizationSchema).
    // schema.org defines no inverse on Person: `founderOf` and
    // `foundingOrganization` both 404, and validators reject the former as an
    // unrecognised property. The founder edge is not lost by removing it —
    // it is stated once, on the type that actually defines it.
    worksFor: orgReference,
    // Carries url + sameAs so the institution resolves to the same entity
    // Google already lists this person under as notable alumni. A bare name
    // string leaves the match to string similarity; the identifiers make it
    // unambiguous.
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: founder?.education || p.alumniOf.name,
      alternateName: p.alumniOf.alternateName,
      url: founder?.educationUrl || p.alumniOf.url,
      sameAs: p.alumniOf.sameAs,
    },
    hasOccupation: {
      "@type": "Occupation",
      name: founder?.role || p.jobTitle,
      occupationLocation: {
        "@type": "City",
        name: founder?.location || siteConfig.address.locality,
      },
      skills: (founder?.skills?.length ? founder.skills : p.knowsAbout).join(", "),
    },
    homeLocation: {
      "@type": "Place",
      name: founder?.location || `${siteConfig.address.locality}, ${siteConfig.address.region}, India`,
    },
    workLocation: {
      "@type": "Place",
      name: `${siteConfig.address.locality}, ${siteConfig.address.region}, India`,
    },
    nationality: { "@type": "Country", name: "India" },
    parent: [
      { "@type": "Person", name: p.family.father },
      { "@type": "Person", name: p.family.mother },
    ],
    sibling: p.family.siblings.map((name) => ({ "@type": "Person", name })),
    // The awarded qualification. recognizedBy reuses the same institution as
    // alumniOf, so the two can never name different universities.
    ...(founder?.credentialCategory
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: founder.credentialCategory,
            ...(founder.educationalLevel
              ? { educationalLevel: founder.educationalLevel }
              : {}),
            recognizedBy: {
              "@type": "CollegeOrUniversity",
              name: founder.education || p.alumniOf.name,
              ...(founder.educationUrl || p.alumniOf.url
                ? { url: founder.educationUrl || p.alumniOf.url }
                : {}),
              sameAs: p.alumniOf.sameAs,
            },
          },
        }
      : {}),
    ...(founder?.birthDate ? { birthDate: founder.birthDate } : {}),
    ...(founder?.birthPlace
      ? { birthPlace: { "@type": "Place", name: founder.birthPlace } }
      : {}),
    ...(founder?.languages?.length
      ? { knowsLanguage: founder.languages.map((name) => ({ "@type": "Language", name })) }
      : {}),
    ...(founder?.awards?.length ? { award: founder.awards } : {}),
    // The podcast he hosts — another entity that names him, stated as a
    // relationship rather than left for a crawler to infer from a link.
    ...(siteConfig.links.podcast
      ? {
          subjectOf: {
            "@type": "PodcastSeries",
            name: siteConfig.name,
            url: siteConfig.links.podcast,
            webFeed: siteConfig.links.podcastFeed,
          },
        }
      : {}),
    mainEntityOfPage: { "@id": `${siteConfig.url}${FOUNDER_PATH}#profilepage` },
    email: `mailto:${siteConfig.email}`,
    // Products published under his verified Play developer account. Android
    // apps are MobileApplication, a SoftwareApplication subtype — the more
    // specific type carries more meaning at no cost.
    ...(products?.length
      ? {
          owns: products.map((prod) => ({
            "@type": prod.downloadLink?.includes("play.google.com")
              ? "MobileApplication"
              : "SoftwareApplication",
            "@id": `${siteConfig.url}/products/${prod.slug}#product`,
            name: prod.name,
            url: `${siteConfig.url}/products/${prod.slug}`,
            ...(prod.downloadLink ? { installUrl: prod.downloadLink } : {}),
            operatingSystem: prod.downloadLink?.includes("play.google.com")
              ? "Android"
              : "Web",
            applicationCategory: "BusinessApplication",
          })),
        }
      : {}),
    identifier: {
      "@type": "PropertyValue",
      propertyID: "Wikidata",
      value: "Q140500455",
      url: p.sameAs.find((u) => u.includes("wikidata")),
    },
    // Grouped skills flatten into knowsAbout so the schema stays in step with
    // what the page shows, rather than maintaining two lists.
    knowsAbout: founder?.skillGroups?.length
      ? Array.from(new Set(founder.skillGroups.flatMap((g) => g.items)))
      : founder?.skills?.length
        ? founder.skills
        : p.knowsAbout,
    // Personal profiles only. Filter out the company's brand accounts so the
    // org's X/LinkedIn/etc. can never leak into the founder's identity, which
    // would confuse Knowledge Panel entity reconciliation.
    sameAs: Array.from(
      new Set(
        [
          ...p.sameAs,
          founder?.linkedin,
          founder?.twitter,
          founder?.github,
          founder?.imdb,
          founder?.youtube,
        ].filter(
          (url): url is string => !!url && !orgSameAs.includes(url),
        ),
      ),
    ),
  };
}

/* ------------------------------ ProfilePage ---------------------------- */
/**
 * Marks /about as a profile page whose subject is the founder, so Google reads
 * it as "Profile page for Nitheesh Rajendran" rather than an Organization page.
 * mainEntity points at the Person node (#founder) rendered alongside it.
 */
export function profilePageSchema(founder?: Founder) {
  const p = siteConfig.founderProfile;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${siteConfig.url}${FOUNDER_PATH}#profilepage`,
    url: `${siteConfig.url}${FOUNDER_PATH}`,
    name: `${founder?.name || p.name} — ${founder?.role || p.jobTitle}`,
    // Google's ProfilePage requires full ISO 8601 datetime (with time + offset),
    // not a bare date. +05:30 = IST (Chennai).
    dateCreated: FOUNDED_DATETIME,
    dateModified: FOUNDED_DATETIME,
    mainEntity: { "@id": `${siteConfig.url}/#founder` },
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${siteConfig.url}${FOUNDER_PATH}#breadcrumb` },
  };
}

/* --------------------------------- Team --------------------------------- */
/** Canonical path for a team member's page. */
export const teamPath = (slug: string) => `/team/${slug}`;

/**
 * A team member as a Person node.
 *
 * Same shape as the founder's node, minus the entity anchors he has and they
 * don't: no Wikidata id, no birth facts. What carries the weight here is
 * `sameAs` — a LinkedIn or GitHub profile is an independent page about the same
 * human, which is the only thing that separates a real person from a name on a
 * marketing page.
 *
 * `worksFor` points at the Organization by @id, so each member becomes a real
 * edge on the company entity rather than a decorative card.
 */
export function teamMemberSchema(m: TeamMember) {
  const url = `${siteConfig.url}${teamPath(m.slug)}`;
  const sameAs = [m.linkedin, m.github, m.twitter, m.website].filter(Boolean) as string[];

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${url}#person`,
    name: m.name,
    givenName: m.name.split(" ")[0],
    familyName: m.name.split(" ").slice(1).join(" ") || undefined,
    jobTitle: m.role,
    description: m.short || stripHtml(m.bio || "").slice(0, 300) || undefined,
    url,
    ...(m.photo ? { image: { "@type": "ImageObject", url: m.photo } } : {}),
    worksFor: orgReference,
    ...(m.location ? { workLocation: { "@type": "Place", name: m.location } } : {}),
    ...(m.skills?.length ? { knowsAbout: m.skills } : {}),
    ...(m.education ? { alumniOf: { "@type": "EducationalOrganization", name: m.education } } : {}),
    ...(m.email ? { email: m.email } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/**
 * The team index, as an ItemList of URLs.
 *
 * Takes name/url pairs rather than TeamMember rows because the founder belongs
 * in this list but is not a team row — his profile lives at its own path and
 * his Person node has a different @id. Listing him by URL puts him in the list
 * without minting a second entity for the same human.
 */
export function teamListSchema(people: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteConfig.url}/team#list`,
    name: `The ${siteConfig.name} team`,
    numberOfItems: people.length,
    itemListElement: people.map((x, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: x.url,
      name: x.name,
    })),
  };
}

/* -------------------------------- Movies -------------------------------- */
/**
 * Directing/writing credits as Movie nodes.
 *
 * The founder's Knowledge Panel is a film-industry panel: Google labels him
 * "Director" and renders a Movies carousel, all of it sourced from IMDb. A
 * single-source fact is one Google hedges on and one it cannot corroborate, so
 * these publish the same credits from a domain we control.
 *
 * `director` points at the Person by @id rather than repeating the person
 * inline, which is what lets a consumer merge these with the existing node
 * instead of inventing a second one. schema.org defines the edge on the work,
 * not on the Person — there is no `Person.directorOf`.
 */
export function filmSchemas(founder?: Founder) {
  const films = founder?.films ?? [];
  return films
    .filter((f) => f.title?.trim())
    .map((f) => ({
      "@context": "https://schema.org",
      "@type": "Movie",
      "@id": `${siteConfig.url}${FOUNDER_PATH}#film-${slugify(f.title)}`,
      name: f.title,
      // Google treats a Movie without an image as a critical error, so this is
      // emitted whenever the record has one.
      ...(f.image ? { image: f.image } : {}),
      ...(f.description ? { description: f.description } : {}),
      // Bare year is valid ISO 8601 and is all we can honestly claim; a
      // fabricated month/day would be a worse signal than a coarse one.
      ...(f.year ? { datePublished: f.year } : {}),
      ...(f.format ? { genre: f.format } : {}),
      director: personReference,
      // Writing credit is a separate schema.org edge from directing.
      ...(f.role?.toLowerCase().includes("writ") ? { author: personReference } : {}),
      ...(f.url ? { sameAs: [f.url] } : {}),
    }));
}

/* ------------------------------ ContactPage ---------------------------- */
/**
 * Marks /contact as the business's contact page and binds it to the same
 * Organization entity, reinforcing NAP + map signals for local SEO.
 */
export function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${siteConfig.url}/contact/#contactpage`,
    url: `${siteConfig.url}/contact`,
    name: `Contact ${siteConfig.name}`,
    about: { "@id": ORG_ID },
    mainEntity: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${siteConfig.url}/contact#breadcrumb` },
  };
}

/* -------------------------------- FAQPage ------------------------------ */
/** FAQ rich results for pages that render the FAQ section. */
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/* -------------------------------- WebSite ------------------------------ */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
    // Enables Google's sitelinks search box.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/* --------------------- SiteNavigation (helps sitelinks) ---------------- */
/**
 * Declares the site's primary destinations as an ordered ItemList of
 * SiteNavigationElements — the machine-readable half of the sitelinks signal.
 *
 * Sitelinks are ultimately algorithmic: Google picks them from site structure,
 * internal anchor text, and breadcrumbs, and this markup only describes what it
 * already crawls. It is `itemListOrder`-ed so our preferred ranking is explicit
 * rather than inferred, and each entry carries its own description so the
 * candidates read as distinct pages.
 */
export function siteNavigationSchema(
  items: { name: string; url: string; description?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${siteConfig.url}/#sitenav`,
    name: `${siteConfig.name} primary navigation`,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "SiteNavigationElement",
      position: i + 1,
      name: item.name,
      url: `${siteConfig.url}${item.url}`,
      ...(item.description ? { description: item.description } : {}),
      isPartOf: { "@id": WEBSITE_ID },
    })),
  };
}

/* -------------------------------- WebPage ------------------------------ */
/**
 * Binds a page to the site and the Organization that publishes it. Giving every
 * top-level destination a stable @id and an explicit `isPartOf` edge is what
 * lets crawlers see the site as one entity with a hierarchy — a precondition
 * for sitelinks — instead of a bag of unrelated URLs.
 */
export function webPageSchema({
  path,
  name,
  description,
  isHomePage = false,
}: {
  path: string;
  name: string;
  description: string;
  isHomePage?: boolean;
}) {
  // `path === "/"` collapses to the bare origin so the node's url/@id line up
  // with the trailing-slash-free canonical Next emits for the homepage.
  const url = path === "/" ? siteConfig.url : `${siteConfig.url}${path}`;
  return {
    "@context": "https://schema.org",
    "@type": isHomePage ? ["WebPage", "CollectionPage"] : "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
    ...(isHomePage
      ? {
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: `${siteConfig.url}/opengraph-image`,
            width: 1200,
            height: 630,
          },
        }
      : { breadcrumb: { "@id": `${url}#breadcrumb` } }),
  };
}

/* -------------------------------- Article ------------------------------ */
export function articleSchema(blog: Blog) {
  const plain = stripHtml(blog.content);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${siteConfig.url}/blog/${blog.slug}/#article`,
    headline: blog.title,
    description: blog.seoDescription || blog.excerpt,
    articleBody: plain,
    wordCount: plain.split(/\s+/).filter(Boolean).length,
    image: [blog.ogImage || blog.featuredImage],
    keywords: blog.tags.join(", "),
    articleSection: blog.category,
    inLanguage: "en",
    author: {
      "@type": "Person",
      name: blog.author,
      ...(blog.authorRole ? { jobTitle: blog.authorRole } : {}),
    },
    publisher: { "@id": ORG_ID },
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt ?? blog.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${blog.slug}`,
    },
    timeRequired: `PT${blog.readingTime}M`,
  };
}

/* -------------------------------- Product ------------------------------ */
export function productSchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: truncate(stripHtml(product.description), 300),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    image: product.banner || product.logo,
    url: `${siteConfig.url}/products/${product.slug}`,
    ...(product.version ? { softwareVersion: product.version } : {}),
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    /**
     * Availability follows the record instead of being hardcoded.
     *
     * This said `PreOrder` for every product, including ones already published
     * and downloadable on the Play Store. Availability is one of the fields
     * Google reads for product results, so stating PreOrder for a shipped app
     * is a wrong claim, not a harmless default.
     */
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability:
        product.downloadLink || product.status === "live"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
      ...(product.downloadLink ? { url: product.downloadLink } : {}),
    },
    /**
     * Only emitted when a real rating AND a real count exist. Google requires
     * both, and an AggregateRating a site awards itself is precisely what the
     * structured-data spam policy targets — so this stays absent until someone
     * enters the actual store numbers.
     */
    ...(typeof product.rating === "number" && typeof product.ratingCount === "number" && product.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            ratingCount: product.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

/* --------------------------------- Service ----------------------------- */
export function serviceSchema(service: Service) {
  const offers = service.features?.length
    ? {
        "@type": "OfferCatalog",
        name: `${service.title} — what's included`,
        itemListElement: service.features.map((f) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: f },
        })),
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${siteConfig.url}/services/${service.slug}#service`,
    name: service.title,
    description: service.seoDescription || service.description,
    serviceType: service.category,
    url: `${siteConfig.url}/services/${service.slug}`,
    provider: { "@id": ORG_ID },
    areaServed: siteConfig.areaServed.map((name) => ({ "@type": "Place", name })),
    ...(service.heroImage ? { image: service.heroImage } : {}),
    ...(offers ? { hasOfferCatalog: offers } : {}),
  };
}

/* ------------------------------- CreativeWork -------------------------- */
/**
 * A case study, typed as an Article rather than a CreativeWork.
 *
 * /case-studies/[slug] shipped with nothing but a breadcrumb — the write-up
 * itself, which is the only reason the page exists, was invisible to a crawler.
 * Article is the right type because the page is long-form editorial *about* a
 * project; the project itself stays a CreativeWork, referenced via `about`, so
 * the same work isn't claimed twice as two different entities.
 */
export function caseStudySchema(project: Portfolio) {
  const url = `${siteConfig.url}/case-studies/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: truncate(project.title, 110),
    description: project.summary,
    image: project.coverImage,
    url,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": WEBSITE_ID },
    ...(project.year ? { datePublished: project.year } : {}),
    // The project the article is about, as its own node. `about` is the edge
    // schema.org defines for subject matter — reusing `mainEntity` would claim
    // the page *is* the project rather than coverage of it.
    about: {
      "@type": "CreativeWork",
      name: project.title,
      ...(project.client ? { sourceOrganization: { "@type": "Organization", name: project.client } } : {}),
      ...(project.liveDemo ? { url: project.liveDemo } : {}),
    },
    keywords: project.techStack.join(", "),
  };
}

export function portfolioSchema(project: Portfolio) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    image: project.coverImage,
    url: `${siteConfig.url}/portfolio/${project.slug}`,
    creator: { "@id": ORG_ID },
    genre: project.category,
    ...(project.year ? { dateCreated: project.year } : {}),
    keywords: project.techStack.join(", "),
  };
}

/**
 * The standard schema pair for a top-level destination: a WebPage node bound to
 * the site graph, plus the BreadcrumbList it references. Every page in
 * `sitelinkNav` emits this so the whole sitelink candidate set is described
 * consistently — a page Google can't place in the hierarchy rarely gets picked.
 */
export function pageSchemas({
  path,
  label,
  description,
  services,
}: {
  path: string;
  label: string;
  description: string;
  /** When supplied, the org node carries its full service catalogue. */
  services?: Service[];
}) {
  return [
    // The Organization, LocalBusiness and WebSite nodes ship on every page
    // rather than only on the homepage: WebPage.isPartOf/about/publisher
    // reference them by @id, and a reference whose target isn't defined in
    // the same document is a dangling edge. Crawlers do consolidate nodes
    // across a site, but making each page's graph resolve on its own removes
    // the dependency on that happening.
    organizationSchema(services),
    localBusinessSchema(),
    websiteSchema(),
    webPageSchema({ path, name: `${label} · ${siteConfig.name}`, description }),
    breadcrumbSchema([{ name: label, url: path }]),
  ];
}

/* ------------------------------- JobPosting ---------------------------- */
/** Google's employmentType enum. Anything unrecognised is simply omitted. */
const EMPLOYMENT_TYPES: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  contractor: "CONTRACTOR",
  internship: "INTERN",
  temporary: "TEMPORARY",
  freelance: "CONTRACTOR",
};

/**
 * JobPosting for a single role.
 *
 * Returns null unless `datePosted` is set. Google requires it, and a fabricated
 * date on a job listing is exactly the kind of thing that earns a manual
 * action — so an unset date yields no markup at all rather than a guess. The
 * same applies to salary, which is omitted unless real figures exist.
 *
 * Per Google's guidance this belongs on the individual job page only, never on
 * the listing page.
 */
export function jobPostingSchema(job: JobOpening) {
  if (!job.datePosted) return null;

  const employmentType = EMPLOYMENT_TYPES[job.type.trim().toLowerCase()];

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "@id": `${siteConfig.url}/careers/${job.slug}#jobposting`,
    title: job.title,
    description: buildJobDescriptionHtml(job),
    datePosted: job.datePosted,
    ...(job.validThrough ? { validThrough: job.validThrough } : {}),
    ...(employmentType ? { employmentType } : {}),
    identifier: {
      "@type": "PropertyValue",
      name: siteConfig.name,
      value: job.slug,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: siteConfig.name,
      sameAs: siteConfig.url,
      logo: `${siteConfig.url}/icon-512.png`,
    },
    // jobLocation is required even for remote roles — it describes the hiring
    // office, while jobLocationType/applicantLocationRequirements describe
    // where the person may actually sit.
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        ...(siteConfig.address.street
          ? { streetAddress: siteConfig.address.street }
          : {}),
        addressLocality: siteConfig.address.locality,
        addressRegion: siteConfig.address.region,
        postalCode: siteConfig.address.postalCode,
        addressCountry: siteConfig.address.country,
      },
    },
    ...(job.remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: "India",
          },
        }
      : {}),
    ...(job.salary
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: job.salary.currency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary.min,
              maxValue: job.salary.max,
              unitText: job.salary.unit,
            },
          },
        }
      : {}),
    directApply: false,
  };
}

/** Google wants the description as HTML, and richer than a single sentence. */
function buildJobDescriptionHtml(job: JobOpening): string {
  const list = (title: string, items?: string[]) =>
    items?.length
      ? `<h3>${title}</h3><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
      : "";
  return [
    `<p>${job.description}</p>`,
    list("Responsibilities", job.responsibilities),
    list("Requirements", job.requirements),
  ]
    .filter(Boolean)
    .join("");
}

/* ------------------------------- Breadcrumb ---------------------------- */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  // The trail always ends on the current page, so its URL is the stable anchor
  // that webPageSchema()'s `breadcrumb` reference points back at.
  const pageUrl = `${siteConfig.url}${items[items.length - 1]?.url ?? "/"}`;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.name,
        item: `${siteConfig.url}${item.url}`,
      })),
    ],
  };
}
