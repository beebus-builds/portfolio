import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPhoto, normaliseCode } from "@/lib/photobooth";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 1000;
const RATE_WINDOW_MS = 10 * 60 * 1000;

type Context = { params: Promise<{ id: string; photoId: string }> };

/** Load one shot's bytes, on demand, once the desktop sees it in the list. */
export async function GET(req: NextRequest, { params }: Context) {
  if (isRateLimited("photobooth-photo-get", clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const { id: rawId, photoId } = await params;
  const id = normaliseCode(rawId);
  if (!/^[0-9a-f-]{36}$/i.test(photoId)) {
    return NextResponse.json({ error: "Bad photo id" }, { status: 400 });
  }
  try {
    const image = await getPhoto(id, photoId);
    if (!image) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    return NextResponse.json({ image }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/photobooth/[id]/photos/[photoId] failed:", error);
    return NextResponse.json({ error: "Could not load the photo." }, { status: 500 });
  }
}