import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/contact", () => ({
  saveMessage: vi.fn().mockResolvedValue(undefined),
}));

import { saveMessage } from "@/lib/contact";

const saveMessageMock = vi.mocked(saveMessage);

function post(body: unknown, ip = `10.0.0.${Math.floor(Math.random() * 250) + 1}`): NextRequest {
  return new NextRequest("http://localhost:3000/api/contact", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  saveMessageMock.mockClear();
  saveMessageMock.mockResolvedValue(undefined);
});

describe("POST /api/contact", () => {
  it("saves a valid signal", async () => {
    const res = await POST(post({ name: "Ada", email: "Ada@Example.COM", message: "Hello from the outer rim!" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(saveMessageMock).toHaveBeenCalledWith("Ada", "ada@example.com", "Hello from the outer rim!");
  });

  it("rejects a non-JSON body", async () => {
    const res = await POST(post("not json at all {{{"));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("Invalid request body");
  });

  it("rejects missing fields with the contract error string", async () => {
    const res = await POST(post({ name: "Ada", email: "" }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("Name, email and message are required");
  });

  it("rejects a malformed address with the contract error string", async () => {
    const res = await POST(post({ name: "Ada", email: "not-an-email", message: "A long enough message." }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("Invalid email address");
  });

  it("returns 500 without throwing when the write fails", async () => {
    saveMessageMock.mockRejectedValue(new Error("pool exhausted"));
    const res = await POST(post({ name: "Ada", email: "ada@example.com", message: "Hello from the outer rim!" }));
    expect(res.status).toBe(500);
    expect(((await res.json()) as { error: string }).error).toBe("The channel could not receive that message.");
  });

  it("rate limits repeated posts from one address", async () => {
    const ip = `192.168.77.${Math.floor(Math.random() * 250) + 1}`;
    const statuses: number[] = [];
    for (let i = 0; i < 8; i += 1) {
      const res = await POST(post({ name: "Ada", email: "ada@example.com", message: "Hello from the outer rim!" }, ip));
      statuses.push(res.status);
    }
    expect(statuses.filter((s) => s === 200).length).toBe(5);
    expect(statuses.filter((s) => s === 429).length).toBe(3);
  });
});
