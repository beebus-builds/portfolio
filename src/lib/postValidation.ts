import type { PostSection } from "./posts";
import type { PostInput } from "./postsStore";
import { COVER_VARIANTS } from "./coverArt";

/**
 * Validation for editor payloads.
 *
 * Lives here rather than in the route file because both the collection route
 * and the [slug] route need it, and Next.js only permits specific exports
 * from a route module.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COVER_SRC_RE = /^(\/blog\/[A-Za-z0-9._-]+\.svg|\/api\/cover\/[a-z0-9-]+)$/;

export type PostPayload = Record<string, unknown>;

export type Validated =
  | { ok: true; input: PostInput }
  | { ok: false; errors: string[] };

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/** Accepts either `{ lang, snippet }` objects or a bare string of code. */
function asCode(value: unknown): { lang: string; snippet: string } | undefined {
  if (typeof value === "string") {
    const snippet = value.trim();
    return snippet ? { lang: "text", snippet } : undefined;
  }
  if (typeof value !== "object" || value === null) return undefined;
  const record = value as PostPayload;
  const snippet = asString(record.snippet);
  if (!snippet) return undefined;
  return { lang: asString(record.lang) || "text", snippet };
}

function asSections(value: unknown): PostSection[] {
  if (!Array.isArray(value)) return [];
  const out: PostSection[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as PostPayload;
    const heading = asString(record.heading);
    const paragraphs = asStringArray(record.paragraphs);
    if (!heading || paragraphs.length === 0) continue;
    const bullets = asStringArray(record.bullets);
    const code = asCode(record.code);
    out.push({
      heading,
      paragraphs,
      ...(bullets.length ? { bullets } : {}),
      ...(code ? { code } : {}),
    });
  }
  return out;
}

/** Checks an editor payload and returns a typed input or the list of problems. */
export function validatePostInput(raw: PostPayload, forcedSlug?: string): Validated {
  const errors: string[] = [];

  const slug = (forcedSlug ?? asString(raw.slug)).toLowerCase();
  if (!SLUG_RE.test(slug)) errors.push("Slug must be lowercase words separated by hyphens.");
  if (slug.length > 80) errors.push("Slug must be 80 characters or fewer.");

  const title = asString(raw.title);
  if (title.length < 8) errors.push("Title must be at least 8 characters.");
  if (title.length > 140) errors.push("Title must be 140 characters or fewer.");

  const date = asString(raw.date);
  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    errors.push("Date must be a valid YYYY-MM-DD date.");
  }

  const excerpt = asString(raw.excerpt);
  if (excerpt.length < 40) errors.push("Excerpt must be at least 40 characters — it is the share text.");
  if (excerpt.length > 300) errors.push("Excerpt must be 300 characters or fewer.");

  const tags = asStringArray(raw.tags)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (tags.length === 0) errors.push("At least one tag is required.");

  const minutesRaw = Number(raw.minutes);
  const minutes = Number.isFinite(minutesRaw) ? Math.round(minutesRaw) : 5;
  if (minutes < 1 || minutes > 60) errors.push("Read time must be between 1 and 60 minutes.");

  const body = asStringArray(raw.body);
  if (body.length === 0) errors.push("The post needs at least one opening paragraph.");

  const sections = asSections(raw.sections);
  const quote = asString(raw.quote);

  // Artwork generated in the admin is served from the cover route; seeded
  // posts point at a file in /blog. Both are allowed, nothing else is.
  const coverSrc = asString(raw.cover_src);
  if (coverSrc && !COVER_SRC_RE.test(coverSrc)) {
    errors.push("Cover must be a generated SVG under /blog/ or /api/cover/.");
  }

  const coverAlt = asString(raw.cover_alt);
  if (coverAlt.length < 15) errors.push("Cover alt text must describe the artwork.");

  const accentRaw = asString(raw.cover_accent) || "#38bdf8";
  if (!/^#[0-9a-f]{6}$/i.test(accentRaw)) {
    errors.push("Accent colour must be a hex value like #38bdf8.");
  }
  const coverAccent = accentRaw.toLowerCase();

  const variantRaw = Number(raw.cover_variant);
  const coverVariant = Number.isFinite(variantRaw) ? Math.round(variantRaw) : 0;
  if (coverVariant < 0 || coverVariant > COVER_VARIANTS.length - 1) {
    errors.push(`Cover style must be between 0 and ${COVER_VARIANTS.length - 1}.`);
  }

  const published = raw.published !== false;

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    input: {
      slug,
      title,
      date,
      excerpt,
      tags,
      minutes,
      body,
      sections,
      ...(quote ? { quote } : {}),
      cover_src: coverSrc,
      cover_alt: coverAlt,
      cover_accent: coverAccent,
      cover_variant: coverVariant,
      published,
    },
  };
}