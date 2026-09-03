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

export async function query<T>(text: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

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

export interface ProjectRow {
  slug: string;
  title: string;
  tag: string;
  repo: string;
  description: string;
  tech: string[];
  color: string;
  url: string | null;
  role: string;
  year: string;
  highlights: string[];
  process: string[];
  outcome: string;
  metrics: string[];
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

export interface CommentRow {
  id: number;
  post_slug: string;
  name: string;
  content: string;
  created_at: string;
}


// ... existing code ...

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

  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      tag TEXT NOT NULL,
      repo TEXT NOT NULL,
      description TEXT NOT NULL,
      tech TEXT[] NOT NULL DEFAULT '{}',
      color TEXT NOT NULL DEFAULT '#4af0ff',
      url TEXT,
      role TEXT NOT NULL,
      year TEXT NOT NULL,
      highlights TEXT[] NOT NULL DEFAULT '{}',
      process TEXT[] NOT NULL DEFAULT '{}',
      outcome TEXT NOT NULL,
      metrics TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS metrics TEXT[] NOT NULL DEFAULT '{}'`);

  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT ''`);

  await query(`
    CREATE TABLE IF NOT EXISTS post_views (
      slug TEXT PRIMARY KEY,
      views INTEGER NOT NULL DEFAULT 0
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      post_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

// ... existing code ...

export async function saveMessage(name: string, email: string, message: string, subject = ""): Promise<void> {
  await ensureSchema();
  await query(
    `INSERT INTO messages (name, email, subject, message) VALUES ($1, $2, $3, $4)`,
    [name, email, subject, message]
  );
}

export async function listMessages(): Promise<MessageRow[]> {
  await ensureSchema();
  return await query<MessageRow>(`SELECT * FROM messages ORDER BY created_at DESC`);
}


// ... existing code ...

export async function listProjects(): Promise<ProjectRow[]> {
  await ensureSchema();
  return await query<ProjectRow>(`SELECT * FROM projects ORDER BY year DESC`);
}

export async function getProjectBySlug(slug: string): Promise<ProjectRow | null> {
  await ensureSchema();
  const rows = await query<ProjectRow>(`SELECT * FROM projects WHERE slug = $1`, [slug]);
  return rows.length ? rows[0] : null;
}

export async function upsertProject(input: ProjectRow): Promise<void> {
  await ensureSchema();
  const metrics = input.metrics ?? [];
  await query(
    `INSERT INTO projects (slug, title, tag, repo, description, tech, color, url, role, year, highlights, process, outcome, metrics, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, now())
     ON CONFLICT (slug)
     DO UPDATE SET title = EXCLUDED.title, tag = EXCLUDED.tag, repo = EXCLUDED.repo,
       description = EXCLUDED.description, tech = EXCLUDED.tech, color = EXCLUDED.color,
       url = EXCLUDED.url, role = EXCLUDED.role, year = EXCLUDED.year,
       highlights = EXCLUDED.highlights, process = EXCLUDED.process, outcome = EXCLUDED.outcome,
       metrics = EXCLUDED.metrics, updated_at = now()`,
    [input.slug, input.title, input.tag, input.repo, input.description, input.tech, input.color, input.url, input.role, input.year, input.highlights, input.process, input.outcome, metrics]
  );
}

export async function deleteProject(slug: string): Promise<boolean> {
  await ensureSchema();
  const rows = await query<{ slug: string }>(`DELETE FROM projects WHERE slug = $1 RETURNING slug`, [slug]);
  return rows.length > 0;
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

export async function incrementPostViews(slug: string): Promise<number> {
  await ensureSchema();
  const rows = await query<{ views: number }>(
    `INSERT INTO post_views (slug, views) VALUES ($1, 1)
     ON CONFLICT (slug) DO UPDATE SET views = post_views.views + 1
     RETURNING views`,
    [slug]
  );
  return rows[0]?.views ?? 1;
}

export async function getPostViews(slug: string): Promise<number> {
  await ensureSchema();
  const rows = await query<{ views: number }>(`SELECT views FROM post_views WHERE slug = $1`, [slug]);
  return rows[0]?.views ?? 0;
}

export async function listComments(postSlug: string): Promise<CommentRow[]> {
  await ensureSchema();
  return await query<CommentRow>(
    `SELECT * FROM comments WHERE post_slug = $1 ORDER BY created_at DESC`,
    [postSlug]
  );
}

export async function addComment(postSlug: string, name: string, content: string): Promise<CommentRow> {
  await ensureSchema();
  const rows = await query<CommentRow>(
    `INSERT INTO comments (post_slug, name, content) VALUES ($1, $2, $3) RETURNING *`,
    [postSlug, name, content]
  );
  return rows[0];
}

