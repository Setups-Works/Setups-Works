import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

/**
 * /app-ads.txt — authorizes AdMob and Facebook Audience Network to sell ad
 * inventory on behalf of this domain's published apps, per the IAB
 * app-ads.txt spec. Required at the domain root for each network to serve
 * ads without a policy warning.
 */
export function GET(): Response {
  const body =
    `google.com, ${siteConfig.adsensePublisherId}, DIRECT, f08c47fec0942fa0\n` +
    `facebook.com, ${siteConfig.facebookPublisherId}, DIRECT, c3e20eee3f780d68\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
