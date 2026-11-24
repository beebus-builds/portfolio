import { randomBytes, randomUUID } from "node:crypto";
import { ensureSchema, query } from "@/lib/db";

/**
 * Photobooth: a visitor scans a QR code on the desktop, their phone becomes
 * the camera, and the shots they take appear on the big screen (and can be
 * downloaded). The phone streams a small preview frame up to the server and
 * the desktop polls it, so the two devices meet through Postgres — no extra
 * service, and it survives serverless instances because all state lives in the
 * database.
 */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS photobooth_sessions (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    phone_seen_at TIMESTAMPTZ,
    desktop_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    preview TEXT,
    preview_at TIMESTAMPTZ,
    capture_seq INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'waiting'
  );
  CREATE TABLE IF NOT EXISTS photobooth_photos (
    id UUID PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES photobooth_sessions(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS photobooth_photos_session_idx
    ON photobooth_photos (session_id, created_at DESC);
`;

/** Phone counts as "live" if it has checked in within this window. */
export const PHONE_ONLINE_MS = 15_000;
/** A preview frame is "fresh" for this long; older ones are shown dimmed. */
export const PREVIEW_FRESH_MS = 20_000;
/** How long a whole session lives before it is swept up. */
export const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
/** How many recent shots the desktop is told about per poll. */
const MAX_PHOTOS = 24;

export type SessionStatus = "waiting" | "live" | "closed";

export type PhotoMeta = { id: string; createdAt: string };

export type SessionState = {
  id: string;
  status: SessionStatus;
  phoneOnline: boolean;
  /** The latest small preview frame as a data URL, or null. */
  preview: string | null;
  previewFresh: boolean;
  /** Bumped whenever someone asks the phone to take a shot. */
  captureSeq: number;
  /** How many shots have been taken in this session. */
  photoCount: number;
  /** The most recent shots, newest first (ids only — bytes load on demand). */
  photos: PhotoMeta[];
};

// The URL id: short enough to read aloud, unambiguous enough to type. 8 chars
// from a 32-letter alphabet is ~40 bits, which is plenty alongside rate limits.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return code;
}

/** Opportunistically clear out sessions (and their photos) that have expired. */
export async function sweepExpiredSessions(): Promise<void> {
  try {
    await ensureSchema("photobooth", SCHEMA);
    await query(`DELETE FROM photobooth_sessions WHERE created_at < now() - ($1::text || ' milliseconds')::interval`, [
      String(SESSION_TTL_MS),
    ]);
  } catch {
    // A failed sweep should never block opening the photobooth.
  }
}

/** Create a fresh session and return its short id. */
export async function createSession(): Promise<string> {
  await ensureSchema("photobooth", SCHEMA);
  await sweepExpiredSessions();
  // Retry on the (astronomically unlikely) id collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateCode();
    try {
      await query(`INSERT INTO photobooth_sessions (id) VALUES ($1)`, [id]);
      return id;
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== "23505") throw error; // only retry unique violations
    }
  }
  throw new Error("Could not allocate a photobooth code.");
}

export async function sessionExists(id: string): Promise<boolean> {
  await ensureSchema("photobooth", SCHEMA);
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM photobooth_sessions WHERE id = $1) AS exists`,
    [id]
  );
  return rows[0]?.exists ?? false;
}

