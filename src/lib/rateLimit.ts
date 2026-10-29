import type { NextRequest } from "next/server";

/**
 * Best-effort per-IP rate limiting for public endpoints, so they cannot be
 * used as unattended DB writers or upstream-API amplifiers.
 *
 * In-memory only: each server instance tracks its own callers, which is enough
 * to blunt casual spam on a portfolio site. Infrastructure-level limits
 * (WAF, Redis) would be needed for a guarantee. Buckets are keyed by feature
 * so endpoints do not share a budget, with a bounded map and an opportunistic
 * sweep so memory cannot grow without bound.
 */

const buckets = new Map<string, number[]>();
const MAX_BUCKETS = 1000;
const SWEEP_TARGET = 800;

/** First forwarded IP, falling back to the direct peer. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 64) ?? "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim().slice(0, 64);
  return "unknown";
}

/**
 * Records a hit for `feature:ip` and reports whether the caller is over the
 * limit for the sliding window.
 */
export function isRateLimited(feature: string, ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const key = `${feature}:${ip}`;
  const withinWindow = (at: number) => now - at < windowMs;

  const recent = (buckets.get(key) ?? []).filter(withinWindow);
  // Bound memory: drop empty buckets and cap stored entries per caller.
  if (recent.length === 0) buckets.delete(key);
  else buckets.set(key, recent.slice(-limit));

  // Opportunistic global sweep so the map cannot grow without bound.
  if (buckets.size > MAX_BUCKETS) {
    for (const [entryKey, times] of buckets) {
      const kept = times.filter(withinWindow);
      if (kept.length === 0) buckets.delete(entryKey);
      else buckets.set(entryKey, kept);
      if (buckets.size <= SWEEP_TARGET) break;
    }
  }

  recent.push(now);
  buckets.set(key, recent.slice(-limit));
  return recent.length > limit;
}
