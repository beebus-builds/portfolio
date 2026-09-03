import { Pool } from "@neondatabase/serverless";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const contentDir = join(process.cwd(), "content", "blog");

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      meta[key] = value;
    }
  }
  return { meta, body: match[2] };
}

function getReadingTime(md) {
  const text = md.replace(/^---[\s\S]*?---/, "").trim();
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — add it to .env.local before migrating.");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query("DROP TABLE IF EXISTS posts");

  await pool.query(`
    CREATE TABLE posts (
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

  if (!existsSync(contentDir)) {
    console.log("No content/blog directory — nothing to migrate.");
    await pool.end();
    return;
  }

  const files = readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  if (!files.length) {
    console.log("No markdown posts found.");
    await pool.end();
    return;
  }

  for (const file of files) {
    const content = readFileSync(join(contentDir, file), "utf-8");
    const { meta, body } = parseFrontmatter(content);
    const slug = file.replace(/\.md$/, "");
    const tags = (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    const excerpt = (meta.excerpt || body.slice(0, 160).replace(/[#*]/g, "").trim());

    await pool.query(
      `INSERT INTO posts (slug, title, date, tags, color, excerpt, content, reading_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO NOTHING`,
      [slug, meta.title || slug, meta.date || "", tags, meta.color || "#4af0ff", excerpt, body, getReadingTime(body)]
    );
    console.log(`Migrated: ${slug}`);
  }

  const { rows } = await pool.query("SELECT slug, title FROM posts ORDER BY date DESC");
  console.log(`Total posts in DB: ${rows.length}`);
  rows.forEach((r) => console.log(`  - ${r.slug} (${r.title})`));

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
