import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { saveMessage } from "@/lib/contact";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;
const MIN_MESSAGE = 10;

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
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64);
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);
  return "unknown";
}

function prune(ip: string, now: number): number[] {
  const recent = (hitsByIp.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  // Bound memory: drop empty buckets and cap stored entries per IP.
  if (recent.length === 0) hitsByIp.delete(ip);
  else hitsByIp.set(ip, recent.slice(-RATE_LIMIT));
  // Opportunistic global sweep so the map cannot grow without bound.
  if (hitsByIp.size > 1000) {
    for (const [key, times] of hitsByIp) {
      const kept = times.filter((at) => now - at < RATE_WINDOW_MS);
      if (kept.length === 0) hitsByIp.delete(key);
      else hitsByIp.set(key, kept);
      if (hitsByIp.size <= 800) break;
    }
  }
  return recent;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = prune(ip, now);
  recent.push(now);
  hitsByIp.set(ip, recent.slice(-RATE_LIMIT));
  return recent.length > RATE_LIMIT;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json(
      { error: "Too many signals — try again in a few minutes." },
      { status: 429, headers: { "Retry-After": "120" } }
    );
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
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanMessage = message.trim();
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > MAX_EMAIL) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }
  if (cleanName.length > MAX_NAME || cleanMessage.length > MAX_MESSAGE) {
    return NextResponse.json({ error: "Name or message is too long" }, { status: 400 });
  }
  if (cleanMessage.length < MIN_MESSAGE) {
    return NextResponse.json({ error: `Message should be at least ${MIN_MESSAGE} characters` }, { status: 400 });
  }

  try {
    await saveMessage(cleanName, cleanEmail, cleanMessage);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/contact failed:", error);
    return NextResponse.json({ error: "The channel could not receive that message." }, { status: 500 });
  }
}
