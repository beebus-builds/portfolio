import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listChatSince, listLivePilots, pruneFleet, removePresence, sanitizeCallsign, isAccent, upsertPresence } from "@/lib/fleet";
import { clientIp, isRateLimited } from "@/lib/rateLimit";
import { VISITOR_COOKIE, VISITOR_COOKIE_OPTS, visitorId } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The fleet heartbeat: one round trip per poll that (a) upserts the caller's
 * ship telemetry, (b) returns everyone else still live, and (c) returns chat
 * lines past the caller's cursor. The visitor cookie doubles as the pilot
 * identity, so no client-side id is trusted.
 */

/** Heartbeats arrive every ~3s; 40/minute leaves comfortable headroom. */
const FLEET_LIMIT = 40;
const FLEET_WINDOW_MS = 60_000;
const MAX_COORD = 5000;
const MODES = new Set(["cruise", "docked", "landing"]);

function number3(value: unknown, max: number): [number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const out: number[] = [];
  for (const item of value) {
    if (typeof item !== "number" || !Number.isFinite(item) || Math.abs(item) > max) return null;
    out.push(item);
  }
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0];
}

/** Accepts any nonzero quaternion and hands back a normalized one. */
function quat4(value: unknown): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const x = typeof value[0] === "number" && Number.isFinite(value[0]) ? value[0] : null;
  const y = typeof value[1] === "number" && Number.isFinite(value[1]) ? value[1] : null;
  const z = typeof value[2] === "number" && Number.isFinite(value[2]) ? value[2] : null;
  const w = typeof value[3] === "number" && Number.isFinite(value[3]) ? value[3] : null;
  if (x === null || y === null || z === null || w === null) return null;
  const length = Math.hypot(x, y, z, w);
  if (length < 1e-6) return null;
  return [x / length, y / length, z / length, w / length];
}

function reply(body: unknown, status: number | undefined, fresh: boolean, id: string) {
  const res = NextResponse.json(body, status ? { status } : undefined);
  if (fresh) res.cookies.set(VISITOR_COOKIE, id, VISITOR_COOKIE_OPTS);
  return res;
}

export async function POST(req: NextRequest) {
  const { id, fresh } = visitorId(req);

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return reply({ error: "Invalid request body" }, 400, fresh, id);
  }

  // A departing tab clears its own presence; no telemetry required.
  if (payload.offline === true) {
    try {
      await removePresence(id);
    } catch (error) {
      console.error("POST /api/fleet failed:", error);
    }
    return reply({ ok: true }, undefined, fresh, id);
  }

  if (isRateLimited("fleet", clientIp(req), FLEET_LIMIT, FLEET_WINDOW_MS)) {
    return reply({ error: "Too many heartbeats." }, 429, fresh, id);
  }

  const p = number3(payload.p, MAX_COORD);
  const q = quat4(payload.q);
  if (!p || !q) return reply({ error: "Invalid telemetry" }, 400, fresh, id);

  const speed =
    typeof payload.speed === "number" && Number.isFinite(payload.speed)
      ? Math.min(300, Math.max(0, payload.speed))
      : 0;
  const boosting = payload.boosting === true;
  const mode = typeof payload.mode === "string" && MODES.has(payload.mode) ? payload.mode : "cruise";
  const callsign = sanitizeCallsign(payload.callsign, id);
  const accent = isAccent(payload.accent) ? payload.accent : "#38bdf8";
  const since =
    typeof payload.since === "number" && Number.isFinite(payload.since) && payload.since >= 0
      ? Math.floor(payload.since)
      : 0;

  try {
    await upsertPresence({ visitorId: id, callsign, accent, p, q, speed, boosting, mode });
    const [pilots, messages] = await Promise.all([listLivePilots(id), listChatSince(since)]);
    // Opportunistic housekeeping: ~5% of heartbeats tidy the tables.
    if (Math.random() < 0.05) void pruneFleet().catch(() => undefined);
    return reply({ you: { id, callsign }, pilots, messages }, undefined, fresh, id);
  } catch (error) {
    console.error("POST /api/fleet failed:", error);
    // The deck degrades to an empty sky rather than an error page.
    return reply({ you: { id, callsign }, pilots: [], messages: [] }, undefined, fresh, id);
  }
}
