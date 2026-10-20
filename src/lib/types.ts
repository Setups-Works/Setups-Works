export type BlogStatus = "draft" | "published" | "scheduled";
export type ProductStatus = "coming-soon" | "beta" | "live" | "archived";
export type ServiceCategory =
  | "Development"
  | "Design"
  | "Growth"
  | "Platforms"
  | "Intelligence";

/** One numbered step in a service's delivery process. */
export interface ServiceProcessStep {
  title: string;
  description: string;
}

/** A question/answer pair rendered on the service page and as FAQ schema. */
export interface ServiceFaq {
  question: string;
  answer: string;
}

/** A headline metric ("40%", "faster load times"). */
export interface ServiceOutcome {
  value: string;
  label: string;
}

export interface Service {
  _id?: string;
  slug: string;
  title: string;
  /** One-liner used on cards and in the mega menu. */
  short: string;
  /** Plain-text summary used for meta descriptions and card bodies. */
  description: string;
  /**
   * Icon *name*, resolved through `resolveServiceIcon`. Stored as a string
   * because a FontAwesome IconDefinition can't round-trip through Mongo.
   */
  icon: string;
  category: ServiceCategory;
  features: string[];
  deliverables: string[];

  /* --- Rich detail-page fields (all optional; the page degrades cleanly) --- */
  /** Rich-text HTML body rendered as the main article on the detail page. */
  content?: string;
  /** Longer plain-text intro shown above the fold. */
  overview?: string;
  process?: ServiceProcessStep[];
  faqs?: ServiceFaq[];
  outcomes?: ServiceOutcome[];
  techStack?: string[];
  /** Who this is for — bullet list. */
  idealFor?: string[];
  startingPrice?: string;
  timeline?: string;
  heroImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  /** Controls ordering within a category; lower sorts first. */
  order?: number;
  featured?: boolean;
  status?: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
}

