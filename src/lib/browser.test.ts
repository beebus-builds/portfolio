import { describe, expect, it } from "vitest";
import { HOME_KEY, TV_KEY, addressFor, resolveAddress } from "@/lib/browser";

describe("resolveAddress", () => {
  it("resolves portfolio pages and their aliases", () => {
    expect(resolveAddress("about")).toEqual({ kind: "site", key: "about" });
    expect(resolveAddress("/projects")).toEqual({ kind: "site", key: "projects" });
    expect(resolveAddress("studio://skills")).toEqual({ kind: "site", key: "skills" });
    expect(resolveAddress("me")).toEqual({ kind: "site", key: "about" });
  });

  it("keeps the start page and monitor channel available", () => {
    expect(resolveAddress("home")).toEqual({ kind: "site", key: HOME_KEY });
    expect(resolveAddress("studio.tv")).toEqual({ kind: "site", key: TV_KEY });
  });

  it("resolves profile links and ordinary web addresses", () => {
    expect(resolveAddress("github")).toEqual({
      kind: "external",
      url: "https://github.com/beebus-builds",
    });
    expect(resolveAddress("github.com/beebus-builds")).toEqual({
      kind: "external",
      url: "https://github.com/beebus-builds",
    });
    expect(resolveAddress("https://example.com/work")).toEqual({
      kind: "external",
      url: "https://example.com/work",
    });
  });

  it("rejects addresses that are not in the room", () => {
    expect(resolveAddress("not-a-place")).toBeNull();
    expect(resolveAddress("javascript:alert(1)")).toBeNull();
  });
});

describe("addressFor", () => {
  it("uses stable, readable addresses for known sites", () => {
    expect(addressFor(HOME_KEY)).toBe("home");
    expect(addressFor(TV_KEY)).toBe("studio.tv");
    expect(addressFor("about")).toBe("about");
  });
});
