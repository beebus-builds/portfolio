import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addPhoto, isImageDataUrl, normaliseCode, touchPhone } from "@/lib/photobooth";
import {
  InvalidJsonBodyError,
  RequestBodyTooLargeError,
  readLimitedJson,
  tokenFromHeaders,
} from "@/lib/photoboothProtocol";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 200;
const RATE_WINDOW_MS = 10 * 60 * 1000;
/** A full shot can be a few hundred KB; keep it under the platform body cap. */
const MAX_PHOTO_CHARS = 4_000_000;

type Context = { params: Promise<{ id: string }> };

/** The phone uploads a shot it just took. */
export async function POST(req: NextRequest, { params }: Context) {
  const id = normaliseCode((await params).id);
  if (isRateLimited(`photobooth-photo:${id}`, clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const phoneToken = tokenFromHeaders(req.headers);
  if (!phoneToken) {
    return NextResponse.json({ error: "This camera is not connected." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readLimitedJson(req, MAX_PHOTO_CHARS + 2_000);
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
    const message = error instanceof InvalidJsonBodyError ? "Invalid request body" : "Photo is too large";
    return NextResponse.json({ error: message }, { status });
  }
  const image = (body as { image?: unknown } | null)?.image;
  if (!isImageDataUrl(image, MAX_PHOTO_CHARS)) {
    return NextResponse.json({ error: "Invalid photo" }, { status: 400 });
  }
  try {
    await touchPhone(id, phoneToken);
    const result = await addPhoto(id, phoneToken, image);
    if ("reason" in result) {
      if (result.reason === "full") {
        return NextResponse.json({ error: "This room has reached its photo limit." }, { status: 409 });
      }
      if (result.reason === "unauthorized") {
        return NextResponse.json({ error: "This camera is not connected." }, { status: 403 });
      }
      return NextResponse.json({ error: "That room has closed." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    console.error("POST /api/photobooth/[id]/photo failed:", error);
    return NextResponse.json({ error: "Could not save the photo." }, { status: 500 });
  }
}
