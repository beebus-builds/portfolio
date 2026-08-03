"use client";

import { useState } from "react";
import PageShell from "@/components/PageShell";

const snippets = [
  {
    title: "Terminal-style greeting",
    lang: "tsx",
    code: "export default function Greeting({ name }) {\n  return (\n    <div className=\"font-mono text-neon-400\">\n      {`Hello, ${name}. Welcome to the terminal.`}\n    </div>\n  );\n}",
  },
  {
    title: "CSS accent line",
    lang: "css",
    code: `.accent {
  position: relative;
}
.accent::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    180deg,
    rgba(74, 240, 255, 0.3),
    transparent
  );
}`,
  },
  {
    title: "Markdown parser",
    lang: "ts",
    code: `function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>');
}`,
  },
  {
    title: "CSS thread connection",
    lang: "css",
    code: `.thread {
  position: relative;
}
.thread::before {
  content: '';
  position: absolute;
  left: 24px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(74, 240, 255, 0.15),
    transparent
  );
}`,
  },
];

function highlight(code: string): string {
  let html = code;
  const kw = /\b(export|import|from|return|const|let|var|function|async|await|if|else|for|of|in|new|class|extends|type|interface|true|false|null|undefined)\b/g;
  html = html.replace(kw, '<span style="color:var(--color-neon-400)">$1</span>');
  const str = /(`[^`]+`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
  html = html.replace(str, '<span style="color:var(--color-gold-400)">$1</span>');
  const comment = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
  html = html.replace(comment, '<span style="color:var(--color-terminal-700); opacity:0.6; font-style:italic">$1</span>');
  const prop = /\.(\w[\w-]*)/g;
  html = html.replace(prop, '.<span style="color:var(--color-magenta-400)">$1</span>');
  const hex = /(#[0-9a-fA-F]{3,8})/g;
  html = html.replace(hex, '<span style="color:#ff6b35">$1</span>');
  return html;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] font-mono text-white/30 hover:text-neon-400 transition-colors"
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}

export default function CodePage() {
  return (
    <PageShell title="Code" subtitle="A look at how I write things.">
      <section className="mb-12 thread">
        <div className="section-accent" />
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          Small code snippets from the portfolio — the things I&apos;m proud of.
        </p>
      </section>

      <div className="space-y-8">
        {snippets.map((snippet) => (
          <section key={snippet.title}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-mono text-white tracking-wide">{snippet.title}</h3>
              <span className="text-[9px] font-mono text-white/25 bg-white/5 px-2 py-0.5 rounded">{snippet.lang}</span>
              <div className="flex-1" />
              <CopyButton code={snippet.code} />
            </div>
            <div className="neon-card border border-white/5 rounded-xl overflow-hidden">
              <pre className="p-5 text-sm font-mono text-white/60 overflow-x-auto leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: highlight(snippet.code) }} />
              </pre>
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}