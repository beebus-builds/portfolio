import { Pool } from "@neondatabase/serverless";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — add it to .env and restart the server.");
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

const schemaPromises = new Map<string, Promise<void>>();

/**
 * Runs a `CREATE TABLE IF NOT EXISTS`-style migration once per process.
 * Memoized by key so repeat calls are free, and a failure clears the memo
 * so the next request retries.
 */
export function ensureSchema(key: string, ddl: string): Promise<void> {
  let pending = schemaPromises.get(key);
  if (!pending) {
    pending = getPool()
      .query(ddl)
      .then(() => undefined)
      .catch((error) => {
        schemaPromises.delete(key);
        throw error;
      });
    schemaPromises.set(key, pending);
  }
  return pending;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}
