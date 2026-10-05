import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProgress, saveProgress } from "@/lib/progress";

export const runtime = "nodejs";

const COOKIE = "bp07_visitor";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

const MAX_ITEMS = 64;
const ID_RE = /^[a-z0-9-]{1,64}$/;

function visitorId(req: NextRequest): { id: string; fresh: boolean } {
  const existing = req.cookies.get(COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return { id: existing, fresh: false };
  return { id: randomUUID(), fresh: true };
}

function cleanList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;
  if (!value.every((item) => typeof item === "string" && ID_RE.test(item))) return null;
  return [...new Set(value)] as string[];
}

export async function GET(req: NextRequest) {
  const { id, fresh } = visitorId(req);
  try {
    const progress = await getProgress(id);
    const res = NextResponse.json(progress);
    if (fresh) res.cookies.set(COOKIE, id, COOKIE_OPTS);
    return res;
  } catch (error) {
    console.error("GET /api/progress failed:", error);
    const res = NextResponse.json({ visited: [], achievements: [] });
    if (fresh) res.cookies.set(COOKIE, id, COOKIE_OPTS);
    return res;
  }
}

export async function POST(req: NextRequest) {
  const { id, fresh } = visitorId(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { visited, achievements } = (body ?? {}) as { visited?: unknown; achievements?: unknown };
  const cleanVisited = cleanList(visited);
  const cleanAchievements = cleanList(achievements);
  if (!cleanVisited || !cleanAchievements) {
    return NextResponse.json({ error: "Invalid progress payload" }, { status: 400 });
  }
  try {
    await saveProgress(id, { visited: cleanVisited, achievements: cleanAchievements });
    const res = NextResponse.json({ ok: true });
    if (fresh) res.cookies.set(COOKIE, id, COOKIE_OPTS);
    return res;
  } catch (error) {
    console.error("POST /api/progress failed:", error);
    return NextResponse.json({ error: "Progress could not be saved." }, { status: 500 });
  }
}
