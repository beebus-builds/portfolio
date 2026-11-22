/**
 * Pure logic behind the homepage studio: where each portfolio page lives,
 * how typed commands resolve, the lo-fi playlist and what the character says.
 * Nothing here touches the DOM, WebGL or Web Audio, so it is fully testable.
 */

export type StudioRoute = {
  slug: string;
  href: string;
  label: string;
  /** Digit shortcut shown in the HUD (1–7). */
  key: string;
  blurb: string;
  /** Extra words the terminal accepts for this page. */
  aliases: string[];
};

export const ROUTES: StudioRoute[] = [
  { slug: "about", href: "/about", label: "About", key: "1", blurb: "who I am", aliases: ["me", "whoami", "bio"] },
  { slug: "projects", href: "/projects", label: "Projects", key: "2", blurb: "what I shipped", aliases: ["work", "portfolio", "ls"] },
  { slug: "skills", href: "/skills", label: "Skills", key: "3", blurb: "what I can build", aliases: ["stack", "tech"] },
  { slug: "experience", href: "/experience", label: "Experience", key: "4", blurb: "where I've worked", aliases: ["history", "jobs", "career"] },
  { slug: "services", href: "/services", label: "Services", key: "5", blurb: "how I can help", aliases: ["hire", "offer"] },
  { slug: "resume", href: "/resume", label: "Resume", key: "6", blurb: "the printed record", aliases: ["cv"] },
  { slug: "contact", href: "/contact", label: "Contact", key: "7", blurb: "say hello", aliases: ["email", "mail", "hello", "talk"] },
];

export function routeBySlug(slug: string): StudioRoute | undefined {
  return ROUTES.find((route) => route.slug === slug);
}

export function routeByKey(key: string): StudioRoute | undefined {
  return ROUTES.find((route) => route.key === key);
}

export type Command =
  | { type: "go"; route: StudioRoute }
  | { type: "help" }
  | { type: "music"; action: "play" | "pause" | "toggle" | "next" }
  | { type: "coffee" }
  | { type: "tour" }
  | { type: "clear" }
  | { type: "ask"; question: string }
  | { type: "empty" }
  | { type: "unknown"; input: string }
  /** Open the media deck on the monitor. */
  | { type: "media" }
  /** Play a link the visitor pasted: "youtube https://youtu.be/…". */
  | { type: "link"; url: string }
  /** Commute: drive to the office or back. */
  | { type: "commute"; to: Where };

const QUESTION_WORDS = new Set(["what", "who", "how", "why", "where", "when", "which", "can", "could", "do", "does", "are", "is", "tell", "would", "will", "have"]);

const GO_VERBS = new Set(["cd", "open", "go", "goto", "show", "visit", "view", "cat", "nav"]);

/** Resolve whatever the visitor typed in the terminal into one action. */
export function parseCommand(raw: string): Command {
  const input = raw.trim().toLowerCase();
  if (!input) return { type: "empty" };

  const words = input
    .replace(/^[>$/\s]+/, "")
    .split(/\s+/)
    .map((word) => word.replace(/^[./~]+|[./]+$/g, ""))
    .filter(Boolean);
  if (words.length === 0) return { type: "empty" };

  const [first, ...rest] = words as [string, ...string[]];

  // Questions go to the character: "ask what do you use?", or anything that reads like one.
  if (first === "ask") {
    const question = raw.trim().replace(/^[>$/\s]*ask\s*/i, "").trim();
    return question ? { type: "ask", question } : { type: "unknown", input: raw.trim() };
  }
  if (input.endsWith("?") || (words.length >= 3 && QUESTION_WORDS.has(first))) {
    return { type: "ask", question: raw.trim() };
  }

  if (["help", "?", "commands", "man"].includes(first)) return { type: "help" };
  if (["clear", "cls"].includes(first)) return { type: "clear" };
  if (["coffee", "sip", "drink"].includes(first)) return { type: "coffee" };
  if (["tour", "guide", "roam", "explore"].includes(first)) return { type: "tour" };
  if (["media", "tv", "screen", "monitor"].includes(first)) return { type: "media" };
  if (["drive", "commute", "office", "work"].includes(first)) {
    const wanted = rest[0];
    if (wanted === "home" || wanted === "back" || wanted === "studio") return { type: "commute", to: "studio" };
    return { type: "commute", to: "office" };
  }
  // "youtube <url>", "play <url>", or a bare link: it goes on the monitor.
  const typed = raw.trim();
  const isLinkWord = ["youtube", "yt", "video", "link", "watch"].includes(first) && rest.length > 0;
  // A bare link has to look like a domain: "youtu.be/x", never "2" or "about".
  const looksLikeLink = /^https?:\/\//i.test(typed) || /^[\w-]+(\.[\w-]+)+([/#][^\s]*)?$/.test(typed);
  const maybeUrl = isLinkWord ? typed.replace(/^\S*\s+/, "").trim() : looksLikeLink ? typed : null;
  if (maybeUrl) {
    const item = parseMediaInput(maybeUrl);
    if (item) return { type: "link", url: maybeUrl };
  }
  if (["play", "resume-music", "unpause"].includes(first)) return { type: "music", action: "play" };
  if (["pause", "stop", "mute"].includes(first)) return { type: "music", action: "pause" };
  if (["next", "skip"].includes(first)) return { type: "music", action: "next" };
  if (["music", "song", "track"].includes(first)) {
    const action = rest[0];
    if (action === "next" || action === "skip") return { type: "music", action: "next" };
    if (action === "pause" || action === "stop" || action === "off") return { type: "music", action: "pause" };
    if (action === "play" || action === "on") return { type: "music", action: "play" };
    return { type: "music", action: "toggle" };
  }

  // "cd projects", "open about", or just "projects" / "2".
  const target = GO_VERBS.has(first) ? rest[0] : first;
  if (target) {
    const route =
      routeByKey(target) ??
      ROUTES.find((entry) => entry.slug === target || entry.aliases.includes(target)) ??
      (target.length >= 3 ? ROUTES.find((entry) => entry.slug.startsWith(target)) : undefined);
    if (route) return { type: "go", route };
  }
  return { type: "unknown", input: raw.trim() };
}

