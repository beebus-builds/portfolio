import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/progress", () => ({
  getProgressStats: vi.fn(),
}));

vi.mock("@/lib/contact", () => ({
  countMessages: vi.fn(),
}));

import { getProgressStats } from "@/lib/progress";
import { countMessages } from "@/lib/contact";

const progressMock = vi.mocked(getProgressStats);
const messagesMock = vi.mocked(countMessages);

beforeEach(() => {
  progressMock.mockReset();
  messagesMock.mockReset();
});

describe("GET /api/stats", () => {
  it("joins progress and message counts", async () => {
    progressMock.mockResolvedValue({
      visitors: 12,
      planetsVisited: 40,
      achievementsUnlocked: 7,
      topAchievements: [{ id: "visit-all", unlocks: 3 }],
    });
    messagesMock.mockResolvedValue(4);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      visitors: 12,
      planetsVisited: 40,
      achievementsUnlocked: 7,
      topAchievements: [{ id: "visit-all", unlocks: 3 }],
      messages: 4,
    });
  });

  it("degrades to a zeroed payload instead of erroring", async () => {
    progressMock.mockRejectedValue(new Error("pool gone"));
    messagesMock.mockRejectedValue(new Error("pool gone"));

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      visitors: 0,
      planetsVisited: 0,
      achievementsUnlocked: 0,
      topAchievements: [],
      messages: 0,
    });
  });
});
