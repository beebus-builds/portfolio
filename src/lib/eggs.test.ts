import { describe, expect, it } from "vitest";
import { createEggMatcher, EGGS } from "./eggs";

function type(keys: string[]) {
  const match = createEggMatcher();
  return keys.map(match).filter(Boolean);
}

describe("easter eggs", () => {
  it("hatches each egg from its sequence", () => {
    for (const [egg, keys] of Object.entries(EGGS)) expect(type(keys)).toEqual([egg]);
  });

  it("finds a sequence after unrelated typing and ignores case", () => {
    expect(type([..."xxSUDO HIRE BIBASH"])).toEqual(["hire"]);
    expect(type(["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "B", "A"])).toEqual(["party"]);
  });

  it("does not hatch from near misses and resets after a hatch", () => {
    expect(type([..."cofee"])).toEqual([]);
    expect(type([..."coffeecoffee"])).toEqual(["coffee", "coffee"]);
  });
});
