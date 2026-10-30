import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/fleet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/fleet")>();
  return {
    ...actual,
    upsertPresence: vi.fn().mockResolvedValue(undefined),
    listLivePilots: vi.fn().mockResolvedValue([
      {
        id: "other-visitor",
        callsign: "Pilot-AAAA",
        accent: "#f472b6",
        p: [1, 2, 3],
        q: [0, 0, 0, 1],
        speed: 10,
        boosting: false,
        mode: "cruise",
        age: 1,
      },
    ]),
    listChatSince: vi.fn().mockResolvedValue([
      { id: 7, from: "someone-else", callsign: "Pilot-BBBB", body: "hello", at: "2026-01-01T00:00:00.000Z" },
    ]),
    removePresence: vi.fn().mockResolvedValue(undefined),
    pruneFleet: vi.fn().mockResolvedValue(undefined),
    insertChatMessage: vi.fn(),
  };
});

vi.mock("@/lib/rateLimit", () => ({
  clientIp: vi.fn(() => "203.0.113.9"),
  isRateLimited: vi.fn(() => false),
}));

import { POST } from "@/app/api/fleet/route";
import { listLivePilots, removePresence, upsertPresence } from "@/lib/fleet";
import { isRateLimited } from "@/lib/rateLimit";

const URL = "http://localhost/api/fleet";

const TELEMETRY = {
  p: [12, 0, -5],
  q: [0, 0, 0, 1],
  speed: 20,
  boosting: false,
  mode: "cruise",
  callsign: "Bibash",
  accent: "#f472b6",
  since: 0,
};

function post(body: unknown): ReturnType<typeof POST> {
  return POST(
    new NextRequest(URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

describe("POST /api/fleet", () => {
  beforeEach(() => vi.clearAllMocks());

  it("heartbeats telemetry and returns the live fleet plus chat", async () => {
    const res = await post(TELEMETRY);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { you: { callsign: string }; pilots: unknown[]; messages: unknown[] };
    expect(data.you.callsign).toBe("Bibash");
    expect(data.pilots).toHaveLength(1);
    expect(data.messages).toHaveLength(1);
    expect(res.cookies.get("bp07_visitor")).toBeTruthy();
    expect(upsertPresence).toHaveBeenCalledWith(
      expect.objectContaining({ callsign: "Bibash", accent: "#f472b6", mode: "cruise" })
    );
    expect(listLivePilots).toHaveBeenCalledWith(expect.any(String));
  });

  it("rejects invalid telemetry", async () => {
    const res = await post({ ...TELEMETRY, p: "not-a-vector" });
    expect(res.status).toBe(400);
    expect(upsertPresence).not.toHaveBeenCalled();
  });

  it("rejects a degenerate quaternion", async () => {
    const res = await post({ ...TELEMETRY, q: [0, 0, 0, 0] });
    expect(res.status).toBe(400);
  });

  it("clears presence for the offline beacon", async () => {
    const res = await post({ offline: true });
    expect(res.status).toBe(200);
    expect(removePresence).toHaveBeenCalledWith(expect.any(String));
    expect(upsertPresence).not.toHaveBeenCalled();
  });

  it("backs off when rate limited", async () => {
    vi.mocked(isRateLimited).mockReturnValueOnce(true);
    const res = await post(TELEMETRY);
    expect(res.status).toBe(429);
    expect(upsertPresence).not.toHaveBeenCalled();
  });

  it("falls back to a generated callsign and default accent", async () => {
    const res = await post({ ...TELEMETRY, callsign: "###", accent: "red" });
    expect(res.status).toBe(200);
    const data = (await res.json()) as { you: { callsign: string } };
    expect(data.you.callsign).toMatch(/^Pilot-[0-9A-F]{4}$/);
    expect(upsertPresence).toHaveBeenCalledWith(expect.objectContaining({ accent: "#38bdf8" }));
  });
});
