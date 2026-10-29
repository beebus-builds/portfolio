import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/contact", () => ({
  listRecentMessages: vi.fn().mockResolvedValue([{ id: 1, name: "Ada", email: "ada@example.com", message: "hi" }]),
}));

import { listRecentMessages } from "@/lib/contact";

const listMock = vi.mocked(listRecentMessages);

function get(authorization?: string, search = ""): NextRequest {
  const headers = new Headers();
  if (authorization) headers.set("authorization", authorization);
  return new NextRequest(`http://localhost:3000/api/admin/messages${search}`, { headers });
}

beforeEach(() => {
  listMock.mockClear();
  listMock.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/admin/messages", () => {
  it("answers 401 without and with a wrong token", async () => {
    vi.stubEnv("ADMIN_TOKEN", "secret-token");
    expect((await GET(get())).status).toBe(401);
    expect((await GET(get("Bearer nope"))).status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
  });

  it("serves the inbox for a valid token and honors the limit", async () => {
    vi.stubEnv("ADMIN_TOKEN", "secret-token");
    listMock.mockResolvedValue([
      { id: 1, name: "Ada", email: "ada@example.com", message: "hi", created_at: new Date() } as never,
    ]);
    const res = await GET(get("Bearer secret-token", "?limit=10"));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { messages: unknown[] }).messages).toHaveLength(1);
    expect(listMock).toHaveBeenCalledWith(10);
  });
});
