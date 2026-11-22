import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Bearer-token gate for every /api/admin route. Set ADMIN_TOKEN in .env;
 * with no token configured the admin surface stays locked. Compared as
 * fixed-length digests so response timing reveals nothing about the token.
 */
export function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(req.headers.get("authorization") ?? ""), digest(`Bearer ${token}`));
}
