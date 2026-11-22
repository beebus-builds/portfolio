import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function ask(body: unknown, ip = "10.0.0.1"): NextRequest {
  return new NextRequest("http://localhost:3002/api/ask", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/ask", () => {
  it("rejects malformed messages", async () => {
    const response = await POST(ask({ messages: "hi" }, "10.0.0.2"));
    expect(response.status).toBe(400);
  });

  it("answers from OpenRouter and parses the page hint", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "test/model");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "Mostly Next.js!\nPAGE: skills" } }] }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(ask({ messages: [{ role: "user", content: "what do you use?" }] }, "10.0.0.3"));
    expect(await response.json()).toEqual({ reply: "Mostly Next.js!", slug: "skills", source: "ai" });
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body).model).toBe("test/model");
    expect(init.headers.Authorization).toBe("Bearer test-key");
  });

  it("falls back locally when every model fails", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("down", { status: 503 })));
    const response = await POST(ask({ messages: [{ role: "user", content: "can I hire you?" }] }, "10.0.0.4"));
    const data = await response.json();
    expect(data.source).toBe("fallback");
    expect(data.slug).toBe("contact");
  });
});
