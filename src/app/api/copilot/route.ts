import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { profile, skills } from "@/lib/profile";
import { projects } from "@/lib/projects";

export const runtime = "nodejs";

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

const hitsByIp = new Map<string, number[]>();
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 64);
  return "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hitsByIp.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  recent.push(now);
  hitsByIp.set(ip, recent.slice(-RATE_LIMIT));
  return recent.length > RATE_LIMIT;
}

function buildSystemPrompt(): string {
  const skillList = skills.map((s) => `- ${s.name} (${s.level}%): ${s.detail}`).join("\n");
  const projectList = projects
    .map((p) => `- ${p.title}: ${p.description} (${p.tech.join(", ")})`)
    .join("\n");
  return `You are BP-07, the AI co-pilot of Bibash Poudel's interactive portfolio. You speak with a calm, slightly sci-fi tone, like a ship's computer. Answer questions about Bibash, his work, and his skills. Keep replies under 120 words. If asked about contact, email ${profile.links[0].value}. If you don't know something, say so honestly and suggest using the contact planet.

About Bibash: ${profile.role} based in ${profile.location} (${profile.coordinates}). ${profile.bio.join(" ")}

Skills:
${skillList}

Projects:
${projectList}`;
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ error: "Too many signals — try again in a few minutes." }, { status: 429 });
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Co-pilot is not configured yet." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { messages } = (body ?? {}) as { messages?: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }
  const clean = messages
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        typeof m === "object" &&
        m !== null &&
        ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
        typeof (m as { content?: unknown }).content === "string"
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.get("origin") ?? "http://localhost:3000",
        "X-Title": "devverse portfolio co-pilot",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "google/gemma-4-26b-a4b-it:free",
        messages: [{ role: "system", content: buildSystemPrompt() }, ...clean],
        max_tokens: 300,
      }),
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("OpenRouter error:", upstream.status, detail);
      return NextResponse.json({ error: "The co-pilot lost the signal." }, { status: 502 });
    }
    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) return NextResponse.json({ error: "Empty transmission." }, { status: 502 });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("POST /api/copilot failed:", error);
    return NextResponse.json({ error: "The co-pilot could not respond." }, { status: 500 });
  }
}
