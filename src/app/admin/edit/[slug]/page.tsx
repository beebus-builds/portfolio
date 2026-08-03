"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [tags, setTags] = useState("");
  const [color, setColor] = useState("#4af0ff");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Post not found");
        const p = data.post;
        setTitle(p.title);
        setDate(p.date);
        setTags(Array.isArray(p.tags) ? p.tags.join(", ") : "");
        setColor(p.color);
        setContent(p.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const tagArr = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const excerpt = content.slice(0, 160).replace(/[#*]/g, "").trim();
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, tags: tagArr, color, excerpt, content, slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    }
  }

  function insertAtCursor(snippet: string) {
    setContent((prev) => (prev ? `${prev}\n\n${snippet}\n` : snippet));
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/40">Loading post…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono text-white">Edit Post</h1>
          <p className="text-xs font-mono text-white/30 mt-1">slug: <span className="text-neon-400">{slug}</span></p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs font-mono text-neon-400 hover:underline">← Manage Posts</Link>
        </div>
      </div>

      {error && <p className="text-xs font-mono text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-transparent text-white font-mono text-lg border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required
              className="w-full bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none" />
          </div>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Tags</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
              placeholder="Comma-separated" />
          </div>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-white/10 bg-transparent cursor-pointer" />
              <span className="text-xs font-mono text-white/50">{color}</span>
            </div>
          </div>
        </div>

        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block">Content (Markdown)</label>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => insertAtCursor('![Image description](/images/your-image.jpg "Optional caption")')}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all">+ Image</button>
              <button type="button" onClick={() => insertAtCursor('%%video src="/videos/your-video.mp4"%%')}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all">+ Video</button>
              <button type="button" onClick={() => insertAtCursor('%%video id="YOUTUBE_VIDEO_ID"%%')}
                className="text-[10px] font-mono text-white/40 border border-white/10 rounded-lg px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all">+ YouTube</button>
            </div>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={20}
            className="w-full bg-transparent text-white font-mono text-sm border border-white/10 rounded-lg p-4 focus:border-neon-400/30 outline-none placeholder:text-white/15 resize-y" />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-white/20">
            Saving updates the live post immediately
          </p>
          <button type="submit" disabled={!title || !content} className="btn-neon text-xs">
            {saved ? "✓ Saved!" : "↑ Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}