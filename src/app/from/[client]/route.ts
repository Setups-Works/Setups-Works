import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Vanity redirect for "Developed by Setups Works" credit links on client
 * sites — e.g. setups.works/from/naturesjoy — so that traffic lands on the
 * lead form pre-tagged with which client sent it, instead of the bare
 * homepage with no way to attribute a resulting lead back to the link.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ client: string }> },
) {
  const { client } = await params;
  const url = new URL("/get-started", req.url);
  url.searchParams.set("ref", client);
  return NextResponse.redirect(url, 307);
}
