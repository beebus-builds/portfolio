"use client";

import { useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("#4af0ff");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPublishing(true);

    const tagArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const excerpt = content.slice(0, 160).replace(/[#*]/g, "").trim();

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, tags: tagArr, color, excerpt, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");

      setPublished(true);
      setTimeout(() => setPublished(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish post");
    } finally {
      setPublishing(false);
    }
  }

  function updatePreview() {
    setPreview(true);
  }

  function insertAtCursor(snippet: string) {
    setContent((prev) => (prev ? `${prev}\n\n${snippet}\n` : snippet));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono text-white">Write a Post</h1>
          <p className="text-xs font-mono text-white/30 mt-1">Compose in markdown, then publish it live</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs font-mono text-neon-400 hover:underline">
            Manage Posts →
          </Link>
          <Link href="/blog" className="text-xs font-mono text-neon-400 hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </div>

      <form onSubmit={handlePublish} className="space-y-6">
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-transparent text-white font-mono text-lg border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
            placeholder="Your post title"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none"
            />
          </div>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
              placeholder="Next.js, Design"
            />
            <p className="text-[10px] text-white/20 mt-2">Comma-separated</p>
          </div>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-white/50">{color}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={updatePreview}
            className="btn-ghost text-xs"
          >
            {preview ? "Hide Preview" : "Preview"}
          </button>
        </div>

        {preview && (
          <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
            <div
              className="text-sm font-mono text-white/70 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderLivePreview(content) }}
            />
          </div>
        )}

        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block">Content (Markdown)</label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => insertAtCursor('![Image description](/images/your-image.jpg "Optional caption")')}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all"
              >
                + Image
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor('%%video src="/videos/your-video.mp4"%%')}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all"
              >
                + Video (mp4)
              </button>
              <button
                type="button"
                onClick={() => insertAtCursor('%%video id="YOUTUBE_VIDEO_ID"%%')}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all"
              >
                + YouTube
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (preview) updatePreview();
            }}
            required
            rows={20}
            className="w-full bg-transparent text-white font-mono text-sm border border-white/10 rounded-lg p-4 focus:border-neon-400/30 outline-none placeholder:text-white/15 resize-y"
            placeholder="Write your post here... Use **bold**, *italic*, `code`, ```code blocks```, ## headings"
          />
          <p className="text-[10px] font-mono text-white/20 mt-2">
            Images: <code>{"![alt](url)"}</code> · Videos: <code>{"%%video src=\"url\"%%"}</code> · YouTube: <code>{"%%video id=\"ID\"%%"}</code>
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-white/20">
            Published posts appear instantly on /blog
          </p>
          {error && <p className="text-[10px] font-mono text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!title || !content || publishing}
            className="btn-neon text-xs"
          >
            {published ? "✓ Published!" : publishing ? "Publishing…" : "↑ Publish Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

function renderLivePreview(md: string): string {
  if (!md) return '<p class="text-white/20">Start writing to see a preview...</p>';
  return simplePreview(md);
}

function simplePreview(md: string): string {
  let html = md
    .replace(/%%video(?:\s+src=["']([^"']+)["']|\s+id=["']([^"']+)["'])?%%/g, (_m, src, vid) =>
      vid
        ? '<div class="my-3"><div class="relative w-full aspect-video rounded-lg overflow-hidden bg-black"><iframe class="absolute inset-0 w-full h-full" src="https://www.youtube.com/embed/' + vid + '" frameborder="0" allowfullscreen></iframe></div></div>'
        : src
          ? '<div class="my-3"><video class="w-full rounded-lg bg-black" controls playsinline preload="metadata"><source src="' + src + '" type="video/mp4" /></video></div>'
          : ""
    )
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, '<figure class="my-3"><img src="$2" alt="$1" class="w-full rounded-lg border border-white/10" /><figcaption class="text-[10px] font-mono text-white/30 mt-1">$3</figcaption></figure>')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-mono text-white/80 mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-mono text-neon-400 mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-mono text-white mb-3">$1</h1>')
    .replace(/`([^`]+)`/g, '<code class="text-neon-400 bg-neon-400/10 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />");

  if (html.startsWith("<h") || html.startsWith("<figure") || html.startsWith("<div")) {
    html = "<p>" + html;
  }
  if (!html.startsWith("<p>") && !html.startsWith("<h") && !html.startsWith("<figure") && !html.startsWith("<div")) {
    html = "<p>" + html;
  }

  return html;
}