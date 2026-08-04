import { CORPUS, SMALLTALK, type KnowledgeChunk } from "@/lib/ai/corpus";

// ─── A small self-trained retrieval engine ──────────────────────────
// Tokenizes + stems text, builds TF-IDF weights over the training
// corpus, and answers queries by cosine similarity. No external APIs.

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "could",
  "did", "do", "does", "for", "had", "has", "have", "he", "her", "him",
  "his", "i", "if", "in", "into", "is", "it", "its", "me", "more", "my",
  "of", "on", "or", "our", "she", "so", "than", "that", "the", "their",
  "them", "then", "there", "these", "they", "this", "to", "up", "us",
  "was", "we", "were", "which", "will", "with", "would", "you", "your",
  "please", "want", "like", "get", "give", "any", "some", "really",
  "maybe", "think", "show", "see", "only", "just", "still", "also", "very",
]);

// Question words and anchors carry real matching signal — keep them.
const QUERY_WORDS = new Set([
  "what", "when", "where", "who", "why", "how", "from", "about", "tell",
]);

const SUFFIXES: [RegExp, string][] = [
  [/ies$/i, "y"],
  [/ves$/i, "f"],
  [/s$/, ""],
  [/ing$/, ""],
  [/edly$/, ""],
  [/ed$/, ""],
  [/er$/, ""],
  [/est$/, ""],
];

function stem(word: string): string {
  let w = word.toLowerCase();
  let changed = true;
  while (changed && w.length > 3) {
    changed = false;
    for (const [re, rep] of SUFFIXES) {
      if (re.test(w) && w.length - rep.length >= 3) {
        const next = w.replace(re, rep);
        if (next !== w) {
          w = next;
          changed = true;
          break;
        }
      }
    }
  }
  return w;
}

export function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9+#\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // Filter stopwords on the RAW form (before stemming). Query words survive.
  const kept = raw.filter((w) => !STOPWORDS.has(w) || QUERY_WORDS.has(w));

  // If everything was filtered out, fall back to the raw tokens so short
  // queries like "where is he from" still produce something to match.
  const words = kept.length > 0 ? kept : raw;

  return words.map(stem).filter((w) => w.length > 1);
}

interface DocVec {
  chunk: KnowledgeChunk;
  tf: Map<string, number>;
  kw: Set<string>;
  norm: number;
}

// Keywords are explicit match signals — weight them higher than body text.
const KEYWORD_BOOST = 3;

function collectTokens(chunk: KnowledgeChunk): { term: string; boost: number }[] {
  const tokens: { term: string; boost: number }[] = [];
  const seen = new Set<string>();
  chunk.keywords.forEach((k) => {
    tokenize(k).forEach((t) => {
      tokens.push({ term: t, boost: KEYWORD_BOOST });
      seen.add(t);
    });
  });
  tokenize(`${chunk.title} ${chunk.text}`).forEach((t) => {
    if (!seen.has(t)) tokens.push({ term: t, boost: 1 });
  });
  return tokens;
}

class TrainedModel {
  private docs: DocVec[] = [];
  private idf = new Map<string, number>();

  train(chunks: KnowledgeChunk[]) {
    this.docs = [];
    this.idf = new Map();

    const df = new Map<string, number>();
    for (const chunk of chunks) {
      const terms = new Set(collectTokens(chunk).map((t) => t.term));
      terms.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    }

    const n = chunks.length;
    df.forEach((count, term) => {
      this.idf.set(term, Math.log(1 + n / (count || 1)));
    });

    for (const chunk of chunks) {
      this.buildVec(chunk);
    }
  }

  private buildVec(chunk: KnowledgeChunk) {
    const tokens = collectTokens(chunk);
    const tf = new Map<string, number>();
    const kw = new Set<string>();
    tokens.forEach(({ term, boost }) => {
      tf.set(term, (tf.get(term) || 0) + boost);
      if (boost > 1) kw.add(term);
    });
    let norm = 0;
    tf.forEach((count, t) => {
      const w = (1 + Math.log(count)) * (this.idf.get(t) || 0);
      norm += w * w;
    });
    this.docs.push({ chunk, tf, kw, norm: Math.sqrt(norm) });
  }

  addChunk(chunk: KnowledgeChunk) {
    this.buildVec(chunk);
  }

