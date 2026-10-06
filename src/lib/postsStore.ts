import { ensureSchema, query } from "@/lib/db";
import type { Post, PostSection } from "@/lib/posts";
import { posts as staticPosts } from "@/lib/posts";

/**
 * Database-backed post store.
 *
 * The seeded posts in src/lib/posts.ts are the source of truth for the
 * existing library: they are mirrored into Neon on first read, and any row
 * edited in the admin overrides the mirrored copy. If the database is
 * unavailable entirely, `listPosts` falls back to the static array, so the
 * blog never disappears because Postgres had a bad minute.
 */

const SCHEMA = `CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  minutes INTEGER NOT NULL DEFAULT 5,
  body TEXT[] NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  quote TEXT,
  cover_src TEXT NOT NULL,
  cover_alt TEXT NOT NULL,
  cover_accent TEXT NOT NULL DEFAULT '#38bdf8',
  cover_variant INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

export type PostRow = {
  id: number;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  minutes: number;
  body: string[];
  sections: PostSection[];
  quote: string | null;
  cover_src: string;
  cover_alt: string;
  cover_accent: string;
  cover_variant: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

const SELECT_COLUMNS = `id, slug, title, date, excerpt, tags, minutes, body, sections, quote,
  cover_src, cover_alt, cover_accent, cover_variant, published, created_at, updated_at`;

function rowToPost(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    date: row.date,
    excerpt: row.excerpt,
    tags: row.tags ?? [],
    minutes: row.minutes,
    body: row.body ?? [],
    sections: Array.isArray(row.sections) ? row.sections : [],
    quote: row.quote ?? undefined,
    cover: { src: row.cover_src, alt: row.cover_alt },
  };
}

/**
 * `CREATE TABLE IF NOT EXISTS` will not add columns to a table that already
 * exists, so schema changes have to be spelled out as idempotent ALTERs.
 * The serverless pool speaks HTTP and accepts one statement per query, so each
 * ALTER is sent separately and memoized under its own key.
 */
const MIGRATIONS: Array<[string, string]> = [
  ["cover_accent", "TEXT NOT NULL DEFAULT '#38bdf8'"],
  ["cover_variant", "INTEGER NOT NULL DEFAULT 0"],
];

/**
 * Two concurrent admin requests can race on the same ALTER TABLE and Neon will
 * reject one with a tuple-lock error, so each migration gets a couple of
 * retries before we give up. The pool speaks HTTP and takes one statement per
 * query, so they cannot be batched.
 */
async function runMigration(key: string, sql: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await ensureSchema(key, sql);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 120 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function ensurePostsTable(): Promise<void> {
  await ensureSchema("blog_posts", SCHEMA);
  for (const [column, definition] of MIGRATIONS) {
    await runMigration(
      `blog_posts:migration:${column}`,
      `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS ${column} ${definition}`
    );
  }
}

/** Inserts any static post that is not already present. Never overwrites. */
export async function seedMissingPosts(): Promise<number> {
  await ensurePostsTable();
  const existing = await query<{ slug: string }>(`SELECT slug FROM blog_posts`);
  const known = new Set(existing.map((row) => row.slug));
  const missing = staticPosts.filter((post) => !known.has(post.slug));

  // Seeded posts already have artwork on disk, so the accent and variant
  // columns are only used for artwork generated at request time.
  for (const post of missing) {
    await query(
      `INSERT INTO blog_posts (slug, title, date, excerpt, tags, minutes, body, sections, quote, cover_src, cover_alt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11)
       ON CONFLICT (slug) DO NOTHING`,
      [
        post.slug,
        post.title,
        post.date,
        post.excerpt,
        post.tags,
        post.minutes,
        post.body,
        JSON.stringify(post.sections ?? []),
        post.quote ?? null,
        post.cover.src,
        post.cover.alt,
      ],
    );
  }

  return missing.length;
}

/**
 * Every published post, newest first. Falls back to the static library when
 * the database is unreachable so the blog is never empty.
 */
export async function listPosts(): Promise<Post[]> {
  try {
    await seedMissingPosts();
    const rows = await query<PostRow>(
      `SELECT ${SELECT_COLUMNS} FROM blog_posts WHERE published = TRUE ORDER BY date DESC, id DESC`,
    );
    if (rows.length === 0) throw new Error("no rows");
    return rows.map(rowToPost);
  } catch (error) {
    console.error("listPosts falling back to static library:", error);
    return [...staticPosts].sort((a, b) => b.date.localeCompare(a.date));
  }
}

/** A single post by slug, or undefined. Drafts are excluded. */
export async function getPost(slug: string): Promise<Post | undefined> {
  try {
    await seedMissingPosts();
    const rows = await query<PostRow>(
      `SELECT ${SELECT_COLUMNS} FROM blog_posts WHERE slug = $1 AND published = TRUE`,
      [slug],
    );
    if (rows[0]) return rowToPost(rows[0]);
  } catch (error) {
    console.error(`getPost(${slug}) failed:`, error);
  }
  return staticPosts.find((post) => post.slug === slug);
}

/** Admin view: published and draft posts, newest first. */
export async function listAllPosts(): Promise<PostRow[]> {
  await seedMissingPosts();
  return query<PostRow>(`SELECT ${SELECT_COLUMNS} FROM blog_posts ORDER BY date DESC, id DESC`);
}

export async function getPostRow(slug: string): Promise<PostRow | undefined> {
  await ensurePostsTable();
  const rows = await query<PostRow>(`SELECT ${SELECT_COLUMNS} FROM blog_posts WHERE slug = $1`, [
    slug,
  ]);
  return rows[0];
}

export type PostInput = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  minutes: number;
  body: string[];
  sections: PostSection[];
  quote?: string;
  cover_src: string;
  cover_alt: string;
  cover_accent: string;
  cover_variant: number;
  published: boolean;
};

/** Insert or update by slug. Returns the stored row. */
export async function upsertPost(input: PostInput): Promise<PostRow> {
  await ensurePostsTable();
  const rows = await query<PostRow>(
    `INSERT INTO blog_posts (slug, title, date, excerpt, tags, minutes, body, sections, quote, cover_src, cover_alt, cover_accent, cover_variant, published)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (slug) DO UPDATE SET
       title = EXCLUDED.title,
       date = EXCLUDED.date,
       excerpt = EXCLUDED.excerpt,
       tags = EXCLUDED.tags,
       minutes = EXCLUDED.minutes,
       body = EXCLUDED.body,
       sections = EXCLUDED.sections,
       quote = EXCLUDED.quote,
       cover_src = EXCLUDED.cover_src,
       cover_alt = EXCLUDED.cover_alt,
       cover_accent = EXCLUDED.cover_accent,
       cover_variant = EXCLUDED.cover_variant,
       published = EXCLUDED.published,
       updated_at = now()
     RETURNING ${SELECT_COLUMNS}`,
    [
      input.slug,
      input.title,
      input.date,
      input.excerpt,
      input.tags,
      input.minutes,
      input.body,
      JSON.stringify(input.sections),
      input.quote ?? null,
      input.cover_src,
      input.cover_alt,
      input.cover_accent,
      input.cover_variant,
      input.published,
    ],
  );
  return rows[0];
}

export async function deletePost(slug: string): Promise<boolean> {
  await ensurePostsTable();
  const rows = await query<{ slug: string }>(`DELETE FROM blog_posts WHERE slug = $1 RETURNING slug`, [
    slug,
  ]);
  return rows.length > 0;
}