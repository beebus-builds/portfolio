import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { saveMessage } from "@/lib/contact";
import { validateContact } from "@/lib/contactValidation";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  if (isRateLimited("contact", clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many signals — try again in a few minutes." },
      { status: 429, headers: { "Retry-After": "120" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = validateContact(body as { name?: unknown; email?: unknown; message?: unknown });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { name, email, message } = result.value;
  try {
    await saveMessage(name, email, message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/contact failed:", error);
    return NextResponse.json({ error: "The channel could not receive that message." }, { status: 500 });
  }
}
