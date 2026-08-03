export interface BlogPost {
  title: string;
  date: string;
  tags: string[];
  color: string;
  slug: string;
  excerpt: string;
  content: string;
  readingTime: number;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  const metaLines = match[1].split("\n");
  for (const line of metaLines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");
      meta[key] = value;
    }
  }

  return { meta, body: match[2] };
}

function simpleMarkdownToHTML(md: string): string {
  let html = "";
  const lines = md.split("\n");
  let inCodeBlock = false;
  let codeBlockContent = "";
  let codeBlockLang = "";
  let listItems: string[] = [];
  let inList = false;
  let inParagraph = false;
  let paragraphText = "";

  function flushParagraph() {
    if (inParagraph && paragraphText.trim()) {
      html += `<p>${inlineFormat(paragraphText.trim())}</p>`;
    }
    inParagraph = false;
    paragraphText = "";
  }

  function flushList() {
    if (inList && listItems.length) {
      html += "<ul>";
      for (const item of listItems) {
        html += `<li>${inlineFormat(item)}</li>`;
      }
      html += "</ul>";
    }
    inList = false;
    listItems = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inCodeBlock) {
      if (line.trim().startsWith("```")) {
        inCodeBlock = false;
        html += '<pre><code class="language-' + codeBlockLang + '">' + escapeHTML(codeBlockContent) + "</code></pre>";
        codeBlockContent = "";
        codeBlockLang = "";
        continue;
      }
      codeBlockContent += line + "\n";
      continue;
    }

    if (line.trim().startsWith("```")) {
      const parts = line.trim().split(/`{3}/);
      codeBlockLang = parts[1] ? parts[1].trim() : "";
      inCodeBlock = true;
      codeBlockContent = "";
      flushParagraph();
      flushList();
      continue;
    }

    // Raw HTML passthrough (for <video>, <iframe>, custom embeds)
    if (line.trim().startsWith("<")) {
      flushParagraph();
      flushList();
      html += line.trim() + "\n";
      continue;
    }

    // Video embed — %%video src="https://..."%% or YouTube %%video id="VIDEO_ID"%%
    const videoMatch = line.trim().match(/^%%video(?:\s+(?:src|url)=["']([^"']+)["']|\s+id=["']([^"']+)["'])?%%$/);
    if (videoMatch) {
      flushParagraph();
      flushList();
      const src = videoMatch[1];
      const vid = videoMatch[2];
      if (vid) {
        html += `<div class="my-6"><div class="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10"><iframe class="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/${escapeHTML(vid)}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div></div>\n`;
      } else if (src) {
        html += `<div class="my-6"><video class="w-full rounded-xl border border-white/10 bg-black" controls playsinline preload="metadata"><source src="${escapeHTML(src)}" type="video/mp4" />Your browser does not support video.</video></div>\n`;
      }
      continue;
    }

    // Standalone image line
    const imgMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (imgMatch) {
      flushParagraph();
      flushList();
      html += `<figure class="my-6"><img src="${escapeHTML(imgMatch[2])}" alt="${escapeHTML(imgMatch[1] || "")}" loading="lazy" class="w-full rounded-xl border border-white/10" />${imgMatch[3] ? `<figcaption class="text-[10px] font-mono text-white/30 text-center mt-2">${escapeHTML(imgMatch[3])}</figcaption>` : ""}</figure>\n`;
      continue;
    }

    if (line.trim().startsWith("---") || line.trim().startsWith("***")) {
      flushParagraph();
      flushList();
      html += '<hr class="my-8 border-white/5" />';
      continue;
    }

    const h1Match = line.match(/^# (.+)$/);
    if (h1Match) {
      flushParagraph();
      flushList();
      html += '<h1 class="text-3xl font-mono text-white tracking-tight mt-8 mb-4">' + inlineFormat(h1Match[1]) + "</h1>";
      continue;
    }

    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      flushParagraph();
      flushList();
      html += '<h2 class="text-xl font-mono text-neon-400 tracking-wider mt-8 mb-3">' + inlineFormat(h2Match[1]) + "</h2>";
      continue;
    }

    const h3Match = line.match(/^### (.+)$/);
    if (h3Match) {
      flushParagraph();
      flushList();
      html += '<h3 class="text-lg font-mono text-white/80 mt-6 mb-2">' + inlineFormat(h3Match[1]) + "</h3>";
      continue;
    }

    const ulMatch = line.match(/^- (.+)$/);
    if (ulMatch) {
      flushParagraph();
      listItems.push(ulMatch[1]);
      inList = true;
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }

    if (inList) {
      flushList();
    }

    if (!inParagraph) {
      inParagraph = true;
      paragraphText = line;
    } else {
      paragraphText += " " + line;
    }
  }

  flushParagraph();
  flushList();

  if (inCodeBlock) {
    html += '<pre><code class="language-' + codeBlockLang + '">' + escapeHTML(codeBlockContent) + "</code></pre>";
  }

  return html;
}

function inlineFormat(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, '<img src="$2" alt="$1" loading="lazy" class="rounded-lg border border-white/10 my-2" />')
    .replace(/`([^`]+)`/g, '<code class="text-neon-400 bg-neon-400/10 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-neon-400 hover:underline">$1</a>');
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function parsePost(content: string): { meta: Record<string, string>; body: string } {
  return parseFrontmatter(content);
}

export function renderMarkdown(md: string): string {
  return simpleMarkdownToHTML(md);
}

export function getReadingTime(md: string): number {
  const text = md.replace(/^---[\s\S]*?---/, "").trim();
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}
