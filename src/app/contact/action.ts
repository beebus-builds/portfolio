"use server";

import { saveMessage } from "@/lib/contact";
import { validateContact } from "@/lib/contactValidation";

export type ContactFormState = {
  status: "idle" | "sending" | "sent" | "error";
  error: string | null;
};

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

  const result = validateContact({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  try {
    const { name, email, message } = result.value;
    await saveMessage(name, email, message);
    return { status: "sent", error: null };
  } catch {
    return { status: "error", error: "The channel could not receive that message." };
  }
}
