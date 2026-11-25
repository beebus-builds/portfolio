import { createHash, randomBytes, randomUUID } from "node:crypto";
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
    status TEXT NOT NULL DEFAULT 'waiting',
    desktop_token_hash TEXT NOT NULL,
    join_token_hash TEXT,
    phone_token_hash TEXT,
    photo_count INTEGER NOT NULL DEFAULT 0,
    photo_chars BIGINT NOT NULL DEFAULT 0
  );
  ALTER TABLE photobooth_sessions ADD COLUMN IF NOT EXISTS desktop_token_hash TEXT;
  ALTER TABLE photobooth_sessions ADD COLUMN IF NOT EXISTS join_token_hash TEXT;
  ALTER TABLE photobooth_sessions ADD COLUMN IF NOT EXISTS phone_token_hash TEXT;
  ALTER TABLE photobooth_sessions ADD COLUMN IF NOT EXISTS photo_count INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE photobooth_sessions ADD COLUMN IF NOT EXISTS photo_chars BIGINT NOT NULL DEFAULT 0;
  DELETE FROM photobooth_sessions WHERE desktop_token_hash IS NULL;
  CREATE TABLE IF NOT EXISTS photobooth_photos (
    id UUID PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES photobooth_sessions(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS photobooth_photos_session_idx
    ON photobooth_photos (session_id, created_at DESC);
  UPDATE photobooth_sessions s
     SET photo_count = totals.photo_count,
         photo_chars = totals.photo_chars
    FROM (
      SELECT session_id,
             COUNT(*)::integer AS photo_count,
             COALESCE(SUM(LENGTH(image)), 0)::bigint AS photo_chars
        FROM photobooth_photos
       GROUP BY session_id
    ) totals
   WHERE s.id = totals.session_id
     AND s.photo_count = 0
     AND s.photo_chars = 0;
`;

/** Phone counts as "live" if it has checked in within this window. */
export const PHONE_ONLINE_MS = 15_000;
/** A preview frame is "fresh" for this long; older ones are shown dimmed. */
export const PREVIEW_FRESH_MS = 20_000;
/** How long a whole session lives before it is swept up. */
export const SESSION_TTL_MS = 6 * 60 * 60 * 1000;
/** The number of shots kept in one room. This also bounds database usage. */
export const MAX_SESSION_PHOTOS = 24;
/** The total encoded photo payload kept in one room. */
export const MAX_SESSION_PHOTO_CHARS = 24_000_000;
/** How many recent shots the desktop is told about per poll. */
const MAX_PHOTOS = MAX_SESSION_PHOTOS;
/** How often an active server instance looks for expired rooms. */
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

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

/** A high-entropy capability used for desktop or phone access. */
function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only hashes of capabilities are stored in the database. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Delete expired sessions (and, through the cascade, their photos). */
async function deleteExpiredSessions(): Promise<void> {
  await ensureSchema("photobooth-v2", SCHEMA);
  await query(`DELETE FROM photobooth_sessions WHERE created_at < now() - ($1::text || ' milliseconds')::interval`, [
    String(SESSION_TTL_MS),
  ]);
}

/** Opportunistically clear out sessions (and their photos) that have expired. */
export async function sweepExpiredSessions(): Promise<void> {
  try {
    await deleteExpiredSessions();
  } catch {
    // A failed sweep should never block opening the photobooth.
  }
}

/** Avoid a delete query on every poll while still expiring idle rooms. */
let nextSweepAt = 0;
async function sweepExpiredSessionsIfDue(): Promise<void> {
  const now = Date.now();
  if (now < nextSweepAt) return;
  try {
    await deleteExpiredSessions();
    nextSweepAt = now + SWEEP_INTERVAL_MS;
  } catch {
    // Retry sooner after a transient database failure.
    nextSweepAt = now + 60_000;
  }
}

export type CreatedSession = {
  id: string;
  /** Kept by the desktop; required for state, captures, downloads and closing. */
  desktopToken: string;
  /** Put in the QR link; exchanged once for a phone-specific token. */
  joinToken: string;
};

/** Create a fresh session and return its short id plus role capabilities. */
export async function createSession(): Promise<CreatedSession> {
  await ensureSchema("photobooth-v2", SCHEMA);
  await sweepExpiredSessions();
  const desktopToken = generateToken();
  const joinToken = generateToken();
  // Retry on the (astronomically unlikely) id collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = generateCode();
    try {
      await query(
        `INSERT INTO photobooth_sessions (id, desktop_token_hash, join_token_hash)
         VALUES ($1, $2, $3)`,
        [id, hashToken(desktopToken), hashToken(joinToken)]
      );
      return { id, desktopToken, joinToken };
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code !== "23505") throw error; // only retry unique violations
    }
  }
  throw new Error("Could not allocate a photobooth code.");
}

/** Mark the desktop as present and return the current shared state. */
export async function getSessionState(id: string, desktopToken: string): Promise<SessionState | null> {
  await ensureSchema("photobooth-v2", SCHEMA);
  await sweepExpiredSessionsIfDue();
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
       AND desktop_token_hash = $2
       AND created_at >= now() - ($3::text || ' milliseconds')::interval
     RETURNING id, status, phone_seen_at, preview, preview_at, capture_seq,
       photo_count,
       (SELECT COALESCE(
          json_agg(json_build_object('id', id, 'created_at', created_at) ORDER BY created_at DESC)
          , '[]'::json)
        FROM (SELECT id, created_at FROM photobooth_photos
              WHERE session_id = photobooth_sessions.id
              ORDER BY created_at DESC LIMIT ${MAX_PHOTOS}) recent) AS photos`,
    [id, hashToken(desktopToken), String(SESSION_TTL_MS)]
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

export type PhoneJoinResult = {
  phoneToken: string;
  captureSeq: number;
  status: SessionStatus;
};

export type PhotoboothAccess = "active" | "closed" | "unauthorized";

/** Distinguish an expired room from a phone with the wrong capability. */
export async function getPhoneAccess(id: string, phoneToken: string): Promise<PhotoboothAccess> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const rows = await query<{ authorized: boolean; active: boolean; status: string }>(
    `SELECT phone_token_hash = $2 AS authorized,
            created_at >= now() - ($3::text || ' milliseconds')::interval AS active,
            status
       FROM photobooth_sessions
      WHERE id = $1`,
    [id, hashToken(phoneToken), String(SESSION_TTL_MS)]
  );
  const session = rows[0];
  if (!session || !session.active || session.status === "closed") return "closed";
  return session.authorized ? "active" : "unauthorized";
}

/** Distinguish an expired room from a stale or already-claimed join link. */
export async function getJoinAccess(id: string, joinToken: string): Promise<PhotoboothAccess> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const rows = await query<{ authorized: boolean; available: boolean; active: boolean; status: string }>(
    `SELECT join_token_hash = $2 AS authorized,
            phone_token_hash IS NULL AS available,
            created_at >= now() - ($3::text || ' milliseconds')::interval AS active,
            status
       FROM photobooth_sessions
      WHERE id = $1`,
    [id, hashToken(joinToken), String(SESSION_TTL_MS)]
  );
  const session = rows[0];
  if (!session || !session.active || session.status === "closed") return "closed";
  return session.authorized && session.available ? "active" : "unauthorized";
}