/** Mark the desktop as present and return the current shared state. */
export async function getSessionState(id: string): Promise<SessionState | null> {
  await ensureSchema("photobooth", SCHEMA);
  const rows = await query<{
    id: string;
    status: string;
    phone_seen_at: Date | null;
    preview: string | null;
    preview_at: Date | null;
    capture_seq: number;
    photo_count: string;
    photos: { id: string; created_at: Date }[] | null;
  }>(
    `UPDATE photobooth_sessions SET desktop_seen_at = now()
       WHERE id = $1
     RETURNING id, status, phone_seen_at, preview, preview_at, capture_seq,
       (SELECT COUNT(*) FROM photobooth_photos WHERE session_id = photobooth_sessions.id) AS photo_count,
       (SELECT COALESCE(
          json_agg(json_build_object('id', id, 'created_at', created_at) ORDER BY created_at DESC)
          , '[]'::json)
        FROM (SELECT id, created_at FROM photobooth_photos
              WHERE session_id = photobooth_sessions.id
              ORDER BY created_at DESC LIMIT ${MAX_PHOTOS}) recent) AS photos`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  const now = Date.now();
  const phoneAt = row.phone_seen_at ? new Date(row.phone_seen_at).getTime() : 0;
  const previewAt = row.preview_at ? new Date(row.preview_at).getTime() : 0;
  const photos = Array.isArray(row.photos)
    ? row.photos.map((photo) => ({ id: photo.id, createdAt: new Date(photo.created_at).toISOString() }))
    : [];
  return {
    id: row.id,
    status: (row.status as SessionStatus) ?? "waiting",
    phoneOnline: phoneAt > 0 && now - phoneAt < PHONE_ONLINE_MS,
    preview: row.preview ?? null,
    previewFresh: previewAt > 0 && now - previewAt < PREVIEW_FRESH_MS,
    captureSeq: Number(row.capture_seq ?? 0),
    photoCount: Number(row.photo_count ?? 0),
    photos,
  };
}

/**
 * The phone checks in: store its latest preview frame and report back whether
 * the desktop (or anyone) has queued a shot since `knownSeq`.
 */
export async function updatePreview(
  id: string,
  preview: string
): Promise<{ captureSeq: number; status: SessionStatus } | null> {
  await ensureSchema("photobooth", SCHEMA);
  const rows = await query<{ capture_seq: number; status: string }>(
    `UPDATE photobooth_sessions
        SET preview = $2, preview_at = now(), phone_seen_at = now(),
            status = CASE WHEN status = 'waiting' THEN 'live' ELSE status END
      WHERE id = $1 AND status <> 'closed'
      RETURNING capture_seq, status`,
    [id, preview]
  );
  const row = rows[0];
  if (!row) return null;
  return { captureSeq: Number(row.capture_seq ?? 0), status: row.status as SessionStatus };
}

/** Phone heartbeat without a frame (so "live" stays true even on a still shot). */
export async function touchPhone(id: string): Promise<void> {
  await ensureSchema("photobooth", SCHEMA);
  await query(`UPDATE photobooth_sessions SET phone_seen_at = now() WHERE id = $1 AND status <> 'closed'`, [id]);
}

/** Queue a shot: bump the sequence so the phone's next check-in sees it. */
export async function requestCapture(id: string): Promise<boolean> {
  await ensureSchema("photobooth", SCHEMA);
  const rows = await query<{ capture_seq: number }>(
    `UPDATE photobooth_sessions
        SET capture_seq = capture_seq + 1
      WHERE id = $1 AND status <> 'closed'
      RETURNING capture_seq`,
    [id]
  );
  return rows.length > 0;
}

/** Store a full-resolution shot and return its id. */
export async function addPhoto(id: string, image: string): Promise<string | null> {
  await ensureSchema("photobooth", SCHEMA);
  const photoId = randomUUID();
  const rows = await query<{ id: string }>(
    `INSERT INTO photobooth_photos (id, session_id, image)
     SELECT $1, id, $3 FROM photobooth_sessions WHERE id = $2 AND status <> 'closed'
     RETURNING id`,
    [photoId, id, image]
  );
  return rows[0]?.id ?? null;
}

export async function getPhoto(id: string, photoId: string): Promise<string | null> {
  await ensureSchema("photobooth", SCHEMA);
  const rows = await query<{ image: string }>(
    `SELECT image FROM photobooth_photos WHERE session_id = $1 AND id = $2`,
    [id, photoId]
  );
  return rows[0]?.image ?? null;
}

/** End a session and wipe everything tied to it (photos included). */
export async function closeSession(id: string): Promise<void> {
  await ensureSchema("photobooth", SCHEMA);
  await query(`DELETE FROM photobooth_sessions WHERE id = $1`, [id]);
}

/** Shape validation for a base64 data URL we accept from the phone. */
export function isImageDataUrl(value: unknown, maxLength: number): value is string {
  if (typeof value !== "string") return false;
  if (value.length > maxLength) return false;
  return /^data:image\/(?:jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

/** Codes are uppercased on the way in so links are forgiving. */
export function normaliseCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}