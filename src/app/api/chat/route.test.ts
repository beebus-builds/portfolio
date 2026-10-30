import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/fleet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/fleet")>();
  return {
    ...actual,
    insertChatMessage: vi.fn().mockResolvedValue({
      id: 9,
      from: "visitor-1",
      callsign: "Pilot-ABCD",
      body: "hello fleet",
      at: "2026-01-01T00:00:00.000Z",
    }),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  clientIp: vi.fn(() => "203.0.113.9"),
  isRateLimited: vi.fn(() => false),
}));

import { POST } from "@/app/api/chat/route";
import { insertChatMessage } from "@/lib/fleet";
import { isRateLimited } from "@/lib/rateLimit";

const URL = "http://localhost/api/chat";

function post(body: unknown): ReturnType<typeof POST> {
  return POST(
    new NextRequest(URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/chat", () => {
  beforeEach(() => vi.clearAllMocks());

  it("delivers a valid message", async () => {
    const res = await post({ body: "hello fleet", callsign: "Bibash" });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { message: { body: string; callsign: string } };
    expect(data.message.body).toBe("hello fleet");
    expect(data.message.callsign).toBe("Pilot-ABCD");
    expect(insertChatMessage).toHaveBeenCalledWith(expect.any(String), expect.any(String), "hello fleet");
    expect(res.cookies.get("bp07_visitor")).toBeTruthy();
  });

  it("collapses newlines and space runs into one line", async () => {
    const res = await post({ body: "hello\n\n  fleet" });
    expect(res.status).toBe(200);
    expect(insertChatMessage).toHaveBeenCalledWith(expect.any(String), expect.any(String), "hello fleet");
  });

  it("rejects empty and oversize messages", async () => {
    expect((await post({ body: "   " })).status).toBe(400);
    expect((await post({ body: "x".repeat(281) })).status).toBe(400);
    expect((await post({ body: 42 })).status).toBe(400);
    expect(insertChatMessage).not.toHaveBeenCalled();
  });

  it("limits spam to a few transmissions per minute", async () => {
    vi.mocked(isRateLimited).mockReturnValueOnce(true);
    const res = await post({ body: "hello" });
    expect(res.status).toBe(429);
    expect(insertChatMessage).not.toHaveBeenCalled();
  });
});
