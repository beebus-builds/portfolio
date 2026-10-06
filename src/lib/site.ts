/**
 * Canonical site URL.
 *
 * Every absolute link the site emits — canonical tags, Open Graph images,
 * sitemap entries, JSON-LD — is built from this one value. Previously these
 * were hardcoded to a domain that is not registered, which meant every shared
 * link pointed somewhere dead.
 *
 * Set NEXT_PUBLIC_SITE_URL in the deployment environment (and .env locally)
 * when the real domain is known; the fallback keeps local builds working.
 */

const FALLBACK = "https://poudel.vercel.app";

function normalise(value: string): string {
  return value.replace(/\/+$/, "");
}

export const siteUrl = normalise(process.env.NEXT_PUBLIC_SITE_URL || FALLBACK);

/** Joins a path onto the canonical origin. */
export function absoluteUrl(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}