import { ensureSchema, query } from "@/lib/db";

const SCHEMA = `CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

export type ContactMessage = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export async function saveMessage(name: string, email: string, message: string): Promise<void> {
  await ensureSchema("contact_messages", SCHEMA);
  await query(
    `INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)`,
    [name, email, message]
  );
}

export async function listRecentMessages(limit = 50): Promise<ContactMessage[]> {
  await ensureSchema("contact_messages", SCHEMA);
  const capped = Math.min(Math.max(Math.floor(limit), 1), 200);
  return query<ContactMessage>(
    `SELECT id, name, email, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT $1`,
    [capped]
  );
}

export async function countMessages(): Promise<number> {
  await ensureSchema("contact_messages", SCHEMA);
  const rows = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM contact_messages`);
  return Number(rows[0]?.count ?? 0);
}
