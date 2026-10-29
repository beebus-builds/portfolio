import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { authorized } from "./adminAuth";

function req(authorization?: string): NextRequest {
  const headers = new Headers();
  if (authorization) headers.set("authorization", authorization);
  return new NextRequest("http://localhost:3000/api/admin/messages", { headers });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authorized", () => {
  it("locks the surface when no token is configured", () => {
    vi.stubEnv("ADMIN_TOKEN", "");
    expect(authorized(req("Bearer anything"))).toBe(false);
    expect(authorized(req())).toBe(false);
  });

  it("only accepts an exact Bearer match", () => {
    vi.stubEnv("ADMIN_TOKEN", "hunt-red-october");
    expect(authorized(req("Bearer hunt-red-october"))).toBe(true);
    expect(authorized(req("bearer hunt-red-october"))).toBe(false);
    expect(authorized(req("Bearer wrong"))).toBe(false);
    expect(authorized(req())).toBe(false);
  });
});
