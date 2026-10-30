import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { insertChatMessage, sanitizeCallsign } from "@/lib/fleet";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { VISITOR_COOKIE, VISITOR_COOKIE_OPTS, visitorId } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cheer Park comms: one endpoint, one job — post a chat line to the fleet
 * channel. Delivery happens through the fleet heartbeat's chat cursor, so
 * this route only validates, rate-limits and stores.
 */

const CHAT_LIMIT = 8;
const CHAT_WINDOW_MS = 60_000;
const MAX_BODY = 280;

/** Chat lines are single-line: strip control characters, merge space runs. */
function cleanBody(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const flat = value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (flat.length < 1 || flat.length > MAX_BODY) return null;
  return flat;
}

export async function POST(req: NextRequest) {
  const { id, fresh } = visitorId(req);
  const finish = (body: unknown, status?: number) => {
    const res = NextResponse.json(body, status ? { status } : undefined);
    if (fresh) res.cookies.set(VISITOR_COOKIE, id, VISITOR_COOKIE_OPTS);
    return res;
  };

  let payload: { body?: unknown; callsign?: unknown };
  try {
    payload = (await req.json()) as { body?: unknown; callsign?: unknown };
  } catch {
    return finish({ error: "Invalid request body" }, 400);
  }

  if (isRateLimited("chat", clientIp(req), CHAT_LIMIT, CHAT_WINDOW_MS)) {
    return finish({ error: "Comms cooling down — wait a moment." }, 429);
  }

  const body = cleanBody(payload.body);
  if (!body) return finish({ error: "Message must be 1-280 characters." }, 400);

  const callsign = sanitizeCallsign(payload.callsign, id);

  try {
    const message = await insertChatMessage(id, callsign, body);
    return finish({ message });
  } catch (error) {
    console.error("POST /api/chat failed:", error);
    return finish({ error: "The message could not be delivered." }, 500);
  }
}
