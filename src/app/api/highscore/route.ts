import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureSchema, query } from "@/lib/db";
import { VISITOR_COOKIE, VISITOR_COOKIE_OPTS, visitorId } from "@/lib/visitor";

export const runtime = "nodejs";

const MAX_SCORE = 1000000;

const SCHEMA = `CREATE TABLE IF NOT EXISTS arcade_scores (
  visitor_id TEXT PRIMARY KEY,
  score INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

export async function GET(req: NextRequest) {
  const { id, fresh } = visitorId(req);
  const res = NextResponse.json({ best: 0, top: [] as Array<{ score: number }> });
  if (fresh) {
    res.cookies.set(VISITOR_COOKIE, id, VISITOR_COOKIE_OPTS);
  }
  try {
    await ensureSchema("arcade_scores", SCHEMA);
    const mine = await query<{ score: number }>(
      `SELECT score FROM arcade_scores WHERE visitor_id = $1`,
      [id]
    );
    const top = await query<{ score: number }>(
      `SELECT score FROM arcade_scores ORDER BY score DESC LIMIT 5`
    );
    return NextResponse.json({
      best: Number(mine[0]?.score ?? 0),
      top: top.map((row) => ({ score: Number(row.score) })),
    });
  } catch (error) {
    console.error("GET /api/highscore failed:", error);
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
  const { score } = (body ?? {}) as { score?: unknown };
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 });
  }
  const clean = Math.floor(score);
  try {
    await ensureSchema("arcade_scores", SCHEMA);
    await query(
      `INSERT INTO arcade_scores (visitor_id, score, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (visitor_id)
       DO UPDATE SET score = GREATEST(arcade_scores.score, $2), updated_at = now()`,
      [id, clean]
    );
    const res = NextResponse.json({ ok: true, score: clean });
    if (fresh) {
      // First contact: hand back the identity so later reads (GET best score,
      // future POSTs) land on the same row instead of a new anonymous one.
      res.cookies.set(VISITOR_COOKIE, id, VISITOR_COOKIE_OPTS);
    }
    return res;
  } catch (error) {
    console.error("POST /api/highscore failed:", error);
    return NextResponse.json({ error: "Score could not be saved." }, { status: 500 });
  }
}