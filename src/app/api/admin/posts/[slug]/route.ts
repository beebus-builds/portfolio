import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deletePost, getPostRow, upsertPost } from "@/lib/postsStore";
import { validatePostInput } from "@/lib/postValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${token}`;
}

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  try {
    const post = await getPostRow(slug);
    if (!post) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ post });
  } catch (error) {
    console.error(`GET /api/admin/posts/${slug} failed:`, error);
    return NextResponse.json({ error: "Could not load the post." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  // The path slug is authoritative: a post cannot be renamed by accident, and
  // renaming would break every link to it.
  const result = validatePostInput(raw, slug.toLowerCase());
  if (!result.ok) {
    return NextResponse.json({ error: "Validation failed.", details: result.errors }, { status: 400 });
  }

  try {
    const post = await upsertPost(result.input);
    return NextResponse.json({ post });
  } catch (error) {
    console.error(`PUT /api/admin/posts/${slug} failed:`, error);
    return NextResponse.json({ error: "Could not save the post." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  try {
    const removed = await deletePost(slug);
    if (!removed) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`DELETE /api/admin/posts/${slug} failed:`, error);
    return NextResponse.json({ error: "Could not delete the post." }, { status: 500 });
  }
}