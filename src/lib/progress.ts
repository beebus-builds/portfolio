import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — add it to .env and restart the server.");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(
        `CREATE TABLE IF NOT EXISTS visitor_progress (
          visitor_id TEXT PRIMARY KEY,
          visited JSONB NOT NULL DEFAULT '[]'::jsonb,
          achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
      );
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export type Progress = { visited: string[]; achievements: string[] };

export async function getProgress(visitorId: string): Promise<Progress> {
  await ensureSchema();
  const rows = await query<{ visited: unknown; achievements: unknown }>(
    `SELECT visited, achievements FROM visitor_progress WHERE visitor_id = $1`,
    [visitorId]
  );
  const row = rows[0];
  return {
    visited: Array.isArray(row?.visited) ? (row.visited as string[]) : [],
    achievements: Array.isArray(row?.achievements) ? (row.achievements as string[]) : [],
  };
}

export async function saveProgress(visitorId: string, progress: Progress): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO visitor_progress (visitor_id, visited, achievements, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, now())
     ON CONFLICT (visitor_id)
     DO UPDATE SET visited = $2::jsonb, achievements = $3::jsonb, updated_at = now()`,
    [visitorId, JSON.stringify(progress.visited), JSON.stringify(progress.achievements)]
  );
}
