import { NextResponse } from "next/server";
import { gitLogSnippet, githubUser, parseCommits, parseRepoCommits, pushedRepos, SINDHULI, weatherKind, type Weather } from "@/lib/live";
import { profile } from "@/lib/profile";

export const runtime = "nodejs";

/**
 * The homepage's live details in one request: Sindhuli's current weather
 * (Open-Meteo, no key needed) and recent public commits (GitHub). Cached in
 * memory for 30 minutes so visitors never hit either service directly, and
 * every failure degrades to "nothing live" rather than an error.
 */

const TTL_MS = 30 * 60 * 1000;
const user = githubUser(profile.links.find((link) => link.label === "GitHub")?.href) ?? "beebus-builds";

type Live = { weather: Weather | null; gitLog: string[] | null };
let cache: { at: number; value: Live } | null = null;

async function fetchWeather(): Promise<Weather | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${SINDHULI.latitude}&longitude=${SINDHULI.longitude}` +
    "&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m&timezone=Asia%2FKathmandu";
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      current?: { temperature_2m?: number; weather_code?: number; is_day?: number; relative_humidity_2m?: number; wind_speed_10m?: number };
    };
    const current = data.current;
    if (typeof current?.weather_code !== "number") return null;
    return {
      kind: weatherKind(current.weather_code),
      tempC: typeof current.temperature_2m === "number" ? Math.round(current.temperature_2m) : null,
      isDay: current.is_day === 1,
      humidity: typeof current.relative_humidity_2m === "number" ? Math.round(current.relative_humidity_2m) : null,
      windKph: typeof current.wind_speed_10m === "number" ? Math.round(current.wind_speed_10m) : null,
    };
  } catch {
    return null;
  }
}

async function fetchGitLog(): Promise<string[] | null> {
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-studio" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const response = await fetch(`https://api.github.com/users/${user}/events/public?per_page=40`, {
      headers,
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const events = await response.json();
    // Older event payloads still list commits; use them when present.
    const inline = parseCommits(events);
    if (inline.length > 0) return gitLogSnippet(inline, user);
    // Otherwise read the latest commits of the repos pushed to most recently.
    const lists = await Promise.all(
      pushedRepos(events).map(async (repo) => {
        const commits = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, {
          headers,
          signal: AbortSignal.timeout(6000),
          cache: "no-store",
        });
        return commits.ok ? parseRepoCommits(await commits.json(), repo, 4) : [];
      })
    );
    return gitLogSnippet(lists.flat().slice(0, 7), user);
  } catch {
    return null;
  }
}

export async function GET() {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const [weather, gitLog] = await Promise.all([fetchWeather(), fetchGitLog()]);
    // Keep the last good values if a refresh comes back empty.
    cache = { at: Date.now(), value: { weather: weather ?? cache?.value.weather ?? null, gitLog: gitLog ?? cache?.value.gitLog ?? null } };
  }
  return NextResponse.json(cache.value, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=1800" } });
}
