import { describe, expect, it } from "vitest";
import {
  BUILDINGS,
  DISTRICTS,
  GRID_SIZE,
  START_CREDITS,
  advanceCycle,
  checkPlacement,
  countBuildings,
  createInitialState,
  deserialize,
  isUnlocked,
  levelFor,
  markVisited,
  placeBuilding,
  serialize,
  tileIndex,
} from "@/lib/citySim";

describe("city simulator", () => {
  it("starts with a hall, roads and district markers", () => {
    const state = createInitialState();
    expect(state.tiles).toHaveLength(GRID_SIZE);
    expect(state.credits).toBe(START_CREDITS);
    expect(state.tiles.filter((tile) => tile?.kind === "hall")).toHaveLength(1);
    expect(state.tiles.filter((tile) => tile?.kind === "road").length).toBeGreaterThan(10);
    expect(state.tiles.filter((tile) => tile?.kind === "district")).toHaveLength(DISTRICTS.length);
  });

  it("places a building, charging credits and awarding experience", () => {
    const state = createInitialState();
    const next = placeBuilding(state, "home", 0, 1);
    expect(next).not.toBe(state);
    expect(next.credits).toBe(START_CREDITS - BUILDINGS.home.cost);
    expect(next.xp).toBe(BUILDINGS.home.xp);
    expect(next.tiles[tileIndex(0, 1)]).toEqual({ kind: "building", key: "home" });
    expect(state.tiles[tileIndex(0, 1)]).toBeNull();
  });

  it("refuses occupied plots, locked buildings and unaffordable ones", () => {
    let state = createInitialState();
    expect(checkPlacement(state, "home", 0, 0)).toBe("occupied");
    expect(checkPlacement(state, "home", -1, 0)).toBe("invalid");
    expect(checkPlacement(state, "landmark", 0, 1)).toBe("locked");
    expect(checkPlacement(state, "home", 0, 1)).toBe("ok");
    state = { ...state, credits: 10 };
    expect(checkPlacement(state, "home", 0, 1)).toBe("poor");
    expect(placeBuilding(state, "home", 0, 1)).toBe(state);
  });

  it("collects income and moves happiness and population toward their targets", () => {
    let state = createInitialState();
    state = placeBuilding(state, "home", 0, 1);
    const next = advanceCycle(state);
    expect(next.cycle).toBe(state.cycle + 1);
    expect(next.credits).toBeGreaterThan(state.credits);
    expect(next.population).toBeGreaterThan(0);
    expect(next.happiness).toBeGreaterThanOrEqual(0);
    expect(next.happiness).toBeLessThanOrEqual(100);
  });

  it("unlocks districts by experience and records visits once", () => {
    let state = createInitialState();
    expect(isUnlocked(state, "about")).toBe(true);
    expect(isUnlocked(state, "contact")).toBe(false);
    state = { ...state, xp: 300 };
    expect(levelFor(state.xp)).toBe(5);
    expect(isUnlocked(state, "contact")).toBe(true);
    const visited = markVisited(state, "contact");
    expect(markVisited(visited, "contact")).toBe(visited);
  });

  it("counts buildings and guards saved state", () => {
    const state = placeBuilding(createInitialState(), "farm", 1, 1);
    expect(countBuildings(state).farm).toBe(1);
    expect(deserialize(serialize(state))?.credits).toBe(state.credits);
    expect(deserialize("{\"version\":9}")).toBeNull();
    expect(deserialize("not-json")).toBeNull();
  });
});
