import { describe, expect, it } from "vitest";
import { cleanMessage, gitLogSnippet, githubUser, nepalHour, parseCommits, parseRepoCommits, pushedRepos, weatherKind } from "./live";

describe("weatherKind", () => {
  it("maps WMO codes to what the window shows", () => {
    expect(weatherKind(0)).toBe("clear");
    expect(weatherKind(2)).toBe("cloudy");
    expect(weatherKind(45)).toBe("fog");
    expect(weatherKind(61)).toBe("rain");
    expect(weatherKind(81)).toBe("rain");
    expect(weatherKind(73)).toBe("snow");
    expect(weatherKind(95)).toBe("storm");
  });
});

describe("nepalHour", () => {
  it("is UTC+05:45 regardless of the visitor's timezone", () => {
    expect(nepalHour(new Date("2026-11-21T00:00:00Z"))).toBe(5);
    expect(nepalHour(new Date("2026-11-21T18:20:00Z"))).toBe(0);
    expect(nepalHour(new Date("2026-11-21T18:10:00Z"))).toBe(23);
  });
});

describe("commits", () => {
  const events = [
    { type: "WatchEvent" },
    {
      type: "PushEvent",
      repo: { name: "beebus-builds/portfolio" },
      payload: {
        commits: [
          { sha: "aaaaaaa1111", message: "Older commit" },
          { sha: "bbbbbbb2222", message: "Add the 3D studio\n\nLong body text" },
        ],
      },
    },
    { type: "PushEvent", repo: { name: "x/y" }, payload: { commits: [{ sha: "nothex!", message: "bad sha" }] } },
  ];

  it("takes push commits newest first with short shas and first lines", () => {
    expect(parseCommits(events)).toEqual([
      { sha: "bbbbbbb", message: "Add the 3D studio", repo: "portfolio" },
      { sha: "aaaaaaa", message: "Older commit", repo: "portfolio" },
    ]);
    expect(parseCommits("nope")).toEqual([]);
    expect(parseCommits(events, 1)).toHaveLength(1);
  });

  it("cleans and truncates messages for the monitor", () => {
    expect(cleanMessage("fix: \u0007bell")).toBe("fix: bell");
    expect(cleanMessage("x".repeat(80))).toHaveLength(52);
  });

  it("builds a git log snippet, or nothing when there are no commits", () => {
    const snippet = gitLogSnippet(parseCommits(events), "beebus-builds")!;
    expect(snippet[0]).toContain("github.com/beebus-builds");
    expect(snippet).toContain("bbbbbbb Add the 3D studio");
    expect(gitLogSnippet([], "u")).toBeNull();
  });

  it("finds recently pushed repos when events no longer list commits", () => {
    const modern = [
      { type: "PushEvent", repo: { name: "u/site" }, payload: { head: "abc" } },
      { type: "PushEvent", repo: { name: "u/site" }, payload: { head: "def" } },
      { type: "PushEvent", repo: { name: "u/api" }, payload: { head: "123" } },
      { type: "PushEvent", repo: { name: "u/third" }, payload: {} },
    ];
    expect(parseCommits(modern)).toEqual([]);
    expect(pushedRepos(modern)).toEqual(["u/site", "u/api"]);
    expect(parseRepoCommits([{ sha: "1234567abc", commit: { message: "Ship\nbody" } }, { sha: "zz" }], "u/site")).toEqual([
      { sha: "1234567", message: "Ship", repo: "site" },
    ]);
  });

  it("reads the username from a profile URL", () => {
    expect(githubUser("https://github.com/beebus-builds")).toBe("beebus-builds");
    expect(githubUser("https://example.com/x")).toBeNull();
  });
});

describe("Sindhuli clock", () => {
  it("reads UTC+05:45 wall time, across midnight", async () => {
    const { nepalClock, formatClock } = await import("./live");
    expect(nepalClock(Date.parse("2026-11-21T04:30:02Z"))).toEqual({ hours: 10, minutes: 15, seconds: 2 });
    expect(formatClock(nepalClock(Date.parse("2026-11-21T18:20:00Z")))).toBe("00:05");
    expect(formatClock(nepalClock(Date.parse("2026-11-21T20:45:00Z")))).toBe("02:30");
  });

  it("sleeps 1–5am and glances at the clock on quarter hours", async () => {
    const { isSleepingHour, isClockGlance } = await import("./live");
    expect([0, 1, 4, 5].map(isSleepingHour)).toEqual([false, true, true, false]);
    expect(isClockGlance({ hours: 9, minutes: 45, seconds: 3 })).toBe(true);
    expect(isClockGlance({ hours: 9, minutes: 45, seconds: 6 })).toBe(false);
    expect(isClockGlance({ hours: 9, minutes: 44, seconds: 1 })).toBe(false);
  });
});
