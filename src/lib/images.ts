import { ensureSchema, query } from "./db";

/**
 * Uploaded post images live in Postgres.
 *
 * They used to be written to `public/uploads`, which works locally but not on
 * Vercel — the runtime filesystem is read-only, so every upload silently
 * vanished at the next deploy and the references in post bodies 404'd. Storing
 * the bytes in Neon keeps them alive everywhere, and `/api/images/[name]`
 * serves them back out.
 */

const SCHEMA = `CREATE TABLE IF NOT EXISTS uploaded_images (
  name TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  bytes BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

export type UploadedImage = {
  name: string;
  mime: string;
  bytes: Buffer;
};

/** Uploads are capped by the route handler, but Postgres gets a hard bound too. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Names come from `safeName`; defense in depth against path tricks. */
export function imageNameOk(name: string): boolean {
  return /^[a-z0-9._-]+$/.test(name) && !name.includes("..");
}

export async function saveImage(name: string, mime: string, bytes: Buffer): Promise<void> {
  await ensureSchema("uploaded_images", SCHEMA);
  await query(
    `INSERT INTO uploaded_images (name, mime, bytes) VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET mime = $2, bytes = $3`,
    [name, mime, bytes]
  );
}

export async function getImage(name: string): Promise<UploadedImage | undefined> {
  if (!imageNameOk(name)) return undefined;
  await ensureSchema("uploaded_images", SCHEMA);
  const rows = await query<{ name: string; mime: string; bytes: Buffer }>(
    `SELECT name, mime, bytes FROM uploaded_images WHERE name = $1`,
    [name]
  );
  const row = rows[0];
  if (!row) return undefined;
  return { name: row.name, mime: row.mime, bytes: Buffer.from(row.bytes) };
}