/** Exchange the QR join capability for a phone-only capability, once. */
export async function joinPhone(id: string, joinToken: string): Promise<PhoneJoinResult | null> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const phoneToken = generateToken();
  const rows = await query<{ capture_seq: number; status: string }>(
    `UPDATE photobooth_sessions
        SET phone_token_hash = $2,
            join_token_hash = NULL,
            status = CASE WHEN status = 'waiting' THEN 'live' ELSE status END
      WHERE id = $1
        AND join_token_hash = $3
        AND phone_token_hash IS NULL
        AND status <> 'closed'
        AND created_at >= now() - ($4::text || ' milliseconds')::interval
      RETURNING capture_seq, status`,
    [id, hashToken(phoneToken), hashToken(joinToken), String(SESSION_TTL_MS)]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    phoneToken,
    captureSeq: Number(row.capture_seq ?? 0),
    status: row.status as SessionStatus,
  };
}

/** Read only the small phone-side state; previews and photos stay desktop-only. */
export async function getPhoneState(
  id: string,
  phoneToken: string
): Promise<{ captureSeq: number; status: SessionStatus } | null> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const rows = await query<{ capture_seq: number; status: string }>(
    `SELECT capture_seq, status
     FROM photobooth_sessions
     WHERE id = $1
       AND phone_token_hash = $2
       AND status <> 'closed'
       AND created_at >= now() - ($3::text || ' milliseconds')::interval`,
    [id, hashToken(phoneToken), String(SESSION_TTL_MS)]
  );
  const row = rows[0];
  if (!row) return null;
  return { captureSeq: Number(row.capture_seq ?? 0), status: row.status as SessionStatus };
}

/**
 * The phone checks in: store its latest preview frame and report back whether
 * the desktop (or anyone) has queued a shot since `knownSeq`.
 */
export async function updatePreview(
  id: string,
  phoneToken: string,
  preview: string
): Promise<{ captureSeq: number; status: SessionStatus } | null> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const rows = await query<{ capture_seq: number; status: string }>(
    `UPDATE photobooth_sessions
        SET preview = $3, preview_at = now(), phone_seen_at = now(),
            status = CASE WHEN status = 'waiting' THEN 'live' ELSE status END
      WHERE id = $1
        AND phone_token_hash = $2
        AND status <> 'closed'
        AND created_at >= now() - ($4::text || ' milliseconds')::interval
      RETURNING capture_seq, status`,
    [id, hashToken(phoneToken), preview, String(SESSION_TTL_MS)]
  );
  const row = rows[0];
  if (!row) return null;
  return { captureSeq: Number(row.capture_seq ?? 0), status: row.status as SessionStatus };
}

