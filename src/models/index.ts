import mongoose, { Schema, model, models } from "mongoose";

/* ------------------------------------------------------------------ *
 *  User (admin auth)
 * ------------------------------------------------------------------ */
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "editor"], default: "admin" },
    avatar: String,
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Blog
 * ------------------------------------------------------------------ */
const BlogSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    featuredImage: { type: String, default: "" },
    author: { type: String, default: "Setups Works" },
    authorRole: String,
    authorAvatar: String,
    seoTitle: String,
    seoDescription: String,
    ogImage: String,
    status: {
      type: String,
      enum: ["draft", "published", "scheduled"],
      default: "draft",
      index: true,
    },
    featured: { type: Boolean, default: false },
    readingTime: { type: Number, default: 5 },
    publishedAt: Date,
  },
  { timestamps: true },
);
BlogSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });

/* ------------------------------------------------------------------ *
 *  Product
 * ------------------------------------------------------------------ */
const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    tagline: { type: String, default: "" },
    description: { type: String, required: true },
    content: { type: String, default: "" },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    screenshots: { type: [String], default: [] },
    features: {
      type: [{ title: String, description: String, icon: String }],
      default: [],
    },
    technologies: { type: [String], default: [] },
    category: { type: String, default: "Software" },
    status: {
      type: String,
      enum: ["coming-soon", "beta", "live", "archived"],
      default: "coming-soon",
    },
    version: String,
    team: { type: [String], default: [] },
    rating: Number,
    ratingCount: Number,
    downloadLink: String,
    githubLink: String,
    docsLink: String,
    releaseNotes: String,
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Service
 * ------------------------------------------------------------------ */
const ServiceSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    short: { type: String, default: "" },
    description: { type: String, required: true },
    // Icon *name* (see lib/service-icons.ts), not a FontAwesome object.
    icon: { type: String, default: "code" },
    category: {
      type: String,
      enum: ["Development", "Design", "Growth", "Platforms", "Intelligence"],
      default: "Development",
      index: true,
    },
    features: { type: [String], default: [] },
    deliverables: { type: [String], default: [] },

    // Rich detail-page content
    content: { type: String, default: "" },
    overview: { type: String, default: "" },
    process: {
      type: [{ title: String, description: String }],
      default: [],
    },
    faqs: {
      type: [{ question: String, answer: String }],
      default: [],
    },
    outcomes: {
      type: [{ value: String, label: String }],
      default: [],
    },
    techStack: { type: [String], default: [] },
    idealFor: { type: [String], default: [] },
    startingPrice: { type: String, default: "" },
    timeline: { type: String, default: "" },
    heroImage: { type: String, default: "" },
    seoTitle: String,
    seoDescription: String,
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Portfolio
 * ------------------------------------------------------------------ */
const PortfolioSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    summary: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    images: { type: [String], default: [] },
    techStack: { type: [String], default: [] },
    liveDemo: String,
    github: String,
    client: { type: String, default: "" },
    duration: { type: String, default: "" },
    year: { type: String, default: "" },
    caseStudy: String,
    team: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Testimonial
 * ------------------------------------------------------------------ */
const TestimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
    company: { type: String, default: "" },
    photo: { type: String, default: "" },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    review: { type: String, required: true },
    showOnHome: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Contact message
 * ------------------------------------------------------------------ */
const ContactSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: String,
    budget: String,
    subject: { type: String, default: "New inquiry" },
    message: { type: String, required: true },
    replied: { type: Boolean, default: false },
    /**
     * Outbound replies, oldest first — this is what turns a message into a
     * thread. Stored here rather than only sent, so the admin shows the whole
     * conversation instead of just the inbound half, and a delivery failure
     * stays visible instead of vanishing.
     */
    replies: {
      type: [
        {
          body: String,
          sentAt: { type: Date, default: Date.now },
          sentBy: String,
          status: { type: String, enum: ["sent", "failed"], default: "sent" },
          error: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Lead (web-to-lead form → Perfex CRM + admin)
 * ------------------------------------------------------------------ */
const LeadSchema = new Schema(
  {
    // Fields Perfex accepts, named to match its web-to-lead payload.
    name: { type: String, required: true },
    email: { type: String, required: true },
    phonenumber: { type: String, required: true },
    company: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    /** Perfex country id (India = 102), stored as sent. */
    country: { type: String, default: "" },
    countryName: { type: String, default: "" },
    zip: { type: String, default: "" },

    // Website-only fields. Perfex's form has nowhere to put these, so they live
    // here and go out in the notification email.
    type: {
      type: String,
      enum: ["quotation", "enquiry"],
      default: "enquiry",
      index: true,
    },
    service: { type: String, default: "" },
    budget: { type: String, default: "" },
    message: { type: String, default: "" },
    /** Which page the form was submitted from. */
    source: { type: String, default: "" },

    // Outcome of the two best-effort side effects. The lead is saved either
    // way; these record what actually happened so a failed CRM push is visible
    // in the admin instead of silently lost.
    crmStatus: {
      type: String,
      enum: ["pending", "synced", "failed"],
      default: "pending",
      index: true,
    },
    crmError: { type: String, default: "" },
    /** Perfex lead id, set when the lead was created through the REST API. */
    crmLeadId: { type: String, default: "", index: true },
    /** Latest state read back from the CRM by /api/cron/perfex-sync. */
    crmLeadStatus: { type: String, default: "" },
    crmLost: { type: Boolean, default: false },
    crmConverted: { type: Boolean, default: false },
    crmCheckedAt: { type: Date },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Crawler hit — verified search-engine visits
 * ------------------------------------------------------------------ */
const CrawlerHitSchema = new Schema(
  {
    path: { type: String, required: true, index: true },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
    /** Which crawler the UA claims to be. Claimed, not proven. */
    crawler: { type: String, default: "other", index: true },
    /**
     * Whether the IP actually belongs to Google. A UA string is trivially
     * forged, so this is the only field worth trusting — an unverified hit
     * claiming to be Googlebot is a spoof, and worth seeing as such.
     */
    verified: { type: Boolean, default: false, index: true },
    method: { type: String, enum: ["ip-range", "dns", "none"], default: "none" },
  },
  { timestamps: true },
);
// Keep the collection self-trimming; crawl logs are only useful while recent.
CrawlerHitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

/* ------------------------------------------------------------------ *
 *  Newsletter subscriber
 * ------------------------------------------------------------------ */
const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Settings (singleton)
 * ------------------------------------------------------------------ */
const SettingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    siteName: { type: String, default: "Setups Works" },
    tagline: { type: String, default: "The Digital Agency." },
    description: String,
    logoLight: String,
    logoDark: String,
    email: String,
    phone: String,
    location: String,
    social: {
      twitter: String,
      github: String,
      linkedin: String,
      instagram: String,
    },
    seo: {
      title: String,
      description: String,
      ogImage: String,
      keywords: [String],
    },
    analytics: {
      googleAnalyticsId: String,
      searchConsoleId: String,
    },
    founder: {
      name: { type: String, default: "Nitheesh Rajendran" },
      role: { type: String, default: "Founder" },
      handle: { type: String, default: "nitheesh.rajendran" },
      status: { type: String, default: "Available" },
      photo: { type: String, default: "" },
      quote: {
        type: String,
        default:
          "I started Setups Works because I was tired of seeing great ideas ruined by mediocre execution. We treat every project like it's our own product.",
      },
      bio: { type: String, default: "" },
      twitter: String,
      linkedin: String,
      github: String,
      imdb: String,
      youtube: String,
      education: String,
      educationUrl: String,
      skills: { type: [String], default: [] },
      titles: { type: [String], default: [] },
      languages: { type: [String], default: [] },
      awards: { type: [String], default: [] },
      location: String,
      birthDate: String,
      birthPlace: String,
      story: { type: String, default: "" },
      skillGroups: {
        type: [{ label: String, items: [String] }],
        default: [],
      },
      films: {
        type: [
          {
            title: String,
            year: String,
            role: String,
            format: String,
            url: String,
            description: String,
            image: String,
          },
        ],
        default: [],
      },
      degree: String,
      fieldOfStudy: String,
      educationStart: String,
      educationEnd: String,
      credentialCategory: String,
      educationalLevel: String,
    },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Client logo (homepage marquee)
 * ------------------------------------------------------------------ */
const ClientLogoSchema = new Schema(
  {
    name: { type: String, required: true },
    logo: { type: String, default: "" },
    url: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Team member
 * ------------------------------------------------------------------ */
const TeamMemberSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    role: { type: String, required: true },
    short: { type: String, default: "" },
    bio: { type: String, default: "" },
    photo: { type: String, default: "" },
    location: String,
    skills: { type: [String], default: [] },
    linkedin: String,
    github: String,
    twitter: String,
    website: String,
    email: String,
    education: String,
    order: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "published" },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ *
 *  Milestone (About page journey timeline)
 * ------------------------------------------------------------------ */
const MilestoneSchema = new Schema(
  {
    year: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const User = models.User || model("User", UserSchema);
export const ClientLogo = models.ClientLogo || model("ClientLogo", ClientLogoSchema);
export const Milestone = models.Milestone || model("Milestone", MilestoneSchema);
export const TeamMember = models.TeamMember || model("TeamMember", TeamMemberSchema);
export const Blog = models.Blog || model("Blog", BlogSchema);
export const Product = models.Product || model("Product", ProductSchema);
export const Service = models.Service || model("Service", ServiceSchema);
export const Portfolio = models.Portfolio || model("Portfolio", PortfolioSchema);
export const Testimonial = models.Testimonial || model("Testimonial", TestimonialSchema);
export const Contact = models.Contact || model("Contact", ContactSchema);
export const Lead = models.Lead || model("Lead", LeadSchema);
export const CrawlerHit =
  models.CrawlerHit || model("CrawlerHit", CrawlerHitSchema);
export const Subscriber = models.Subscriber || model("Subscriber", SubscriberSchema);
export const Settings = models.Settings || model("Settings", SettingsSchema);

export type { mongoose };
