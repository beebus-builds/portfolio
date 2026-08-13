import { NextRequest, NextResponse } from "next/server";
import { saveMessage, listMessages } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const messages = await listMessages();
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("GET /api/contact failed:", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await saveMessage(name, email, message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/contact failed:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