/* ---------- time of day ---------- */

export type DayPhase = "morning" | "afternoon" | "evening" | "night";

export function phaseForHour(hour: number): DayPhase {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

/** Colours for the window and the room light, per phase of the visitor's day. */
export const PHASE_LOOK: Record<DayPhase, { sky: [string, string]; ambient: number; sun: string; orb: string; stars: boolean }> = {
  morning: { sky: ["#8ec5ff", "#ffe2b8"], ambient: 0.75, sun: "#fff1d6", orb: "#fff6c9", stars: false },
  afternoon: { sky: ["#4ea8ff", "#bfe3ff"], ambient: 0.85, sun: "#ffffff", orb: "#fffbe6", stars: false },
  evening: { sky: ["#3b2a6b", "#ff8a5c"], ambient: 0.68, sun: "#ffb487", orb: "#ffc48a", stars: false },
  night: { sky: ["#050816", "#1b2550"], ambient: 0.5, sun: "#9db8ff", orb: "#e8eeff", stars: true },
};

/* ---------- playlist ---------- */

export type Track = {
  id: string;
  title: string;
  mood: string;
  bpm: number;
  /** One chord per bar, as MIDI note numbers. The progression loops. */
  chords: number[][];
  /** How many bars play before the playlist moves on. */
  bars: number;
  phase: DayPhase;
};

export const PLAYLIST: Track[] = [
  {
    id: "morning-brew",
    title: "Morning Brew",
    mood: "warm & slow",
    bpm: 72,
    // Fmaj7 – Em7 – Dm7 – Cmaj7
    chords: [
      [53, 57, 60, 64],
      [52, 55, 59, 62],
      [50, 53, 57, 60],
      [48, 52, 55, 59],
    ],
    bars: 40,
    phase: "morning",
  },
  {
    id: "afternoon-commit",
    title: "Afternoon Commit",
    mood: "focused",
    bpm: 84,
    // Dm9 – G13 – Cmaj9 – A7
    chords: [
      [50, 53, 57, 60, 64],
      [43, 53, 57, 59, 64],
      [48, 52, 55, 59, 62],
      [45, 49, 55, 57, 60],
    ],
    bars: 48,
    phase: "afternoon",
  },
  {
    id: "golden-hour-deploy",
    title: "Golden Hour Deploy",
    mood: "nostalgic",
    bpm: 78,
    // Ebmaj7 – Dm7 – Cm7 – Bbmaj7
    chords: [
      [51, 55, 58, 62],
      [50, 53, 57, 60],
      [48, 51, 55, 58],
      [46, 50, 53, 57],
    ],
    bars: 44,
    phase: "evening",
  },
  {
    id: "midnight-refactor",
    title: "Midnight Refactor",
    mood: "rainy & late",
    bpm: 68,
    // Am9 – Fmaj7 – Cmaj7 – Em7
    chords: [
      [45, 48, 52, 55, 59],
      [41, 52, 57, 60, 64],
      [48, 52, 55, 59, 62],
      [40, 50, 55, 59, 62],
    ],
    bars: 36,
    phase: "night",
  },
];

export function trackIndexForPhase(phase: DayPhase): number {
  const index = PLAYLIST.findIndex((track) => track.phase === phase);
  return index === -1 ? 0 : index;
}

export function nextTrackIndex(index: number): number {
  return (index + 1) % PLAYLIST.length;
}

/** Track length in seconds: four beats per bar. */
export function trackSeconds(track: Track): number {
  return (track.bars * 4 * 60) / track.bpm;
}

/* ---------- media the monitor can play ---------- */

/**
 * How a link plays on the monitor. `youtube` and `vimeo` embed as an iframe,
 * `audio` and `video` stream straight into the screen, `link` opens in a new
 * tab, and `radio` is the built-in lo-fi player (no network at all).
 */
export type MediaKind = "youtube" | "vimeo" | "audio" | "video" | "link" | "radio";

export type MediaItem = {
  id: string;
  title: string;
  /** The artist, channel or publisher. */
  by?: string;
  kind: MediaKind;
  /** The link the visitor pasted. */
  url: string;
  /** The playable source: an iframe URL for embeds, the file URL for media. */
  src: string;
  blurb?: string;
};

/** Kind by file extension, for plain media URLs. */
const FILE_KINDS: Record<string, MediaKind> = {
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  oga: "audio",
  m4a: "audio",
  aac: "audio",
  flac: "audio",
  mp4: "video",
  m4v: "video",
  webm: "video",
  ogv: "video",
  mov: "video",
};

/** Pull the video id out of any YouTube link shape. */
export function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const match = /^\/(?:embed|shorts|live|v)\/([^/?]+)/.exec(url.pathname);
    if (match) return match[1] ?? null;
  }
  return null;
}

