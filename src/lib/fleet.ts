import { ensureSchema, query } from "@/lib/db";

/**
 * Live multiplayer presence for the flight deck plus the Cheer Park comms
 * channel.
 *
 * Visitors heartbeat their ship's telemetry into `bp07_presences` every few
 * seconds; a row older than the live window is treated as departed. Chat
 * lines land in `bp07_chat` and are polled by id cursor, so a client only
 * ever fetches what it has not seen. Everything is anonymous — the only
 * identity is the site's existing visitor cookie.
 */

const SCHEMA_KEY = "fleet";

const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS bp07_presences (
  visitor_id text PRIMARY KEY,
  callsign text NOT NULL DEFAULT '',
  accent text NOT NULL DEFAULT '#38bdf8',
  x real NOT NULL DEFAULT 0,
  y real NOT NULL DEFAULT 0,
  z real NOT NULL DEFAULT 0,
  qx real NOT NULL DEFAULT 0,
  qy real NOT NULL DEFAULT 0,
  qz real NOT NULL DEFAULT 0,
  qw real NOT NULL DEFAULT 1,
  speed real NOT NULL DEFAULT 0,
  boosting boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'cruise',
  last_seen timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bp07_chat (
  id bigserial PRIMARY KEY,
  visitor_id text NOT NULL,
  callsign text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

/** A pilot still counts as on the deck this many seconds after a heartbeat. */
const LIVE_WINDOW_SQL = "interval '18 seconds'";

export type PresenceInput = {
  visitorId: string;
  callsign: string;
  accent: string;
  p: [number, number, number];
  q: [number, number, number, number];
  speed: number;
  boosting: boolean;
  mode: string;
};

export type LivePilot = {
  id: string;
  callsign: string;
  accent: string;
  p: [number, number, number];
  q: [number, number, number, number];
  speed: number;
  boosting: boolean;
  mode: string;
  age: number;
};

export type ChatRow = {
  id: number;
  from: string;
  callsign: string;
  body: string;
  at: string;
};

interface PresenceDbRow {
  visitor_id: string;
  callsign: string;
  accent: string;
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
  speed: number;
  boosting: boolean;
  mode: string;
  age: string | number;
}

interface ChatDbRow {
  id: string | number;
  visitor_id: string;
  callsign: string;
  body: string;
  created_at: Date | string;
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

/** Server-side callsign cleaner: the same rules the client applies, re-checked. */
export function sanitizeCallsign(value: unknown, seed: string): string {
  const raw = typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 24) : "";
  const clean = raw.replace(/[^\w \-]/g, "").trim();
  if (clean.length >= 2) return clean;
  const suffix = (seed.replace(/[^0-9a-f]/gi, "").slice(-4) || "0000").toUpperCase();
  return `Pilot-${suffix}`;
}

export function isAccent(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export async function upsertPresence(input: PresenceInput): Promise<void> {
  await ensureSchema(SCHEMA_KEY, SCHEMA_DDL);
  await query(
    `INSERT INTO bp07_presences
       (visitor_id, callsign, accent, x, y, z, qx, qy, qz, qw, speed, boosting, mode, last_seen)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now())
     ON CONFLICT (visitor_id) DO UPDATE SET
       callsign = EXCLUDED.callsign,
       accent = EXCLUDED.accent,
       x = EXCLUDED.x, y = EXCLUDED.y, z = EXCLUDED.z,
       qx = EXCLUDED.qx, qy = EXCLUDED.qy, qz = EXCLUDED.qz, qw = EXCLUDED.qw,
       speed = EXCLUDED.speed, boosting = EXCLUDED.boosting, mode = EXCLUDED.mode,
       last_seen = now()`,
    [
      input.visitorId,
      input.callsign,
      input.accent,
      ...input.p,
      ...input.q,
      input.speed,
      input.boosting,
      input.mode,
    ]
  );
}

export async function listLivePilots(excludeId: string): Promise<LivePilot[]> {
  const rows = await query<PresenceDbRow>(
    `SELECT visitor_id, callsign, accent, x, y, z, qx, qy, qz, qw, speed, boosting, mode,
            EXTRACT(EPOCH FROM (now() - last_seen)) AS age
     FROM bp07_presences
     WHERE last_seen > now() - ${LIVE_WINDOW_SQL} AND visitor_id <> $1
     ORDER BY last_seen DESC
     LIMIT 24`,
    [excludeId]
  );
  return rows.map((row) => ({
    id: row.visitor_id,
    callsign: row.callsign,
    accent: isAccent(row.accent) ? row.accent : "#38bdf8",
    p: [row.x, row.y, row.z],
    q: [row.qx, row.qy, row.qz, row.qw],
    speed: row.speed,
    boosting: row.boosting,
    mode: row.mode,
    age: Number(row.age) || 0,
  }));
}

export async function removePresence(visitorId: string): Promise<void> {
  await ensureSchema(SCHEMA_KEY, SCHEMA_DDL);
  await query("DELETE FROM bp07_presences WHERE visitor_id = $1", [visitorId]);
}

/** Housekeeping: drop departed pilots and old chat lines. Cheap, run opportunistically. */
export async function pruneFleet(): Promise<void> {
  await ensureSchema(SCHEMA_KEY, SCHEMA_DDL);
  await query("DELETE FROM bp07_presences WHERE last_seen < now() - interval '5 minutes'");
  await query("DELETE FROM bp07_chat WHERE id < (SELECT COALESCE(MAX(id), 0) - 300 FROM bp07_chat)");
}

export async function insertChatMessage(
  visitorId: string,
  callsign: string,
  body: string
): Promise<ChatRow> {
  await ensureSchema(SCHEMA_KEY, SCHEMA_DDL);
  const rows = await query<ChatDbRow>(
    "INSERT INTO bp07_chat (visitor_id, callsign, body) VALUES ($1, $2, $3) RETURNING id, visitor_id, callsign, body, created_at",
    [visitorId, callsign, body]
  );
  const row = rows[0];
  if (!row) throw new Error("Chat insert returned no row.");
  return {
    id: Number(row.id),
    from: row.visitor_id,
    callsign: row.callsign,
    body: row.body,
    at: iso(row.created_at),
  };
}

export async function listChatSince(since: number): Promise<ChatRow[]> {
  await ensureSchema(SCHEMA_KEY, SCHEMA_DDL);
  const rows =
    since > 0
      ? await query<ChatDbRow>(
          "SELECT id, visitor_id, callsign, body, created_at FROM bp07_chat WHERE id > $1 ORDER BY id ASC LIMIT 40",
          [since]
        )
      : // First sync: the most recent slice of history, replayed in order.
        await query<ChatDbRow>(
          "SELECT id, visitor_id, callsign, body, created_at FROM (SELECT id, visitor_id, callsign, body, created_at FROM bp07_chat ORDER BY id DESC LIMIT 30) recent ORDER BY id ASC"
        );
  return rows.map((row) => ({
    id: Number(row.id),
    from: row.visitor_id,
    callsign: row.callsign,
    body: row.body,
    at: iso(row.created_at),
  }));
}
