/**
 * Emails the site owner when someone sends a contact message, via Resend's
 * HTTP API. Optional and best-effort: with no RESEND_API_KEY it does nothing,
 * and a failure never breaks the visitor's submission (the message is already
 * saved in the database by then).
 *
 * Env: RESEND_API_KEY, CONTACT_NOTIFY_TO (your inbox), and optionally
 * CONTACT_NOTIFY_FROM (a sender on a domain verified with Resend).
 */

export type NewMessage = { name: string; email: string; message: string };

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function buildEmail(msg: NewMessage, to: string, from: string) {
  return {
    from,
    to: [to],
    reply_to: msg.email,
    subject: `New message from ${msg.name.slice(0, 80)} via your portfolio`,
    text: `${msg.name} <${msg.email}> wrote:\n\n${msg.message}\n\nReply to this email to answer them directly.`,
    html: `<p><strong>${escapeHtml(msg.name)}</strong> &lt;${escapeHtml(msg.email)}&gt; wrote:</p><blockquote style="border-left:3px solid #7fe3ff;margin:0;padding:4px 12px;white-space:pre-wrap">${escapeHtml(msg.message)}</blockquote><p style="color:#667">Reply to this email to answer them directly.</p>`,
  };
}

/** Returns true if an email was sent, false if skipped or failed. */
export async function notifyNewMessage(msg: NewMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_TO;
  if (!key || !to) return false;
  const from = process.env.CONTACT_NOTIFY_FROM || "Portfolio <onboarding@resend.dev>";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildEmail(msg, to, from)),
    });
    if (!response.ok) console.error("Contact email failed:", response.status);
    return response.ok;
  } catch (error) {
    console.error("Contact email error:", error instanceof Error ? error.message : error);
    return false;
  }
}
