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

  const [top, ...rest] = filtered;

  return (
    <>
      <div className="mb-10 space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md bg-terminal-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-mono text-white/70 outline-none focus:border-neon-400/40 placeholder:text-white/20"
          placeholder="Search posts…"
        />
        {allTags.length > 0 && (
          <div className="tab-strip">
            <button onClick={() => setTag(null)} className={`tab-chip ${tag === null ? "active" : ""}`}>
              all
            </button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setTag(tag === t ? null : t)} className={`tab-chip ${tag === t ? "active" : ""}`}>
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
        <div className="space-y-10">
          {/* Top result — larger treatment, image bleeds behind text on desktop */}
          <Link
            href={`/blog/${top.slug}`}
            className="neon-card group block border border-white/5 rounded-xl overflow-hidden bg-terminal-900/50 hover:border-white/10 transition-all"
          >
            <div className="md:grid md:grid-cols-[1.1fr_1fr]">
              {top.cover ? (
                <div className="relative aspect-[16/9] md:aspect-auto overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={top.cover}
                    alt={top.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="hidden md:flex items-center justify-center border-r border-white/5 p-8">
                  <span className="font-mono text-6xl text-white/5">{top.title.charAt(0)}</span>
                </div>
              )}
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <p className="comment-label mb-3">latest</p>
                <h2 className="text-xl md:text-2xl font-mono text-white tracking-wide group-hover:text-neon-400 transition-colors mb-3">
                  {top.title}
                </h2>
                <p className="text-sm font-mono text-white/40 leading-relaxed mb-4">{top.excerpt}</p>
                <div className="flex items-center gap-3 flex-wrap text-[10px] font-mono text-white/25">
                  <span>{top.date}</span>
                  <span>·</span>
                  <span>{top.readingTime} min read</span>
                  <span>·</span>
                  <span>{top.views ?? 0} views</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Remaining posts — compact numbered feed */}
          {rest.length > 0 && (
            <div className="gutter gutter-n divide-y divide-white/5 border-t border-white/5">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="col-start-2 group flex items-start justify-between gap-4 py-5"
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-mono text-white/85 group-hover:text-neon-400 transition-colors truncate">
                      {post.title}
                    </h3>
                    <p className="text-sm font-mono text-white/35 leading-relaxed mt-1.5 line-clamp-2 max-w-lg">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {post.tags.map((t) => (
                        <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded border border-white/10 text-white/30 bg-terminal-800/50">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-white/20 shrink-0 mt-1">{post.date}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
