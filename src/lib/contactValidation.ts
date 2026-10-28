/**
 * Shared contact-signal validation, used by both write paths:
 * the `/contact` server action and the `/api/contact` route.
 *
 * The error strings are part of the API contract — the route returns them as
 * JSON and the action renders them under the form — so change them only with
 * both callers in mind.
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_NAME = 100;
export const MAX_EMAIL = 254;
export const MAX_MESSAGE = 4000;
export const MIN_MESSAGE = 10;

export type CleanContact = {
  name: string;
  /** Trimmed and lowercased — emails are case-insensitive. */
  email: string;
  message: string;
};

export type ContactResult =
  | { ok: true; value: CleanContact }
  | { ok: false; error: string };

export function validateContact(raw: {
  name?: unknown;
  email?: unknown;
  message?: unknown;
}): ContactResult {
  const { name, email, message } = raw ?? {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return { ok: false, error: "Name, email and message are required" };
  }

  const clean: CleanContact = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
  };

  if (!EMAIL_RE.test(clean.email) || clean.email.length > MAX_EMAIL) {
    return { ok: false, error: "Invalid email address" };
  }
  if (clean.name.length > MAX_NAME || clean.message.length > MAX_MESSAGE) {
    return { ok: false, error: "Name or message is too long" };
  }
  if (clean.message.length < MIN_MESSAGE) {
    return { ok: false, error: `Message should be at least ${MIN_MESSAGE} characters` };
  }
  return { ok: true, value: clean };
}