  score(query: string): { chunk: KnowledgeChunk; score: number; coverage: number }[] {
    const tokens = tokenize(query);
    if (!tokens.length) return [];

    // Pure question words never count toward coverage. Filler like
    // about/tell don't either — but a query like "where is he from"
    // falls back to keeping "from" so it still resolves.
    const pureQuestion = new Set(["what", "when", "where", "who", "why", "how"]);
    let matchTokens = tokens.filter((t) => !QUERY_WORDS.has(t));
    if (!matchTokens.length) {
      matchTokens = tokens.filter((t) => !pureQuestion.has(t) && t !== "about" && t !== "tell");
    }

    const q = new Map<string, number>();
    matchTokens.forEach((t) => q.set(t, (q.get(t) || 0) + 1));

    const results: { chunk: KnowledgeChunk; score: number; coverage: number; kwCoverage: number }[] = [];
    for (const doc of this.docs) {
      let dot = 0;
      let covered = 0;
      let kwCovered = 0;
      q.forEach((count, term) => {
        const tf = doc.tf.get(term);
        if (tf) {
          dot += (1 + Math.log(count)) * (this.idf.get(term) || 1) * (1 + Math.log(tf));
          covered++;
          if (doc.kw.has(term)) kwCovered++;
        }
      });
      let qNorm = 0;
      q.forEach((count, term) => {
        const w = (1 + Math.log(count)) * (this.idf.get(term) || 1);
        qNorm += w * w;
      });
      const cosine = doc.norm > 0 && qNorm > 0 ? dot / (doc.norm * Math.sqrt(qNorm)) : 0;
      const coverage = matchTokens.length > 0 ? covered / matchTokens.length : 0;
      const kwCoverage = matchTokens.length > 0 ? kwCovered / matchTokens.length : 0;
      results.push({ chunk: doc.chunk, score: cosine, coverage, kwCoverage });
    }
    return results.sort((a, b) => {
      if (Math.abs(a.coverage - b.coverage) > 1e-6) return b.coverage - a.coverage;
      if (Math.abs(a.kwCoverage - b.kwCoverage) > 1e-6) return b.kwCoverage - a.kwCoverage;
      return b.score - a.score;
    });
  }
}

// ─── Singleton model, trained on page load ──────────────────────────

const model = new TrainedModel();
let blogLoaded = false;
let trained = false;

function ensureTrained() {
  if (!trained) {
    model.train([...CORPUS, ...SMALLTALK]);
    trained = true;
  }
}

export interface AIAnswer {
  text: string;
  source?: string;
  confidence: "high" | "medium" | "low";
  suggestions: string[];
}

const SUGGESTIONS = [
  "What projects has he built?",
  "What are his skills?",
  "How do I contact him?",
  "Tell me about Nepal",
  "What is he studying?",
  "Is he available for work?",
];

const LOW_COVERAGE = 0.34;

// Queries the tokenizer reduces to nothing (pure question words).
// Match them by raw phrase.
const PHRASE_ROUTES: { test: RegExp; id: string }[] = [
  { test: /\bwhat are you\b|\bwhat are u\b|\bare you a (bot|robot|ai|human)\b/, id: "who-made" },
  { test: /\bwho are you\b|\bwho r you\b|\bwho am i talking\b/, id: "who-made" },
  { test: /\bhow are you\b|\bhow r you\b|\bwhats up\b|\bwhat's up\b/, id: "greeting" },
  { test: /^(hi|hey|hello|yo|sup|namaste|namaskar)\b/, id: "greeting" },
  { test: /^(thanks|thank you|thx)\b/, id: "thanks" },
  { test: /^(bye|goodbye|see you|farewell|later)\b/, id: "bye" },
  { test: /\bwhat can you do\b|\bwhat do you know\b|\byour abilities\b|\bhow do you work\b/, id: "help" },
];

function findPhrase(query: string): KnowledgeChunk | undefined {
  const q = query.toLowerCase();
  for (const { test, id } of PHRASE_ROUTES) {
    if (test.test(q)) {
      return [...CORPUS, ...SMALLTALK].find((c) => c.id === id);
    }
  }
  return undefined;
}

function fmtAnswer(chunk: KnowledgeChunk, confidence: "high" | "medium" | "low"): AIAnswer {
  const lines = chunk.answer.split("\n");
  const box = [`${confidence === "high" ? "▍" : "▍"} ${lines[0]}`, ...lines.slice(1)];
  return {
    text: box.join("\n"),
    source: chunk.source,
    confidence,
    suggestions: SUGGESTIONS.filter((s) => tokenize(s).some((t) => !chunk.keywords.some((k) => tokenize(k).includes(t)))).slice(0, 3),
  };
}

export async function askAI(question: string): Promise<AIAnswer> {
  ensureTrained();

  if (!blogLoaded && typeof window !== "undefined") {
    blogLoaded = true;
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      if (res.ok) {
        const posts: { slug: string; title: string; excerpt: string; tags: string[] }[] = await res.json();
        posts.forEach((p) => {
          model.addChunk({
            id: `blog-${p.slug}`,
            keywords: [p.title, ...(p.tags || [])],
            title: p.title,
            text: `${p.title}. ${p.excerpt || ""}`,
            answer: `${p.title}\n\n${p.excerpt || "A post on the blog."}\n\nRead it at /blog/${p.slug}`,
            source: `/blog/${p.slug}`,
          });
        });
      }
    } catch {
      /* blog unavailable — static corpus still works */
    }
  }

  const results = model.score(question);

  // Exact smalltalk phrases the tokenizer can't express.
  const phraseHit = findPhrase(question);
  if (phraseHit) return fmtAnswer(phraseHit, "high");

  if (!results.length) {
    return {
      text: "Hmm — I didn't catch that. Try rephrasing, or tap a suggestion below.",
      confidence: "low",
      suggestions: SUGGESTIONS,
    };
  }

  const top = results[0];
  if (top.coverage < LOW_COVERAGE) {
    return {
      text: "I'm not confident about that one. I'm trained on Bibash's projects, skills, education, Nepal, and blog — try one of these:",
      confidence: "low",
      suggestions: SUGGESTIONS,
    };
  }

  const confidence = top.coverage >= 0.9 ? "high" : top.coverage >= 0.55 ? "medium" : "low";
  return fmtAnswer(top.chunk, confidence);
}
