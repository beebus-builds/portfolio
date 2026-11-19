import { describe, expect, it } from "vitest";
import { DISTRICTS, markVisited, placeBuilding, tileIndex, createInitialState, type BuildingKey, type CityState } from "@/lib/citySim";
import { STORY, currentChapter, storyProgress } from "@/lib/cityStory";

function richCity(): CityState {
  return { ...createInitialState(), credits: 100000, xp: 300 };
}

function plot(state: CityState, key: BuildingKey, count = 1): CityState {
  let next = state;
  for (let i = 0; i < count; i += 1) {
    const index = next.tiles.findIndex((tile) => tile === null);
    if (index < 0) break;
    next = placeBuilding(next, key, index % 12, Math.floor(index / 12));
  }
  return next;
}

describe("city story", () => {
  it("starts with the origin chapter", () => {
    const city = createInitialState();
    expect(currentChapter(city).id).toBe("origin");
    expect(storyProgress(city).unlocked).toEqual([0]);
  });

  it("unlocks later chapters as city goals are met", () => {
    let city = richCity();
    city = plot(city, "workshop");
    city = plot(city, "park", 2);
    const progress = storyProgress(city);
    expect(progress.unlocked).toContain(1);
    expect(progress.unlocked).toContain(2);
  });

  it("keeps chapters in a fixed narrative order", () => {
    expect(STORY.map((chapter) => chapter.id)).toEqual([
      "origin",
      "workshop",
      "green",
      "shipping",
      "practice",
      "open",
    ]);
    expect(new Set(STORY.map((chapter) => chapter.id)).size).toBe(STORY.length);
  });

  it("allows the final chapter after deep exploration", () => {
    let city = richCity();
    for (const district of DISTRICTS.slice(0, 4)) city = markVisited(city, district.id);
    expect(storyProgress(city).unlocked).toContain(STORY.length - 1);
    expect(city.tiles[tileIndex(0, 0)]).not.toBeNull();
  });
});