/** Pull the video id out of any Vimeo link shape. */
export function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const match = /\/(?:video\/)?(\d+)/.exec(url.pathname);
  if (match) return match[1] ?? null;
  return url.pathname.split("/").filter(Boolean).pop() ?? null;
}

/** Decide how a pasted link should play. */
export function mediaKindFor(url: URL): MediaKind {
  if (youtubeId(url)) return "youtube";
  if (vimeoId(url)) return "vimeo";
  const extension = url.pathname.split(".").pop()?.toLowerCase() ?? "";
  if (FILE_KINDS[extension]) return FILE_KINDS[extension]!;
  return "link";
}

/** The iframe or file URL that actually plays. */
export function mediaSourceFor(kind: MediaKind, url: URL, id?: string | null): string {
  if (kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${id ?? youtubeId(url) ?? ""}?autoplay=1&rel=0&playsinline=1&modestbranding=1&enablejsapi=1`;
  }
  if (kind === "vimeo") {
    return `https://player.vimeo.com/video/${id ?? vimeoId(url) ?? ""}?autoplay=1&title=0`;
  }
  return url.toString();
}

function hash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function readUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    // "nope" is a valid URL but not a link: insist on a real domain.
    return url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
}

/**
 * Turn whatever the visitor pasted — `youtu.be/x`, a raw mp4, a Spotify page —
 * into something the monitor knows how to play. Returns null for nonsense.
 */
export function parseMediaInput(raw: string, title?: string): MediaItem | null {
  const url = readUrl(raw);
  if (!url) return null;
  const kind = mediaKindFor(url);
  const source =
    kind === "youtube" ? mediaSourceFor(kind, url, youtubeId(url)) : kind === "vimeo" ? mediaSourceFor(kind, url, vimeoId(url)) : mediaSourceFor(kind, url);
  const guess =
    title?.trim() ||
    (kind === "youtube" || kind === "vimeo" ? `${kind === "youtube" ? "YouTube" : "Vimeo"} · ${url.hostname.replace(/^www\./, "")}` : decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? url.hostname));
  return { id: `l-${hash(url.toString())}`, title: guess, kind, url: url.toString(), src: source };
}

/**
 * Paste your own media links here — YouTube, Vimeo, an mp4 or mp3 file, or
 * anything else playable. Anything not embeddable simply opens in a new tab.
 * The room also ships with the lo-fi radio, which needs no network at all.
 */
export const MEDIA_LINKS: { title: string; by?: string; url: string; blurb?: string }[] = [];

