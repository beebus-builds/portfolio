import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { VISITOR_COOKIE } from "@/lib/visitor";

vi.mock("@/lib/db", () => ({
  ensureSchema: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
}));

import { query } from "@/lib/db";

const queryMock = vi.mocked(query);

function get(cookie?: string): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set("cookie", `${VISITOR_COOKIE}=${cookie}`);
  return new NextRequest("http://localhost:3000/api/highscore", { headers });
}

function post(body: unknown, cookie?: string): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (cookie) headers.set("cookie", `${VISITOR_COOKIE}=${cookie}`);
  return new NextRequest("http://localhost:3000/api/highscore", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers,
  });
}

beforeEach(() => {
  queryMock.mockClear();
  queryMock.mockResolvedValue([]);
});

describe("GET /api/highscore", () => {
  it("returns zeros and hands a fresh visitor their identity", async () => {
    const res = await GET(get());
    const json = (await res.json()) as { best: number; top: unknown[] };
    expect(json).toEqual({ best: 0, top: [] });
    const cookie = res.cookies.get(VISITOR_COOKIE);
    expect(cookie?.value).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reads the stored best score for a known visitor", async () => {
    queryMock.mockImplementation(async (text) => {
      if (text.includes("WHERE visitor_id")) return [{ score: 4200 }];
      return [{ score: 9000 }, { score: 4200 }];
    });

    const id = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const res = await GET(get(id));
    const json = (await res.json()) as { best: number; top: Array<{ score: number }> };

    expect(json.best).toBe(4200);
    expect(json.top).toEqual([{ score: 9000 }, { score: 4200 }]);
    // A returning visitor keeps the identity they came with.
    expect(res.cookies.get(VISITOR_COOKIE)).toBeUndefined();
  });
});

describe("POST /api/highscore", () => {
  it("rejects invalid scores", async () => {
    for (const score of [-1, 2_000_000, "9000", Number.NaN]) {
      const res = await POST(post({ score }));
      expect(res.status).toBe(400);
    }
    expect(queryMock).not.toHaveBeenCalled();
  });

  it("persists a valid score and mints the identity cookie on first contact", async () => {
    const res = await POST(post({ score: 1234.9 }));
    const json = (await res.json()) as { ok: boolean; score: number };
    expect(json).toEqual({ ok: true, score: 1234 });
    expect(res.cookies.get(VISITOR_COOKIE)?.value).toMatch(/^[0-9a-f-]{36}$/);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining("GREATEST"), [expect.any(String), 1234]);
  });

  it("returns 500 when the write fails", async () => {
    queryMock.mockRejectedValue(new Error("pool gone"));
    const res = await POST(post({ score: 100 }));
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toBe("Score could not be saved.");
  });
});
