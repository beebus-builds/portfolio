import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isImageDataUrl, normaliseCode, updatePreview } from "@/lib/photobooth";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

// The phone pushes a small frame every ~700ms; allow a healthy ceiling.
const RATE_LIMIT = 3000;
const RATE_WINDOW_MS = 10 * 60 * 1000;
/** A preview is kept deliberately small — it only drives the live thumbnail. */
const MAX_PREVIEW_CHARS = 400_000;

type Context = { params: Promise<{ id: string }> };

/**
 * The phone checks in with its latest preview frame and, in the same reply,
 * learns whether a shot has been queued for it.
 */
export async function POST(req: NextRequest, { params }: Context) {
  if (isRateLimited("photobooth-preview", clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const id = normaliseCode((await params).id);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const preview = (body as { preview?: unknown } | null)?.preview;
  if (!isImageDataUrl(preview, MAX_PREVIEW_CHARS)) {
    return NextResponse.json({ error: "Invalid preview frame" }, { status: 400 });
  }
  try {
    const result = await updatePreview(id, preview);
    if (!result) return NextResponse.json({ error: "That room has closed." }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/photobooth/[id]/preview failed:", error);
    return NextResponse.json({ error: "Could not send the preview." }, { status: 500 });
  }
}