/** The built-in stations: synthesised in the browser, so they always play. */
export const RADIO: MediaItem[] = PLAYLIST.map((track) => ({
  id: `radio-${track.id}`,
  title: track.title,
  by: "Bibash · lo-fi radio",
  kind: "radio" as const,
  url: `#radio-${track.id}`,
  src: `radio-${track.id}`,
  blurb: track.mood,
}));

export function mediaLibrary(extra?: { title?: string; url: string }[]): MediaItem[] {
  const custom = (extra ?? []).map((entry) => parseMediaInput(entry.url, entry.title)).filter((item): item is MediaItem => item !== null);
  const pinned = MEDIA_LINKS.map((entry) => parseMediaInput(entry.url, entry.title)).filter((item): item is MediaItem => item !== null);
  return [...RADIO, ...pinned, ...custom];
}

/* ---------- the commute: at the desk by day, at the office by 9:30 ---------- */

/** Half past nine: Bibash leaves for the office. */
export const OFFICE_HOUR = 9.5;
/** Six o'clock: back to the studio. */
export const HOME_HOUR = 18;
/** How long the drive takes, for the loading screen. */
export const COMMUTE_MINUTES = 12;

export type Where = "studio" | "office";

export function whereIs(hour: number): Where {
  return hour >= OFFICE_HOUR && hour < HOME_HOUR ? "office" : "studio";
}

/** How long a drive between rooms takes. */
export function commuteMinutes(): number {
  return COMMUTE_MINUTES;
}

/** Seconds: how long the driving loading screen runs for. */
export function commuteSeconds(): number {
  return COMMUTE_MINUTES * 60;
}

/** The next hour the character changes rooms, for the clock readout. */
export function nextMove(hour: number): { hour: number; to: Where } | null {
  const to = whereIs(hour);
  if (to === "studio" && hour < OFFICE_HOUR) return { hour: OFFICE_HOUR, to: "office" };
  if (to === "office") return { hour: HOME_HOUR, to: "studio" };
  return null;
}

/* ---------- what the character says ---------- */

export type BubbleOption = { label: string; slug?: string; action?: "music" | "coffee" | "dismiss" | "terminal" };
export type Bubble = { text: string; options?: BubbleOption[] };

export function greeting(phase: DayPhase): Bubble {
  const hello =
    phase === "morning"
      ? "Morning! Just made coffee."
      : phase === "afternoon"
        ? "Hey! Deep in a build right now."
        : phase === "evening"
          ? "Evening! Wrapping up a deploy."
          : "Oh hey, night owl.";
  return {
    text: `${hello} I'm Bibash. Want me to show you around?`,
    options: [
      { label: "Show me your work", slug: "projects" },
      { label: "Who are you?", slug: "about" },
      { label: "Put some music on", action: "music" },
      { label: "Ask me anything", action: "terminal" },
    ],
  };
}

/** Nudges the character offers while the visitor lingers. Rotated in order. */
export const NUDGES: Bubble[] = [
  {
    text: "Psst — press / to open my terminal. Try `cd projects`, or just ask me a question.",
    options: [{ label: "Open terminal", action: "terminal" }],
  },
  {
    text: "Curious how I got here? The path is a bit winding.",
    options: [
      { label: "Show experience", slug: "experience" },
      { label: "Later", action: "dismiss" },
    ],
  },
  {
    text: "Need something built? I take on a few projects at a time.",
    options: [
      { label: "See services", slug: "services" },
      { label: "Say hello", slug: "contact" },
    ],
  },
  {
    text: "This song's on repeat in my head. Want to hear the next one?",
    options: [{ label: "Next track", action: "music" }],
  },
  {
    text: "Want the short version? My résumé fits on one page.",
    options: [
      { label: "Open resume", slug: "resume" },
      { label: "Skills instead", slug: "skills" },
    ],
  },
];

export function nudgeAt(index: number): Bubble {
  return NUDGES[((index % NUDGES.length) + NUDGES.length) % NUDGES.length]!;
}

export const HELP_LINES = [
  "cd <page>       open a page (about, projects, skills, experience,",
  "                services, resume, contact)",
  "1–7             jump straight to a page",
  "ask <question>  ask me anything (or just type a question?)",
  "media           open the monitor's media deck",
  "youtube <link>  play a youtube / vimeo / mp3 / mp4 link on the monitor",
  "music | next    play / pause, skip the lo-fi radio",
  "drive [home]    commute to the office, or drive back",
  "coffee          ask me to take a sip",
  "tour            let me suggest where to go",
  "clear           clear the terminal",
];

/** Coffee left after one sip. Never negative. */
export function sip(level: number): number {
  return Math.max(0, Math.round((level - 0.2) * 100) / 100);
}
