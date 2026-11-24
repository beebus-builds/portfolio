import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSession } from "@/lib/photobooth";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

/** Open a fresh photobooth session and hand back its short code. */
export async function POST(req: NextRequest) {
  if (isRateLimited("photobooth-create", clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many rooms opened — try again later." }, { status: 429 });
  }
  try {
    const id = await createSession();
    return NextResponse.json({ id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/photobooth failed:", error);
    return NextResponse.json({ error: "The photobooth could not start." }, { status: 500 });
  }
}