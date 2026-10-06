import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { listAllPosts, upsertPost } from "@/lib/postsStore";
import { validatePostInput } from "@/lib/postValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${token}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const posts = await listAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/admin/posts failed:", error);
    return NextResponse.json({ error: "Could not load posts." }, { status: 500 });
  }
}

/** Create or replace a post. Slug is the key, so POST doubles as upsert. */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const result = validatePostInput(raw);
  if (!result.ok) {
    return NextResponse.json({ error: "Validation failed.", details: result.errors }, { status: 400 });
  }

  try {
    const post = await upsertPost(result.input);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/posts failed:", error);
    return NextResponse.json({ error: "Could not save the post." }, { status: 500 });
  }
}