export interface Blog {
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  status: BlogStatus;
  featured?: boolean;
  readingTime: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  content?: string;
  logo: string;
  banner: string;
  screenshots: string[];
  features: { title: string; description: string; icon?: string }[];
  technologies: string[];
  category: string;
  status: ProductStatus;
  version?: string;
  /** Slugs of the team members who built it — same convention as Portfolio.team. */
  team?: string[];
  /**
   * Real store rating, e.g. the Play Store average. Emitted as
   * AggregateRating only when BOTH this and `ratingCount` are set — Google
   * requires a count, and a rating with no ratings behind it is exactly the
   * kind of claim that earns a structured-data manual action.
   */
  rating?: number;
  ratingCount?: number;
  downloadLink?: string;
  githubLink?: string;
  docsLink?: string;
  releaseNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Portfolio {
  _id?: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  coverImage: string;
  images: string[];
  techStack: string[];
  liveDemo?: string;
  github?: string;
  client: string;
  duration: string;
  year: string;
  caseStudy?: string;
  /**
   * Slugs of the team members who worked on this project. Slugs rather than
   * ids so the reference survives a re-seed and reads in the admin.
   */
  team?: string[];
  featured?: boolean;
  createdAt?: string;
}

/**
 * A team member.
 *
 * Separate from the `founder` settings record on purpose: the founder is a
 * singleton with its own page, entity anchors and Knowledge-Panel work, while
 * these are a collection. Both end up as schema.org Person nodes pointing at
 * the same Organization, so the org gains real `employee` edges rather than
 * claiming a headcount no crawler can see.
 */
export interface TeamMember {
  _id?: string;
  name: string;
  slug: string;
  role: string;
  /** One-liner for the card. */
  short?: string;
  /** Long-form bio, HTML, rendered as the detail page body. */
  bio?: string;
  photo: string;
  location?: string;
  /** Topics — emitted as Person.knowsAbout. */
  skills?: string[];
  /** Profile URLs — emitted as Person.sameAs, the entity anchors for a person. */
  linkedin?: string;
  github?: string;
  twitter?: string;
  website?: string;
  email?: string;
  education?: string;
  /** Lower sorts first on the team page. */
  order?: number;
  featured?: boolean;
  status?: "draft" | "published";
  createdAt?: string;
  updatedAt?: string;
}

export interface Testimonial {
  _id?: string;
  name: string;
  role: string;
  company: string;
  photo: string;
  rating: number;
  review: string;
  showOnHome?: boolean;
  createdAt?: string;
}

export interface MessageReply {
  body: string;
  sentAt: string;
  sentBy?: string;
  status: "sent" | "failed";
  error?: string;
}

export interface ContactMessage {
  _id?: string;
  name: string;
  email: string;
  company?: string;
  budget?: string;
  subject: string;
  message: string;
  replied: boolean;
  replies?: MessageReply[];
  createdAt?: string;
}

export interface Lead {
  _id?: string;
  name: string;
  email: string;
  phonenumber: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  /** Perfex numeric country id. */
  country?: string;
  countryName?: string;
  zip?: string;
  type: "quotation" | "enquiry";
  service?: string;
  budget?: string;
  message?: string;
  source?: string;
  crmStatus: "pending" | "synced" | "failed";
  crmError?: string;
  crmLeadId?: string;
  crmLeadStatus?: string;
  crmLost?: boolean;
  crmConverted?: boolean;
  crmCheckedAt?: string;
  emailStatus: "pending" | "sent" | "failed";
  handled?: boolean;
  createdAt?: string;
}

export interface Subscriber {
  _id?: string;
  email: string;
  createdAt?: string;
}

export interface ClientLogo {
  _id?: string;
  name: string;
  logo: string;
  url?: string;
  order: number;
  createdAt?: string;
}

export interface Milestone {
  _id?: string;
  year: string;
  title: string;
  description: string;
  order: number;
  createdAt?: string;
}

/**
 * A directing/writing credit, emitted as a schema.org Movie whose `director`
 * points back at the Person node.
 *
 * The founder's Knowledge Panel is a film-industry panel built almost entirely
 * from IMDb — Google leads with "Director", and the credits come from a single
 * source. Publishing the same credits here gives that claim a second,
 * independent origin on a domain we control.
 */
export interface FounderFilm {
  title: string;
  /** Release year, as a bare "2024". Emitted as Movie.datePublished. */
  year?: string;
  /** Credited role, e.g. "Director" or "Director, Writer". */
  role?: string;
  /** Short film, feature, music video — free text, shown as a label. */
  format?: string;
  /** IMDb, YouTube or wherever the work actually lives. */
  url?: string;
  description?: string;
  /**
   * Poster. Required, not optional: Google's Movie rich result rejects a node
   * without `image` as a critical error, which is what the Rich Results Test
   * flagged on both credits. Self-hosting is safer long term than pointing at
   * IMDb's CDN, but a working URL beats a missing field either way.
   */
  image?: string;
}

export interface Founder {
  name: string;
  role: string;
  handle?: string;
  status?: string;
  photo?: string;
  quote?: string;
  bio?: string;
  /* Profiles. Each falls back to siteConfig when blank, so the founder page
     and Person schema always have something to link to. */
  twitter?: string;
  linkedin?: string;
  github?: string;
  imdb?: string;
  youtube?: string;
  /** Institution name and URL, shown on the founder page and in alumniOf. */
  education?: string;
  educationUrl?: string;
  /** Topics shown under "Works on" and emitted as Person.knowsAbout. */
  skills?: string[];
  /** Additional titles beyond `role`, e.g. Director, Web Designer. */
  titles?: string[];
  /** Languages spoken — emitted as Person.knowsLanguage. */
  languages?: string[];
  /** Awards and recognition. Blank by default; only real ones belong here. */
  awards?: string[];
  /** City/region for Person.homeLocation. Falls back to the business location. */
  location?: string;
  /**
   * ISO 8601 date of birth, and birthplace. Google's Knowledge Panel already
   * publishes both, so stating them agrees with a conclusion it reached from
   * other sources — which is what entity reconciliation rewards. Blank unless
   * set; never guessed.
   */
  birthDate?: string;
  birthPlace?: string;
  /** Long-form biography as HTML. Edited in the admin, rendered as the page body. */
  story?: string;
  /** Technical skills grouped by discipline, e.g. { label: "Frontend", items: [...] }. */
  skillGroups?: { label: string; items: string[] }[];
  /** Directing and writing credits. Rendered as a filmography and as Movie schema. */
  films?: FounderFilm[];
  /* Education detail beyond the institution name. */
  degree?: string;
  fieldOfStudy?: string;
  educationStart?: string;
  educationEnd?: string;
  /**
   * Awarded qualification. Emitted as Person.hasCredential only when
   * credentialCategory is set — a credential is a claim that it has been
   * conferred, so it stays absent until someone states it deliberately.
   */
  credentialCategory?: string;
  educationalLevel?: string;
}

export interface SiteSettings {
  siteName?: string;
  tagline?: string;
  description?: string;
  logoLight?: string;
  logoDark?: string;
  email?: string;
  phone?: string;
  location?: string;
  social?: Record<string, string>;
  founder?: Founder;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}
