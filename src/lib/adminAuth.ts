import type { NextRequest } from "next/server";

/**
 * Bearer-token gate for every /api/admin route. Set ADMIN_TOKEN in .env;
 * with no token configured the admin surface stays locked.
 */
export function authorized(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return (req.headers.get("authorization") ?? "") === `Bearer ${token}`;
}
