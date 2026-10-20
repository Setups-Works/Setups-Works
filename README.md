<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/white.png" />
    <source media="(prefers-color-scheme: light)" srcset="./public/black.png" />
    <img src="./public/black.png" alt="Setups Works logo" width="160" />
  </picture>

  <h1>Setups Works</h1>

  <p><strong>The Digital Agency.</strong></p>
  <p>
    Marketing site, content platform, and CRM-connected admin for Setups Works —
    a digital agency building websites, mobile apps, and AI products.
  </p>

  <p>
    <a href="https://setups.works">Live site</a>
    &nbsp;&middot;&nbsp;
    <a href="#quick-start">Quick start</a>
    &nbsp;&middot;&nbsp;
    <a href="#environment">Environment</a>
    &nbsp;&middot;&nbsp;
    <a href="#architecture">Architecture</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-149eca.svg" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178c6.svg" alt="TypeScript 5" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-47a248.svg" alt="MongoDB" />
  </p>
</div>

---

## What this is

Three things in one Next.js application:

1. **A public marketing site** — services, products, portfolio, case studies, blog, careers, and a two-step lead capture flow.
2. **An admin CMS** at `/admin` — every piece of content is database-backed and editable, with no redeploy needed to publish.
3. **An operations surface** — leads sync to Perfex CRM, a built-in mailbox reads and replies over IMAP/SMTP, and verified search-crawler activity is logged so indexing questions can be answered from data.

> **Next.js 16 note.** This release renamed conventions — `middleware` became `proxy`, and Proxy now defaults to the Node runtime. Read `node_modules/next/dist/docs/` before assuming an API matches an older version. See [`AGENTS.md`](./AGENTS.md).

## Quick start

```bash
# 1. Install
pnpm install

# 2. Configure
cp .env.example .env.local     # then fill it in — see Environment below

# 3. Create the admin user and settings document
pnpm seed

# 4. Optional: load the built-in service catalogue into the database
pnpm seed:services

# 5. Run
pnpm dev
```

The site runs at `http://localhost:3000`, the admin at `/admin/login`.

**Only `MONGODB_URI` and `JWT_SECRET` are required to boot.** Everything else degrades gracefully: without SMTP the forms still capture leads, without Cloudinary uploads fall back to local disk, and without a seeded database the site serves its built-in content.

## Environment

| Variable | Required | Purpose |
| --- | :---: | --- |
| `MONGODB_URI` | ● | Database connection string |
| `JWT_SECRET` | ● | Signs admin session cookies |
| `NEXT_PUBLIC_SITE_URL` | | Canonical origin. A wrong value breaks canonicals, sitemap, and JSON-LD |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | | Credentials `pnpm seed` creates |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | | Lead notifications, admin replies, outbound mail |
| `SMTP_FROM` / `SMTP_TO` | | Sender identity, and where notifications land |
| `IMAP_HOST` `IMAP_PORT` `IMAP_USER` `IMAP_PASS` | | Admin inbox. Falls back to the `SMTP_USER`/`SMTP_PASS` mailbox |
| `CLOUDINARY_*` | | Image hosting. Falls back to `/public/uploads` |
| `GROQ_API_KEY` / `GROQ_MODEL` | | AI draft generation in the admin |
| `PERFEX_WTL_URL` | | Perfex web-to-lead endpoint. Defaults to the production form |
| `PERFEX_API_TOKEN` / `PERFEX_API_URL` | | Perfex REST API. Preferred over the form: returns the lead id so status syncs back |
| `PERFEX_LEAD_SOURCE_ID` `PERFEX_LEAD_STATUS_ID` `PERFEX_ASSIGNED_STAFF_ID` | | CRM ids for new leads (default 1 / 2 / 1) |
| `CRON_SECRET` | | Authorises Vercel Cron to call `/api/cron/perfex-sync` (retries failed pushes, reads lead status back) |
| `CRAWLER_LOG_KEY` | | Shared secret for crawler logging. Logging is off without it |
| `INDEXNOW_KEY` | | Instant indexing pings to Bing, Yandex, Naver, Seznam |

