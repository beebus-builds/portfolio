import { NextResponse } from "next/server";
import { getPostBySlug, deletePost } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (err) {
    console.error(`GET /api/posts/${slug} failed:`, err);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const deleted = await deletePost(slug);
    if (!deleted) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/posts/${slug} failed:`, err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
