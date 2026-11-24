import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { closeSession, getSessionState, normaliseCode } from "@/lib/photobooth";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

// Desktop polls this frequently, so the budget is generous.
const RATE_LIMIT = 6000;
const RATE_WINDOW_MS = 10 * 60 * 1000;

type Context = { params: Promise<{ id: string }> };

/** The desktop's view of a session: who's online, the live preview, the shots. */
export async function GET(req: NextRequest, { params }: Context) {
  if (isRateLimited("photobooth-get", clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const id = normaliseCode((await params).id);
  try {
    const state = await getSessionState(id);
    if (!state) return NextResponse.json({ error: "That room has closed." }, { status: 404 });
    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/photobooth/[id] failed:", error);
    return NextResponse.json({ error: "Could not read the room." }, { status: 500 });
  }
}

/** Close the room and wipe its photos (privacy: shots are not kept around). */
export async function DELETE(req: NextRequest, { params }: Context) {
  if (isRateLimited("photobooth-close", clientIp(req), 60, 60 * 1000)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }
  const id = normaliseCode((await params).id);
  try {
    await closeSession(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/photobooth/[id] failed:", error);
    return NextResponse.json({ error: "Could not close the room." }, { status: 500 });
  }
}