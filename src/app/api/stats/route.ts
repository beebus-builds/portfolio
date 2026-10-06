import { NextResponse } from "next/server";
import { getProgressStats } from "@/lib/progress";
import { countMessages } from "@/lib/contact";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const [progress, messages] = await Promise.all([getProgressStats(), countMessages()]);
    return NextResponse.json({ ...progress, messages });
  } catch (error) {
    console.error("GET /api/stats failed:", error);
    return NextResponse.json(
      { visitors: 0, planetsVisited: 0, achievementsUnlocked: 0, topAchievements: [], messages: 0 },
      { status: 200 }
    );
  }
}
