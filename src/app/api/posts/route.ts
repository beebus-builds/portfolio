import { NextRequest, NextResponse } from "next/server";
import { listPosts, upsertPost } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const posts = await listPosts();
    return NextResponse.json({ posts });
  } catch (err) {
    console.error("GET /api/posts failed:", err);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, date, tags, color, excerpt, content, slug, cover } = body as {
      title?: string;
      date?: string;
      tags?: string[];
      color?: string;
      excerpt?: string;
      content?: string;
      slug?: string;
      cover?: string | null;
    };

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const finalTags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
    const finalSlug = slug || `${date || new Date().toISOString().split("T")[0]}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
    const finalExcerpt = excerpt || content.slice(0, 160).replace(/[#*]/g, "").trim();
    const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    await upsertPost({
      slug: finalSlug,
      title: title.trim(),
      date: date || new Date().toISOString().split("T")[0],
      tags: finalTags,
      color: color || "#4af0ff",
      excerpt: finalExcerpt,
      content,
      readingTime,
      cover: cover || null,
    });

    return NextResponse.json({ ok: true, slug: finalSlug });
  } catch (err) {
    console.error("POST /api/posts failed:", err);
    return NextResponse.json({ error: "Failed to publish post" }, { status: 500 });
  }
}
