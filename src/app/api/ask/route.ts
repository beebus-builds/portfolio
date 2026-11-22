import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildSystemPrompt, cleanHistory, fallbackAnswer, modelChain, parseReply, type AskReply } from "@/lib/ask";
import { clientIp, isRateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 12000;
/** Visitors should never wait longer than this for the whole fallback chain. */
const TOTAL_BUDGET_MS = 30000;

/** Visitor question → the character's answer, via OpenRouter with a local fallback. */
export async function POST(req: NextRequest) {
  if (isRateLimited("ask", clientIp(req), RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: "Easy there — give me a few minutes to catch up." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const history = cleanHistory((body as { messages?: unknown } | null)?.messages);
  if (!history) return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  const question = history[history.length - 1]!.content;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return NextResponse.json({ ...fallbackAnswer(question), source: "fallback" });

  const system = buildSystemPrompt();
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  for (const model of modelChain(process.env.OPENROUTER_MODEL)) {
    const remaining = deadline - Date.now();
    if (remaining < 2000) break;
    try {
      const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(Math.min(UPSTREAM_TIMEOUT_MS, remaining)),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": req.nextUrl.origin,
          "X-Title": "Portfolio studio",
        },
        // Free "reasoning" models spend tokens thinking first; keep that short and
        // out of the reply, and leave room for the actual answer.
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, ...history],
          max_tokens: 700,
          reasoning: { effort: "low", exclude: true },
        }),
      });
      if (!upstream.ok) {
        console.error(`OpenRouter ${model} failed:`, upstream.status);
        continue;
      }
      const data = (await upstream.json()) as { choices?: { message?: { content?: string | null } }[] };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) continue;
      const parsed: AskReply = parseReply(text);
      if (parsed.reply) return NextResponse.json({ ...parsed, source: "ai" });
    } catch (error) {
      console.error(`OpenRouter ${model} error:`, error instanceof Error ? error.message : error);
    }
  }
  // Free models can all be down at once; the character still answers.
  return NextResponse.json({ ...fallbackAnswer(question), source: "fallback" });
}
