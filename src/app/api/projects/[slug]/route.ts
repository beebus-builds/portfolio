import { NextResponse } from "next/server";
import { getProjectBySlug, deleteProject } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const project = await getProjectBySlug(slug);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (err) {
    console.error(`GET /api/projects/${slug} failed:`, err);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { slug } = await params;
  try {
    const deleted = await deleteProject(slug);
    if (!deleted) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`DELETE /api/projects/${slug} failed:`, err);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
