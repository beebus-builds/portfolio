import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPostRow } from "@/lib/postsStore";
import { COVER_VARIANTS, coverAccent, coverCode, renderCover } from "@/lib/coverArt";
import { query } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Serves the cover art for a post.
 *
 * Seeded posts ship an SVG file in public/blog. Posts written in the admin have
 * no file on disk — Vercel's filesystem is read-only at runtime — so their
 * artwork is generated on demand from the stored accent and variant. Same
 * generator, same visual language, no build step.
 *
 * A pooler-backed database call per image request would be wasteful, so the
 * artwork is cached by the CDN for a day and regenerated on revalidation.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let accent = coverAccent(0);
  let variant = 0;
  let title: string | undefined;
  let code: string | undefined;

  // The editor previews a style before saving, so explicit query parameters
  // win over whatever is stored. The slug is only a seed for the random bits.
  const queryAccent = req.nextUrl.searchParams.get("accent");
  const queryVariant = req.nextUrl.searchParams.get("variant");
  if (queryAccent && /^#[0-9a-f]{6}$/i.test(queryAccent)) accent = queryAccent;
  if (queryVariant && /^\d+$/.test(queryVariant)) {
    variant = Math.min(Number(queryVariant), COVER_VARIANTS.length - 1);
  }

  if (!queryAccent && !queryVariant) {
    try {
      const row = await getPostRow(slug);
      if (row) {
        accent = row.cover_accent || accent;
        variant = Number.isFinite(row.cover_variant) ? row.cover_variant : 0;
        title = row.title;
      }
    } catch (error) {
      console.error(`cover art for ${slug} fell back to defaults:`, error);
    }
  }

  if (!code) {
    try {
      // Number the cover from the post's position in the library, so BP-LOG
      // labels stay in order rather than depending on the slug.
      const rows = await query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM blog_posts WHERE date <= (SELECT date FROM blog_posts WHERE slug = $1)`,
        [slug],
      );
      code = coverCode(Math.max(1, Number(rows[0]?.n ?? 1)));
    } catch {
      code = coverCode(1);
    }
  }

  const category = (title ?? slug)
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 2)
    .join(" ")
    .toUpperCase()
    .slice(0, 24);

  const svg = renderCover({
    slug,
    title,
    code,
    category: category || COVER_VARIANTS[variant % COVER_VARIANTS.length].toUpperCase(),
    accent,
    variant,
  });

  return new NextResponse(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}