**Production deploys need these set on the host.** `.env.local` is gitignored and never ships — a missing `SMTP_*` in production means leads still save and still reach the CRM, but no notification email is sent.

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm seed` | Create/refresh the admin user and settings document |
| `pnpm seed:wipe` | Delete all content. **Keeps the admin user.** Destructive |
| `pnpm seed:services` | Import the built-in service catalogue. Idempotent; `--force` overwrites |

## Architecture

```
src/
├── app/
│   ├── (marketing)/          Public site — one folder per route
│   ├── admin/(panel)/        CMS, auth-gated
│   ├── api/                  Route handlers
│   ├── robots.ts             Per-crawler rules
│   ├── sitemap.ts            Static pages + every dynamic item
│   └── opengraph-image.tsx   Generated OG image
├── components/
│   ├── admin/                Forms, tables, editor, mail thread
│   ├── sections/             Homepage and page sections
│   ├── seo/json-ld.tsx       All structured data
│   └── reactbits/            Animated UI primitives
├── data/                     Static fallbacks: services, nav, countries
├── lib/
│   ├── crud.ts               Resource factory: auth, slugs, revalidation
│   ├── resources.ts          Per-model CRUD wiring
│   ├── content.ts            Public data fetching
│   ├── perfex.ts             Perfex CRM web-to-lead client
│   ├── mailer.ts             SMTP send + branded templates
│   ├── imap.ts               Mailbox reading
│   ├── verify-google.ts      Crawler verification
│   └── site.ts               Business facts used across the site
├── models/index.ts           Mongoose schemas
└── proxy.ts                  Admin gate + crawler logging
```

### Content is database-backed, with static fallbacks

Services, blogs, products, portfolio, testimonials, timeline, and settings live in MongoDB and are edited from `/admin`. Where a static catalogue exists (`src/data/services.ts`), it is used **only** when the collection is empty — so a fresh install renders a complete site before anything is seeded.

One deliberate asymmetry: `getServiceBySlug` falls back to the built-ins only when the collection is empty. Otherwise a service deleted in the admin would resurrect from seed data.

### CRUD goes through one factory

`lib/crud.ts` builds list/create/read/update/delete handlers for a model, and every resource uses it. Auth, slug uniqueness, cache revalidation, and IndexNow pings are handled once rather than per route. Adding a resource means a schema, a Zod pair, and one entry in `lib/resources.ts`.

### Leads are saved first, then synced

`POST /api/leads` writes to MongoDB **before** attempting the CRM push and notification email. Both are best-effort, and their outcome is recorded on the record as `crmStatus` / `emailStatus`. A CRM outage or SMTP failure shows up as a failed status in the admin rather than a lost lead.

Perfex runs CodeIgniter, whose CSRF is a matched cookie/field pair that rotates, so each submission does a two-step handshake: fetch the form for a fresh token, then post `multipart/form-data` carrying it.

### Structured data

`components/seo/json-ld.tsx` is the single source. It emits Organization + LocalBusiness (one node, one `@id`), WebSite, WebPage, BreadcrumbList, Service, BlogPosting, SoftwareApplication, FAQPage, ProfilePage, Person, ItemList, and JobPosting.

Three rules the file enforces, all easy to get wrong:

- **No `aggregateRating` on the Organization.** Google disallows self-serving reviews for LocalBusiness/Organization; ratings a business publishes about itself are ineligible and risk a manual action. The rating shown on the site is page content, not markup.
- **JobPosting only when `datePosted` is set.** Google requires it, and stale or invented dates can earn a manual action, so the builder returns `null` rather than guessing.
- **Founder is stated once, on Organization.** `Organization.founder` points at the Person. schema.org defines no inverse — `founderOf` and `foundingOrganization` are not real properties and validators reject them.

### Crawler verification

`proxy.ts` records crawler visits on public routes via `waitUntil`, so nothing blocks the response. `/api/crawler-log` verifies Google claims against reverse-then-forward DNS and Google's published IP ranges before marking a hit verified — a forged `Googlebot` user-agent is recorded as unverified rather than believed. Results are at **Admin → Crawlers**.

## Admin

`/admin` — session-cookie auth. `proxy.ts` handles the redirect; the admin layout does the real JWT verification.

| Section | What it does |
| --- | --- |
| Blogs, Services, Products, Portfolio, Testimonials, Timeline, Client Logos | Full CRUD with rich-text editing and image upload |
| Leads | Website enquiries with CRM sync status and CSV export |
| Messages | Contact form submissions, with threaded in-app replies |
| Inbox | Read and reply to the business mailbox over IMAP |
| Crawlers | Verified search-engine activity |
| Media | Upload browser |
| Settings | Site identity, logos, social links, founder profile |

Blogs, products, portfolio, and services support AI-assisted drafting through Groq. Generated drafts are validated before use — an unknown icon key or category is dropped rather than written, and slugs are always derived locally so a model can never decide a public URL.

## Deployment

Deploys as a standard Next.js application; this project runs on **Vercel**.

Before going live:

1. Set every environment variable your features need — `.env.local` does not ship.
2. Point `NEXT_PUBLIC_SITE_URL` at the production origin. Canonicals, the sitemap, and all JSON-LD derive from it.
3. Run `pnpm seed` once against the production database to create the admin user.
4. Submit `sitemap.xml` in Google Search Console.

## Tech stack

**Next.js 16** (App Router, React 19, TypeScript) · **Tailwind CSS 4** · **MongoDB + Mongoose** · **TanStack Query** · **Framer Motion + GSAP** · **TinyMCE** · **Cloudinary** · **Nodemailer + ImapFlow** · **Groq**

## License

Proprietary. © Setups Works. All rights reserved.

## Author

**Nitheesh Rajendran** — Founder & CEO, Setups Works
[setups.works](https://setups.works) · [LinkedIn](https://www.linkedin.com/in/nitheeshdr/) · [GitHub](https://github.com/nitheeshdr)
