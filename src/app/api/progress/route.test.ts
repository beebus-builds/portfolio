import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/progress", () => ({
  getProgress: vi.fn().mockResolvedValue({ visited: ["about"], achievements: [] }),
  saveProgress: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/progress/route";
import { getProgress, saveProgress } from "@/lib/progress";

const URL = "http://localhost/api/progress";

describe("GET /api/progress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns stored progress and sets a visitor cookie", async () => {
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ visited: ["about"], achievements: [] });
    expect(res.cookies.get("bp07_visitor")).toBeTruthy();
  });

  it("falls back to empty progress when the DB is down", async () => {
    vi.mocked(getProgress).mockRejectedValueOnce(new Error("db down"));
    const res = await GET(new NextRequest(URL));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ visited: [], achievements: [] });
  });
});

describe("POST /api/progress", () => {
  it("persists a valid payload", async () => {
    const req = new NextRequest(URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visited: ["about", "about"], achievements: ["ignition"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(saveProgress).toHaveBeenCalledWith(expect.any(String), {
      visited: ["about"],
      achievements: ["ignition"],
    });
  });

  it("rejects an invalid payload", async () => {
    const req = new NextRequest(URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visited: "not-an-array", achievements: [] }),
    });
    expect((await POST(req)).status).toBe(400);
  });
});
