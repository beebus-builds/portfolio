import { NextRequest, NextResponse } from "next/server";
import { listProjects, upsertProject } from "@/lib/db";

export const dynamic = "force-dynamic";

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
    const body = await req.json();
    await upsertProject(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/projects failed:", err);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}
