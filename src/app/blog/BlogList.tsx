"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BlogPost } from "@/lib/markdown";

export default function BlogList({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, query, tag]);

  return (
    <>
      <div className="mb-8 space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md bg-terminal-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-white/70 outline-none focus:border-neon-400/40 placeholder:text-white/20"
          placeholder="Search posts…"
        />
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTag(null)}
              className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-all ${
                tag === null
                  ? "border-neon-400/40 bg-neon-400/10 text-neon-400"
                  : "border-white/10 bg-transparent text-white/30 hover:text-white/60"
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? null : t)}
                className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-all ${
                  tag === t
                    ? "border-neon-400/40 bg-neon-400/10 text-neon-400"
                    : "border-white/10 bg-transparent text-white/30 hover:text-white/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/50">No posts match your search.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="neon-card block border border-white/5 rounded-xl p-6 bg-terminal-900/50 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-lg font-mono text-white tracking-wide group-hover:text-neon-400 transition-colors">
                  {post.title}
                </h2>
                <span className="text-[10px] font-mono text-white/20 shrink-0">{post.date}</span>
              </div>
              <p className="text-sm font-mono text-white/40 leading-relaxed mb-3">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {post.tags.map((t) => (
                  <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 text-white/30 bg-terminal-800/50">
                    {t}
                  </span>
                ))}
                <span className="text-[10px] font-mono text-white/20">{post.readingTime} min read</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
