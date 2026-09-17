export const runtime = "nodejs";

/**
 * /app-ads.txt — authorizes AdMob (and any other listed network) to sell ad
 * inventory on behalf of this domain's published apps, per the IAB
 * app-ads.txt spec. Required at the domain root for AdMob to serve ads
 * without a policy warning.
 */
export function GET(): Response {
  const body = "google.com, pub-6621171335214437, DIRECT, f08c47fec0942fa0\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
