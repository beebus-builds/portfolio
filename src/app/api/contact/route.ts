import { NextRequest, NextResponse } from "next/server";
import { saveMessage, listMessages } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

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
    const { name, email, message, subject } = await req.json();
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email.trim()) || email.length > MAX_EMAIL) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
      return NextResponse.json({ error: "Name or message is too long" }, { status: 400 });
    }
    if (subject !== undefined && (typeof subject !== "string" || subject.length > MAX_SUBJECT)) {
      return NextResponse.json({ error: "Subject is too long" }, { status: 400 });
    }
    await saveMessage(name.trim(), email.trim(), message.trim(), (subject ?? "").trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/contact failed:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
