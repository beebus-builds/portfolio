import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { saveMessage } from "@/lib/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;

/**
 * Best-effort per-IP rate limit so the endpoint cannot be used as an
 * unattended DB writer. In-memory only: each server instance tracks its own
 * callers, which is enough to blunt casual spam on a portfolio form.
 */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hitsByIp = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  recent.push(now);
  hitsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ error: "Too many signals — try again in a few minutes." }, { status: 429 });
  }

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
  if (!EMAIL_RE.test(email.trim()) || email.trim().length > MAX_EMAIL) {
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
