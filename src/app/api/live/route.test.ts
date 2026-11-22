import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("GET /api/live", () => {
  it("combines Sindhuli weather and recent commits, and caches them", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("open-meteo")) {
        return new Response(JSON.stringify({ current: { temperature_2m: 17.6, weather_code: 63, is_day: 1 } }));
      }
      return new Response(
        JSON.stringify([{ type: "PushEvent", repo: { name: "u/site" }, payload: { commits: [{ sha: "abcdef1234", message: "Ship it" }] } }])
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("./route");

    const data = await (await GET()).json();
    expect(data.weather).toEqual({ kind: "rain", tempC: 18, isDay: true, humidity: null, windKph: null });
    expect(data.gitLog).toContain("abcdef1 Ship it");

    await GET();
    expect(fetchMock).toHaveBeenCalledTimes(2); // second call served from cache
  });

  it("degrades to nothing live when both services fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { GET } = await import("./route");
    expect(await (await GET()).json()).toEqual({ weather: null, gitLog: null });
  });
});
