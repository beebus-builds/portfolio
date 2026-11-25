import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getPhoneAccess,
  getPhoneState,
  isImageDataUrl,
  normaliseCode,
  updatePreview,
} from "@/lib/photobooth";
import {
  InvalidJsonBodyError,
  RequestBodyTooLargeError,
  readLimitedJson,
  tokenFromHeaders,
} from "@/lib/photoboothProtocol";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

// The phone pushes a small frame every ~700ms; allow a healthy ceiling.
const RATE_LIMIT = 3000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
/** A preview is kept deliberately small — it only drives the live thumbnail. */
const MAX_PREVIEW_CHARS = 400_000;

type Context = { params: Promise<{ id: string }> };

/** Resume an already-joined phone and read only its capture state. */
export async function GET(req: NextRequest, { params }: Context) {
  const id = normaliseCode((await params).id);
  const phoneToken = tokenFromHeaders(req.headers);
  if (!phoneToken) {
    return NextResponse.json({ error: "This camera is not connected." }, { status: 403 });
  }
  try {
    const state = await getPhoneState(id, phoneToken);
    if (!state) {
      const access = await getPhoneAccess(id, phoneToken);
      const status = access === "closed" ? 404 : 403;
      return NextResponse.json({ error: "This camera is not connected." }, { status });
    }
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/photobooth/[id]/preview failed:", error);
    return NextResponse.json({ error: "Could not read the camera state." }, { status: 500 });
  }
}

/**
 * The phone checks in with its latest preview frame and, in the same reply,
 * learns whether a shot has been queued for it.
 */
export async function POST(req: NextRequest, { params }: Context) {
  const id = normaliseCode((await params).id);
  if (isRateLimited(`photobooth-preview:${id}`, clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const phoneToken = tokenFromHeaders(req.headers);
  if (!phoneToken) {
    return NextResponse.json({ error: "This camera is not connected." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await readLimitedJson(req, MAX_PREVIEW_CHARS + 2_000);
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
    const message = error instanceof InvalidJsonBodyError ? "Invalid request body" : "Preview frame is too large";
    return NextResponse.json({ error: message }, { status });
  }
  const preview = (body as { preview?: unknown } | null)?.preview;
  if (!isImageDataUrl(preview, MAX_PREVIEW_CHARS)) {
    return NextResponse.json({ error: "Invalid preview frame" }, { status: 400 });
  }
  try {
    const result = await updatePreview(id, phoneToken, preview);
    if (!result) {
      const access = await getPhoneAccess(id, phoneToken);
      const status = access === "closed" ? 404 : 403;
      return NextResponse.json({ error: "This camera is not connected." }, { status });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/photobooth/[id]/preview failed:", error);
    return NextResponse.json({ error: "Could not send the preview." }, { status: 500 });
  }
}