/** Phone heartbeat without a frame (so "live" stays true even on a still shot). */
export async function touchPhone(id: string, phoneToken: string): Promise<void> {
  await ensureSchema("photobooth-v2", SCHEMA);
  await query(
    `UPDATE photobooth_sessions
        SET phone_seen_at = now()
      WHERE id = $1
        AND phone_token_hash = $2
        AND status <> 'closed'
        AND created_at >= now() - ($3::text || ' milliseconds')::interval`,
    [id, hashToken(phoneToken), String(SESSION_TTL_MS)]
  );
}

/** Queue a shot: bump the sequence so the phone's next check-in sees it. */
export async function requestCapture(id: string, desktopToken: string): Promise<boolean> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const rows = await query<{ capture_seq: number }>(
    `UPDATE photobooth_sessions
        SET capture_seq = capture_seq + 1
      WHERE id = $1
        AND desktop_token_hash = $2
        AND status <> 'closed'
        AND created_at >= now() - ($3::text || ' milliseconds')::interval
      RETURNING capture_seq`,
    [id, hashToken(desktopToken), String(SESSION_TTL_MS)]
  );
  return rows.length > 0;
}

export type AddPhotoResult = { id: string } | { reason: "unauthorized" | "closed" | "full" };

/** Store a full-resolution shot and return its id. */
export async function addPhoto(id: string, phoneToken: string, image: string): Promise<AddPhotoResult> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const photoId = randomUUID();
  const tokenHash = hashToken(phoneToken);

  // Claim capacity on the session row before inserting. PostgreSQL serializes
  // concurrent updates to that row, so two phone requests cannot both pass a
  // count check and push the room over its limit. The insert is part of the
  // same statement, so a failed insert also rolls back the capacity claim.
  const rows = await query<{ id: string }>(
    `WITH claimed AS (
       UPDATE photobooth_sessions
          SET photo_count = photo_count + 1,
              photo_chars = photo_chars + LENGTH($3::text)
        WHERE id = $2
          AND phone_token_hash = $4
          AND status <> 'closed'
          AND created_at >= now() - ($5::text || ' milliseconds')::interval
          AND photo_count < $6
          AND photo_chars + LENGTH($3::text) <= $7
        RETURNING id
     )
     INSERT INTO photobooth_photos (id, session_id, image)
     SELECT $1, id, $3 FROM claimed
     RETURNING id`,
    [
      photoId,
      id,
      image,
      tokenHash,
      String(SESSION_TTL_MS),
      MAX_SESSION_PHOTOS,
      MAX_SESSION_PHOTO_CHARS,
    ]
  );
  if (rows[0]?.id) return { id: rows[0].id };

  // A failed claim is either a full room or an invalid/expired phone. Read
  // the current counters so the phone gets an actionable response.
  const statusRows = await query<{
    authorized: boolean;
    active: boolean;
    status: string;
    photo_count: number;
    photo_chars: string;
  }>(
    `SELECT phone_token_hash = $2 AS authorized,
            created_at >= now() - ($3::text || ' milliseconds')::interval AS active,
            status,
            photo_count,
            photo_chars
       FROM photobooth_sessions
      WHERE id = $1`,
    [id, tokenHash, String(SESSION_TTL_MS)]
  );
  const session = statusRows[0];
  if (!session || !session.authorized) return { reason: "unauthorized" };
  if (!session.active || session.status === "closed") return { reason: "closed" };
  if (
    Number(session.photo_count) >= MAX_SESSION_PHOTOS ||
    Number(session.photo_chars) + image.length > MAX_SESSION_PHOTO_CHARS
  ) {
    return { reason: "full" };
  }
  return { reason: "unauthorized" };
}

export async function getPhoto(id: string, desktopToken: string, photoId: string): Promise<string | null> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const rows = await query<{ image: string }>(
    `SELECT p.image
     FROM photobooth_photos p
     JOIN photobooth_sessions s ON s.id = p.session_id
     WHERE p.session_id = $1
       AND s.desktop_token_hash = $2
       AND p.id = $3
       AND s.created_at >= now() - ($4::text || ' milliseconds')::interval`,
    [id, hashToken(desktopToken), photoId, String(SESSION_TTL_MS)]
  );
  return rows[0]?.image ?? null;
}

/** End a session and wipe everything tied to it (photos included). */
export async function closeSession(id: string, desktopToken: string): Promise<boolean> {
  await ensureSchema("photobooth-v2", SCHEMA);
  const rows = await query<{ id: string }>(
    `DELETE FROM photobooth_sessions WHERE id = $1 AND desktop_token_hash = $2 RETURNING id`,
    [id, hashToken(desktopToken)]
  );
  return rows.length > 0;
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