import type { Post, PostSection } from "./posts";

/**
 * A tiny authoring format for post bodies.
 *
 * The admin editor gives you one textarea rather than a nested form with
 * repeater rows, because writing is the part that should be easy. The subset
 * is intentionally small:
 *
 *   plain paragraph
 *   blank line separates blocks
 *
 *   > pull quote
 *
 *   ## Section heading
 *
 *   paragraph inside the section
 *
 *   - a bullet
 *   - another bullet
 *
 *   ```ts
 *   fenced code, back to back
 *   ```
 *
 * Everything before the first `##` is the lead. Round-tripping is lossless, so
 * editing an existing post does not reformat it.
 */

const FENCE_RE = /^```(\w*)\s*$/;
const HEADING_RE = /^##\s+(.+)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const BULLET_RE = /^-\s+(.+)$/;

export type PostContent = {
  body: string[];
  quote?: string;
  sections: PostSection[];
};

export function parsePostContent(source: string): PostContent {
  const lines = source.replace(/\r\n/g, "\n").split("\n");

  const body: string[] = [];
  const sections: PostSection[] = [];
  let quote: string | undefined;
  let current: PostSection | null = null;
  let fenceLang: string | null = null;
  let fenceBuffer: string[] = [];

  const commitFence = () => {
    if (!current || fenceLang === null) return;
    current.code = { lang: fenceLang || "text", snippet: fenceBuffer.join("\n") };
    fenceLang = null;
    fenceBuffer = [];
  };

  const pushParagraph = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (current) current.paragraphs.push(trimmed);
    else body.push(trimmed);
  };

  let paragraphBuffer: string[] = [];
  const flushParagraph = () => {
    pushParagraph(paragraphBuffer.join(" "));
    paragraphBuffer = [];
  };

  for (const line of lines) {
    const fence = FENCE_RE.exec(line);
    if (fence) {
      if (fenceLang === null) {
        // Opening fence: end the current paragraph, start collecting code.
        flushParagraph();
        commitFence();
        fenceLang = fence[1] ?? "";
      } else {
        commitFence();
      }
      continue;
    }

    if (fenceLang !== null) {
      fenceBuffer.push(line);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const heading = HEADING_RE.exec(line.trim());
    if (heading) {
      flushParagraph();
      current = { heading: heading[1].trim(), paragraphs: [] };
      sections.push(current);
      continue;
    }

    const quoted = QUOTE_RE.exec(line.trim());
    if (quoted) {
      flushParagraph();
      quote = (quote ? `${quote} ` : "") + quoted[1].trim();
      continue;
    }

    const bullet = BULLET_RE.exec(line.trim());
    if (bullet && current) {
      flushParagraph();
      (current.bullets ??= []).push(bullet[1].trim());
      continue;
    }

    paragraphBuffer.push(line.trim());
  }

  flushParagraph();
  commitFence();

  return { body, quote, sections };
}

/** Inverse of `parsePostContent`; used to load an existing post into the editor. */
export function serializePostContent(content: {
  body: string[];
  quote?: string;
  sections?: PostSection[];
}): string {
  // Blank line between blocks: consecutive lines merge into one paragraph,
  // so every paragraph needs its own separator.
  const out: string[] = [];
  for (const paragraph of content.body) {
    if (out.length > 0) out.push("");
    out.push(paragraph);
  }

  if (content.quote) out.push(`> ${content.quote}`);

  for (const section of content.sections ?? []) {
    out.push("", `## ${section.heading}`);
    for (const paragraph of section.paragraphs) out.push("", paragraph);
    if (section.bullets?.length) {
      out.push("");
      for (const bullet of section.bullets) out.push(`- ${bullet}`);
    }
    if (section.code) {
      out.push("", "```" + section.code.lang, ...section.code.snippet.split("\n"), "```");
    }
  }

  return out.join("\n").trim();
}

/** Pulls the pieces of a static post back out for the editor. */
export function postToContent(post: Post): string {
  return serializePostContent({ body: post.body, quote: post.quote, sections: post.sections });
}