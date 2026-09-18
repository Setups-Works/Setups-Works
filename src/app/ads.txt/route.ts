import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

/**
 * /ads.txt — the web counterpart to /app-ads.txt. Same authorization line,
 * same IAB spec, but this one covers ad inventory sold on the website itself
 * rather than in a published app.
 */
export function GET(): Response {
  const body = `google.com, ${siteConfig.adsensePublisherId}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
