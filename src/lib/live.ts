/**
 * Pure helpers for the homepage's live details: Sindhuli's real weather and
 * time, and recent GitHub commits shown on the monitor. No I/O here; the API
 * routes fetch and cache, these functions only interpret.
 */

/** Sindhuli Madhi, Nepal. */
export const SINDHULI = { latitude: 27.2569, longitude: 85.9713 };

export type WeatherKind = "clear" | "cloudy" | "fog" | "rain" | "storm" | "snow";

export type Weather = {
  kind: WeatherKind;
  tempC: number | null;
  isDay: boolean;
  /** Relative humidity, %. */
  humidity?: number | null;
  /** Wind speed at 10 m, km/h. */
  windKph?: number | null;
};

/** Map a WMO weather code (as used by Open-Meteo) to what the window shows. */
export function weatherKind(code: number): WeatherKind {
  if (code <= 1) return "clear";
  if (code <= 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloudy";
}

/** The hour in Nepal (UTC+05:45), whatever the visitor's own timezone. */
export function nepalHour(date: Date): number {
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + 5 * 60 + 45;
  return Math.floor((minutes % (24 * 60)) / 60);
}

export type ClockTime = { hours: number; minutes: number; seconds: number };

const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

/** Sindhuli wall-clock time (UTC+05:45) for a timestamp, seconds fractional. */
export function nepalClock(ms: number): ClockTime {
  const day = (((ms + NEPAL_OFFSET_MS) % 86_400_000) + 86_400_000) % 86_400_000;
  return {
    hours: Math.floor(day / 3_600_000),
    minutes: Math.floor((day % 3_600_000) / 60_000),
    seconds: (day % 60_000) / 1000,
  };
}

/** 1am–5am in Sindhuli: the character is asleep at the desk. */
export function isSleepingHour(hours: number): boolean {
  return hours >= 1 && hours < 5;
}

/** On each quarter hour the character glances up at the clock for a moment. */
export function isClockGlance({ minutes, seconds }: ClockTime): boolean {
  return minutes % 15 === 0 && seconds < 5;
}

/** "21:04" */
export function formatClock({ hours, minutes }: ClockTime): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export type Commit ={ sha: string; message: string; repo: string };

type PushEvent = {
  type?: string;
  repo?: { name?: string };
  payload?: { commits?: { sha?: string; message?: string }[] };
};

/** Clean a commit subject for display: first line, printable, short. */
export function cleanMessage(message: string, max = 52): string {
  const first = message.split("\n")[0] ?? "";
  // Keep printable ASCII plus common punctuation; drop control characters.
  const printable = first.replace(/[^\x20-\x7E -ɏ–—‘-”]/g, "").trim();
  return printable.length > max ? `${printable.slice(0, max - 1)}…` : printable;
}

/** Newest-first commits from the public GitHub events feed. */
export function parseCommits(events: unknown, limit = 7): Commit[] {
  if (!Array.isArray(events)) return [];
  const commits: Commit[] = [];
  for (const event of events as PushEvent[]) {
    if (event?.type !== "PushEvent") continue;
    const repo = (event.repo?.name ?? "").split("/").pop() ?? "";
    for (const commit of [...(event.payload?.commits ?? [])].reverse()) {
      const message = cleanMessage(String(commit.message ?? ""));
      const sha = String(commit.sha ?? "").slice(0, 7);
      if (!message || !/^[0-9a-f]{7}$/.test(sha)) continue;
      commits.push({ sha, message, repo });
      if (commits.length >= limit) return commits;
    }
  }
  return commits;
}

/**
 * Repos the user pushed to most recently, newest first. GitHub's public push
 * events no longer carry commit lists, only the repo, so this is step one.
 */
export function pushedRepos(events: unknown, limit = 2): string[] {
  if (!Array.isArray(events)) return [];
  const repos: string[] = [];
  for (const event of events as PushEvent[]) {
    const name = event?.repo?.name;
    if (event?.type !== "PushEvent" || !name || !/^[\w.-]+\/[\w.-]+$/.test(name) || repos.includes(name)) continue;
    repos.push(name);
    if (repos.length >= limit) break;
  }
  return repos;
}

/** Commits from the REST `GET /repos/{repo}/commits` response. */
export function parseRepoCommits(items: unknown, repo: string, limit = 5): Commit[] {
  if (!Array.isArray(items)) return [];
  const short = repo.split("/").pop() ?? repo;
  return (items as { sha?: string; commit?: { message?: string } }[])
    .map((item) => ({ sha: String(item?.sha ?? "").slice(0, 7), message: cleanMessage(String(item?.commit?.message ?? "")), repo: short }))
    .filter((c) => /^[0-9a-f]{7}$/.test(c.sha) && c.message)
    .slice(0, limit);
}

/** The monitor's "live" file: a git log of what was actually shipped lately. */
export function gitLogSnippet(commits: Commit[], user: string): string[] | null {
  if (commits.length === 0) return null;
  return [
    `// live: github.com/${user}`,
    "$ git log --oneline",
    ...commits.map((c) => `${c.sha} ${c.message}`),
    "",
    "// real commits, fetched for this visit",
  ];
}

/** GitHub username from a profile URL like https://github.com/name. */
export function githubUser(href: string | undefined): string | null {
  const match = /github\.com\/([A-Za-z0-9-]{1,39})\/?$/.exec(href ?? "");
  return match ? match[1]! : null;
}
