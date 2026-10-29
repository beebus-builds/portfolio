import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { profile } from "@/lib/profile";

function post(body: unknown, ip = `10.1.0.${Math.floor(Math.random() * 250) + 1}`): NextRequest {
  return new NextRequest("http://localhost:3000/api/copilot", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

const upstream = vi.fn();

beforeEach(() => {
  upstream.mockReset();
  vi.stubGlobal("fetch", upstream);
  vi.stubEnv("OPENROUTER_API_KEY", "test-key");
  vi.stubEnv("OPENROUTER_MODEL", "test/model-a:free, test/model-b:free");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function upstreamReply(text: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content: text } }] }),
  };
}

describe("POST /api/copilot", () => {
  it("returns 503 when no API key is configured", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const res = await POST(post({ messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(503);
  });

  it("rejects an empty or malformed message list", async () => {
    const empty = await POST(post({ messages: [] }));
    expect(empty.status).toBe(400);
    const junk = await POST(post("{{{"));
    expect(junk.status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("walks the model list until one answers", async () => {
    upstream.mockResolvedValueOnce({ ok: false, status: 502 }).mockResolvedValueOnce(upstreamReply("Copilot reply"));

    const res = await POST(post({ messages: [{ role: "user", content: "Who are you?" }] }));
    const json = (await res.json()) as { reply: string };

    expect(res.status).toBe(200);
    expect(json.reply).toBe("Copilot reply");
    expect(upstream).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(String(upstream.mock.calls[0]?.[1]?.body)) as { model: string };
    expect(firstBody.model).toBe("test/model-a:free");
  });

  it("answers from the local fallback when every model is down", async () => {
    upstream.mockResolvedValue({ ok: false, status: 500 });

    const res = await POST(post({ messages: [{ role: "user", content: "Where are you based?" }] }));
    const json = (await res.json()) as { reply: string };

    expect(res.status).toBe(200);
    expect(json.reply).toContain(profile.location);
    // Two configured models, then the three hardwired fallbacks were tried.
    expect(upstream).toHaveBeenCalledTimes(5);
  });

  it("rate limits a chatty visitor", async () => {
    upstream.mockResolvedValue(upstreamReply("ok"));
    const ip = `172.16.5.${Math.floor(Math.random() * 250) + 1}`;
    const statuses: number[] = [];
    for (let i = 0; i < 17; i += 1) {
      statuses.push((await POST(post({ messages: [{ role: "user", content: "hi" }] }, ip))).status);
    }
    expect(statuses.filter((s) => s === 200).length).toBe(15);
    expect(statuses.filter((s) => s === 429).length).toBe(2);
  });
});
