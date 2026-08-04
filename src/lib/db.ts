import { Pool } from "@neondatabase/serverless";

export interface PostRow {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  color: string;
  excerpt: string;
  content: string;
  reading_time: number;
  cover: string | null;
  created_at: string;
  updated_at: string;
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function ensureSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      color TEXT NOT NULL DEFAULT '#4af0ff',
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      reading_time INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover TEXT`);
}

function mapRow(row: PostRow) {
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    tags: row.tags,
    color: row.color,
    excerpt: row.excerpt,
    content: row.content,
    readingTime: row.reading_time,
    cover: row.cover,
  };
}

export async function listPosts(): Promise<ReturnType<typeof mapRow>[]> {
  await ensureSchema();
  const rows = await query<PostRow>(`SELECT * FROM posts ORDER BY date DESC`);
  return rows.map(mapRow);
}

export async function getPostBySlug(slug: string): Promise<ReturnType<typeof mapRow> | null> {
  await ensureSchema();
  const rows = await query<PostRow>(`SELECT * FROM posts WHERE slug = $1`, [slug]);
  return rows.length ? mapRow(rows[0]) : null;
}

export async function upsertPost(input: {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  color: string;
  excerpt: string;
  content: string;
  readingTime: number;
  cover?: string | null;
}): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO posts (slug, title, date, tags, color, excerpt, content, reading_time, cover, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     ON CONFLICT (slug)
     DO UPDATE SET title = EXCLUDED.title, date = EXCLUDED.date, tags = EXCLUDED.tags,
       color = EXCLUDED.color, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
       reading_time = EXCLUDED.reading_time, cover = EXCLUDED.cover, updated_at = now()`,
    [input.slug, input.title, input.date, input.tags, input.color, input.excerpt, input.content, input.readingTime, input.cover || null]
  );
}

export async function deletePost(slug: string): Promise<boolean> {
  await ensureSchema();
  const rows = await query<{ slug: string }>(`DELETE FROM posts WHERE slug = $1 RETURNING slug`, [slug]);
  return rows.length > 0;
}

export async function slugExists(slug: string): Promise<boolean> {
  await ensureSchema();
  const rows = await query<{ exists: boolean }>(`SELECT EXISTS(SELECT 1 FROM posts WHERE slug = $1) AS exists`, [slug]);
  return rows[0]?.exists ?? false;
}
