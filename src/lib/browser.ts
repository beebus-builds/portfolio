/**
 * The little intranet that lives on the studio monitor. It is deliberately
 * small and local: the portfolio's own pages, the room's media channel and a
 * few profile links. Nothing here touches the DOM, so it is easy to test.
 */

import { profile } from "@/lib/profile";
import { ROUTES } from "@/lib/studio";

export const HOME_KEY = "home";
export const TV_KEY = "tv";

export type BrowserSite = {
  key: string;
  /** What the address bar shows after `studio://`. */
  path: string;
  title: string;
  icon: string;
  blurb: string;
};

const ROUTE_ICONS: Record<string, string> = {
  about: "◍",
  projects: "▤",
  skills: "◈",
  experience: "⌛",
  services: "✦",
  resume: "▦",
  contact: "✉",
};

export const BROWSER_SITES: BrowserSite[] = [
  { key: HOME_KEY, path: "home", title: "New tab", icon: "⌂", blurb: "the start page" },
  ...ROUTES.map((route) => ({
    key: route.slug,
    path: route.slug,
    title: route.label,
    icon: ROUTE_ICONS[route.slug] ?? "•",
    blurb: route.blurb,
  })),
  { key: TV_KEY, path: "studio.tv", title: "studio.tv", icon: "▶", blurb: "lo-fi on the monitor" },
];

export function siteByKey(key: string): BrowserSite | undefined {
  return BROWSER_SITES.find((site) => site.key === key);
}

function profileLink(label: string, fallback: string) {
  return profile.links.find((link) => link.label === label)?.href ?? fallback;
}

const EXTERNAL: Record<string, string> = {
  github: profileLink("GitHub", "https://github.com/beebus-builds"),
  gh: profileLink("GitHub", "https://github.com/beebus-builds"),
  linkedin: profileLink("LinkedIn", "https://linkedin.com/in/bibashpoudel"),
  mail: profileLink("Email", "mailto:poudelbibash044@gmail.com"),
  email: profileLink("Email", "mailto:poudelbibash044@gmail.com"),
};

export type AddressTarget = { kind: "site"; key: string } | { kind: "external"; url: string };

/**
 * Work out what the visitor meant by whatever they typed in the address bar.
 * Accepts `about`, `/about`, `studio://about`, `studio.tv`, `github`,
 * a full URL or a bare domain. Returns null when it is not a place we know.
 */
export function resolveAddress(raw: string): AddressTarget | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^(https?:|mailto:)/i.test(trimmed)) return { kind: "external", url: trimmed };

  const cleaned = trimmed
    .replace(/^studio:\/\//i, "")
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();
  if (!cleaned) return { kind: "site", key: HOME_KEY };

  if (["home", "start", "newtab", "new-tab", "new tab"].includes(cleaned)) {
    return { kind: "site", key: HOME_KEY };
  }

  const site = BROWSER_SITES.find((entry) => entry.key === cleaned || entry.path === cleaned);
  if (site) return { kind: "site", key: site.key };

  const route = ROUTES.find((entry) => entry.slug === cleaned || entry.aliases.includes(cleaned));
  if (route) return { kind: "site", key: route.slug };

  const external = EXTERNAL[cleaned];
  if (external) return { kind: "external", url: external };

  // A bare domain, e.g. "github.com/beebus-builds".
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(cleaned)) {
    return { kind: "external", url: `https://${cleaned}` };
  }

  return null;
}

/** The address bar text for a site key. */
export function addressFor(key: string): string {
  if (key === HOME_KEY) return "home";
  return siteByKey(key)?.path ?? key;
}
