import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { clientIp, isRateLimited } from "./rateLimit";

function req(headers: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost:3000/api/contact", { headers });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("isRateLimited", () => {
  it("admits up to the limit within the window, then blocks", () => {
    const start = Date.now();
    const statuses = Array.from({ length: 6 }, (_, i) => {
      vi.setSystemTime(start + i);
      return isRateLimited("test:admit", "10.9.9.9", 5, 60_000);
    });
    expect(statuses).toEqual([false, false, false, false, false, true]);
  });

  it("frees the budget once the window slides past", () => {
    const start = Date.now();
    for (let i = 0; i < 5; i += 1) {
      vi.setSystemTime(start + i);
      isRateLimited("test:slide", "10.9.9.8", 5, 60_000);
    }
    // Still blocked one ms inside the window...
    vi.setSystemTime(start + 59_999);
    expect(isRateLimited("test:slide", "10.9.9.8", 5, 60_000)).toBe(true);
    // ...and clear again after it passes.
    vi.setSystemTime(start + 60_001);
    expect(isRateLimited("test:slide", "10.9.9.8", 5, 60_000)).toBe(false);
  });

  it("keeps separate budgets per feature", () => {
    isRateLimited("feature-a", "10.9.9.7", 1, 60_000);
    expect(isRateLimited("feature-a", "10.9.9.7", 1, 60_000)).toBe(true);
    expect(isRateLimited("feature-b", "10.9.9.7", 1, 60_000)).toBe(false);
  });
});

describe("clientIp", () => {
  it("prefers the first forwarded hop", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to unknown", () => {
    expect(clientIp(req({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    expect(clientIp(req({}))).toBe("unknown");
  });
});
