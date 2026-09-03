import { NextRequest, NextResponse } from "next/server";
import { listProjects, upsertProject } from "@/lib/db";

export const dynamic = "force-dynamic";

const toStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((t) => String(t)).filter((t) => t.trim().length > 0) : [];

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("GET /api/projects failed:", err);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const { slug, title, tag, repo, description, role, year, outcome } = body;

    if (
      typeof slug !== "string" || !slug.trim() ||
      typeof title !== "string" || !title.trim() ||
      typeof tag !== "string" || !tag.trim() ||
      typeof repo !== "string" || !repo.trim() ||
      typeof description !== "string" || !description.trim() ||
      typeof role !== "string" || !role.trim() ||
      typeof year !== "string" || !year.trim() ||
      typeof outcome !== "string" || !outcome.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, tag, repo, description, role, year, outcome" },
        { status: 400 }
      );
    }

    await upsertProject({
      slug: slug.trim(),
      title: title.trim(),
      tag: tag.trim(),
      repo: repo.trim(),
      description: description.trim(),
      tech: toStringArray(body.tech),
      color: typeof body.color === "string" && body.color ? body.color : "#4af0ff",
      url: typeof body.url === "string" && body.url.trim() ? body.url.trim() : null,
      role: role.trim(),
      year: year.trim(),
      highlights: toStringArray(body.highlights),
      process: toStringArray(body.process),
      outcome: outcome.trim(),
      metrics: toStringArray(body.metrics),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/projects failed:", err);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}
