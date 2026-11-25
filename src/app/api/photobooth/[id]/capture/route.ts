import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normaliseCode, requestCapture } from "@/lib/photobooth";
import { tokenFromHeaders } from "@/lib/photoboothProtocol";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 10 * 60 * 1000;

type Context = { params: Promise<{ id: string }> };

/** Ask the phone to take a shot (the big-screen shutter button). */
export async function POST(req: NextRequest, { params }: Context) {
  const id = normaliseCode((await params).id);
  if (isRateLimited(`photobooth-capture:${id}`, clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const desktopToken = tokenFromHeaders(req.headers);
  if (!desktopToken) {
    return NextResponse.json({ error: "That room has closed." }, { status: 404 });
  }
  try {
    const ok = await requestCapture(id, desktopToken);
    if (!ok) return NextResponse.json({ error: "That room has closed." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/photobooth/[id]/capture failed:", error);
    return NextResponse.json({ error: "Could not take the shot." }, { status: 500 });
  }
}
