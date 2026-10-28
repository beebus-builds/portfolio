import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authorized } from "@/lib/adminAuth";
import { listRecentMessages } from "@/lib/contact";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitParam) ? limitParam : 50;
  try {
    const messages = await listRecentMessages(limit);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/admin/messages failed:", error);
    return NextResponse.json({ error: "Could not load messages." }, { status: 500 });
  }
}
