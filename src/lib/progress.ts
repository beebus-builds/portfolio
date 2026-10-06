import { ensureSchema, query } from "@/lib/db";

const SCHEMA = `CREATE TABLE IF NOT EXISTS visitor_progress (
  visitor_id TEXT PRIMARY KEY,
  visited JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

export type Progress = { visited: string[]; achievements: string[] };

export async function getProgress(visitorId: string): Promise<Progress> {
  await ensureSchema("visitor_progress", SCHEMA);
  const rows = await query<{ visited: unknown; achievements: unknown }>(
    `SELECT visited, achievements FROM visitor_progress WHERE visitor_id = $1`,
    [visitorId]
  );
  const row = rows[0];
  return {
    visited: Array.isArray(row?.visited) ? (row.visited as string[]) : [],
    achievements: Array.isArray(row?.achievements) ? (row.achievements as string[]) : [],
  };
}

export async function saveProgress(visitorId: string, progress: Progress): Promise<void> {
  await ensureSchema("visitor_progress", SCHEMA);
  await query(
    `INSERT INTO visitor_progress (visitor_id, visited, achievements, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, now())
     ON CONFLICT (visitor_id)
     DO UPDATE SET visited = $2::jsonb, achievements = $3::jsonb, updated_at = now()`,
    [visitorId, JSON.stringify(progress.visited), JSON.stringify(progress.achievements)]
  );
}

export type ProgressStats = {
  visitors: number;
  planetsVisited: number;
  achievementsUnlocked: number;
  topAchievements: { id: string; unlocks: number }[];
};

export async function getProgressStats(): Promise<ProgressStats> {
  await ensureSchema("visitor_progress", SCHEMA);
  const [totals] = await query<{ visitors: string; planets: string; unlocks: string }>(
    `SELECT
       COUNT(*)::text AS visitors,
       COALESCE(SUM(jsonb_array_length(visited)), 0)::text AS planets,
       COALESCE(SUM(jsonb_array_length(achievements)), 0)::text AS unlocks
     FROM visitor_progress`
  );
  const top = await query<{ id: string; unlocks: string }>(
    `SELECT achievement AS id, COUNT(*)::text AS unlocks
     FROM visitor_progress, jsonb_array_elements_text(achievements) AS achievement
     GROUP BY achievement
     ORDER BY COUNT(*) DESC, achievement ASC
     LIMIT 6`
  );
  return {
    visitors: Number(totals?.visitors ?? 0),
    planetsVisited: Number(totals?.planets ?? 0),
    achievementsUnlocked: Number(totals?.unlocks ?? 0),
    topAchievements: top.map((row) => ({ id: row.id, unlocks: Number(row.unlocks) })),
  };
}
