import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { saveMessage } from "@/lib/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, message } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    message?: unknown;
  };

  if (typeof name !== "string" || !name.trim() || typeof email !== "string" || !email.trim() || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email.trim()) || email.length > MAX_EMAIL) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Name or message is too long" }, { status: 400 });
  }

  try {
    await saveMessage(name.trim(), email.trim(), message.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/contact failed:", error);
    return NextResponse.json({ error: "The channel could not receive that message." }, { status: 500 });
  }
}
