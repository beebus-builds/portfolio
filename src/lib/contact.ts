import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — add it to .env.local and restart the server.");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export interface MessageRow {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(
        `CREATE TABLE IF NOT EXISTS contact_messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

export async function saveMessage(name: string, email: string, message: string): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)`,
    [name, email, message]
  );
}
