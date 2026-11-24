import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addPhoto, isImageDataUrl, normaliseCode, touchPhone } from "@/lib/photobooth";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 200;
const RATE_WINDOW_MS = 10 * 60 * 1000;
/** A full shot can be a few hundred KB; keep it under the platform body cap. */
const MAX_PHOTO_CHARS = 4_000_000;

type Context = { params: Promise<{ id: string }> };

/** The phone uploads a shot it just took. */
export async function POST(req: NextRequest, { params }: Context) {
  if (isRateLimited("photobooth-photo", clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const id = normaliseCode((await params).id);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const image = (body as { image?: unknown } | null)?.image;
  if (!isImageDataUrl(image, MAX_PHOTO_CHARS)) {
    return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
  }
  try {
    await touchPhone(id);
    const photoId = await addPhoto(id, image);
    if (!photoId) return NextResponse.json({ error: "That room has closed." }, { status: 404 });
    return NextResponse.json({ ok: true, id: photoId });
  } catch (error) {
    console.error("POST /api/photobooth/[id]/photo failed:", error);
    return NextResponse.json({ error: "Could not save the photo." }, { status: 500 });
  }
}