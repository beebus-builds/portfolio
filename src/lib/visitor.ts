import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";

/**
 * Visitor identity shared by the routes that persist per-visitor state
 * (progress, high scores). An httpOnly UUID cookie — no fingerprinting, no
 * third-party script. `fresh` tells the caller to hand the new identity back
 * so the very first request already lands on its own row.
 */
export const VISITOR_COOKIE = "bp07_visitor";

export const VISITOR_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

export function visitorId(req: NextRequest): { id: string; fresh: boolean } {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/.test(existing)) return { id: existing, fresh: false };
  return { id: randomUUID(), fresh: true };
}
