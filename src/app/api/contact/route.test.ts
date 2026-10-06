import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/contact", () => ({
  saveMessage: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/contact/route";
import { saveMessage } from "@/lib/contact";

function request(body: unknown, ip = "10.0.0.1"): NextRequest {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const valid = { name: "Ada", email: "ada@example.com", message: "Hello there, this is a test." };

describe("POST /api/contact", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts a valid message", async () => {
    const res = await POST(request(valid, "10.1.0.1"));
    expect(res.status).toBe(200);
    expect(saveMessage).toHaveBeenCalledWith("Ada", "ada@example.com", valid.message);
  });

  it("rejects malformed JSON", async () => {
    const res = await POST(request("{not json", "10.1.0.2"));
    expect(res.status).toBe(400);
  });

  it("rejects missing fields", async () => {
    const res = await POST(request({ name: "Ada" }, "10.1.0.3"));
    expect(res.status).toBe(400);
    expect(saveMessage).not.toHaveBeenCalled();
  });

  it("rejects a bad email", async () => {
    const res = await POST(request({ ...valid, email: "nope" }, "10.1.0.4"));
    expect(res.status).toBe(400);
  });

  it("rejects a too-short message", async () => {
    const res = await POST(request({ ...valid, message: "hi" }, "10.1.0.5"));
    expect(res.status).toBe(400);
  });

  it("rate limits repeated sends from one IP", async () => {
    const ip = "10.9.9.9";
    let last = 0;
    for (let i = 0; i < 6; i++) {
      last = (await POST(request(valid, ip))).status;
    }
    expect(last).toBe(429);
  });
});
