"use server";

import { saveMessage } from "@/lib/contact";

export type ContactFormState = {
  status: "idle" | "sending" | "sent" | "error";
  error: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;
const MIN_MESSAGE = 10;

/**
 * Server action for the contact signal. Runs on the server, so validation and
 * the database write never trust the client. The old `/api/contact` route is
 * kept intact for any other callers; this action is the form's default path.
 */
export async function sendMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  // Honeypot: bots fill this; humans never see it.
  if (String(formData.get("company") ?? "").trim() !== "") {
    return { status: "sent", error: null };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", error: "Name, email and message are required" };
  }
  if (!EMAIL_RE.test(email) || email.length > MAX_EMAIL) {
    return { status: "error", error: "Invalid email address" };
  }
  if (name.length > MAX_NAME || message.length > MAX_MESSAGE) {
    return { status: "error", error: "Name or message is too long" };
  }
  if (message.length < MIN_MESSAGE) {
    return { status: "error", error: `Message should be at least ${MIN_MESSAGE} characters` };
  }

  try {
    await saveMessage(name, email, message);
    return { status: "sent", error: null };
  } catch {
    return { status: "error", error: "The channel could not receive that message." };
  }
}
