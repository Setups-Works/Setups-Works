import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Container, Section } from "@/components/section";
import { siteConfig } from "@/lib/site";
import { JsonLd, pageSchemas } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy Policy",
  description:
    "How Setups Works collects, uses, and protects your personal data — what we gather, why we gather it, who it is shared with, and the rights you have over it.",
};

export default function PrivacyPage() {
  return (
    <>
      {/* These pages carried no structured data at all. They are indexable and
          linked from every footer, so a page with no WebPage node is a hole in
          the site graph rather than a page not worth describing. */}
      <JsonLd
        data={pageSchemas({
          path: "/privacy",
          label: "Privacy Policy",
          description: "How Setups Works collects, uses and protects personal data.",
        })}
      />
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated: January 2026"
        crumbs={[{ label: "Privacy Policy" }]}
      />
      <Section className="pt-4">
        <Container className="max-w-3xl">
          <div className="article-content">
            <p className="lead">
              Your privacy matters to us. This policy explains what data we
              collect, why we collect it, and how we keep it safe.
            </p>
            <h2>Information we collect</h2>
            <p>
              We collect information you provide directly — such as your name,
              email, and message when you contact us or subscribe to our
              newsletter. We also collect anonymous analytics data (pages
              visited, device type) to improve our website.
            </p>
            <h2>How we use your information</h2>
            <p>
              We use your information to respond to inquiries, send newsletters
              you&apos;ve opted into, improve our services, and comply with
              legal obligations. We never sell your personal data to third
              parties.
            </p>
            <h2>Cookies</h2>
            <p>
              We use essential cookies to make the site work and optional
              analytics cookies to understand usage. You can disable cookies in
              your browser settings at any time.
            </p>
            <p>
              We use Google AdSense, a third-party advertising service. Google,
              as a third-party vendor, uses cookies to serve ads on this site
              based on your prior visits to this and other websites. You can
              opt out of personalized advertising by visiting{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>
              , and learn more about how Google uses data at{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
              >
                policies.google.com/technologies/ads
              </a>
              .
            </p>
            <h2>Data retention</h2>
            <p>
              We keep your data only as long as necessary to provide our
              services and meet legal requirements. You can request deletion of
              your data at any time.
            </p>
            <h2>Your rights</h2>
            <p>
              You have the right to access, correct, or delete your personal
              data, and to opt out of marketing communications. To exercise
              these rights, email us at{" "}
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
            </p>
            <h2>Contact</h2>
            <p>
              Questions about this policy? Reach us at{" "}
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
