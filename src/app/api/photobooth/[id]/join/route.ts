import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getJoinAccess, joinPhone, normaliseCode } from "@/lib/photobooth";
import {
  InvalidJsonBodyError,
  RequestBodyTooLargeError,
  readLimitedJson,
} from "@/lib/photoboothProtocol";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

type Context = { params: Promise<{ id: string }> };

/** Exchange the one-time QR capability for a phone-only capability. */
export async function POST(req: NextRequest, { params }: Context) {
  const id = normaliseCode((await params).id);
  if (isRateLimited(`photobooth-join:${id}`, clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Slow down." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await readLimitedJson(req, 1_024);
  } catch (error) {
    const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
    const message = error instanceof InvalidJsonBodyError ? "Invalid request body" : "Request body is too large";
    return NextResponse.json({ error: message }, { status });
  }
  const joinToken = (body as { joinToken?: unknown } | null)?.joinToken;
  if (typeof joinToken !== "string" || !/^[A-Za-z0-9_-]{32,200}$/.test(joinToken)) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 400 });
  }

  try {
    const result = await joinPhone(id, joinToken);
    if (!result) {
      const access = await getJoinAccess(id, joinToken);
      if (access === "closed") {
        return NextResponse.json({ error: "That room has closed." }, { status: 404 });
      }
      return NextResponse.json({ error: "This room cannot accept another camera." }, { status: 409 });
    }
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("POST /api/photobooth/[id]/join failed:", error);
    return NextResponse.json({ error: "Could not connect the phone." }, { status: 500 });
  }
}
