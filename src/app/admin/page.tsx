"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface PostItem {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  readingTime: number;
}

export default function AdminPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/posts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load posts");
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (slug: string) => {
    if (!window.confirm(`Delete "${slug}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } catch {
      setError("Failed to delete post");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono text-white">Manage Posts</h1>
          <p className="text-xs font-mono text-white/30 mt-1">All published posts</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/new" className="btn-neon text-xs">+ New Post</Link>
          <Link href="/blog" className="text-xs font-mono text-neon-400 hover:underline">← Blog</Link>
        </div>
      </div>

      {error && <p className="text-xs font-mono text-red-400 mb-4">{error}</p>}

      {loading ? (
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/40">Loading posts…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/50">No posts yet.</p>
          <Link href="/admin/new" className="inline-block mt-4 text-xs font-mono text-neon-400 border border-neon-400/30 rounded-lg px-4 py-2 hover:bg-neon-400/10 transition-all">
            Write your first post →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.slug} className="neon-card flex items-center justify-between gap-4 border border-white/5 rounded-xl p-5 bg-terminal-900/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-neon-400/60">{post.date}</span>
                  {post.tags.map((t) => (
                    <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/30 bg-terminal-800/50">{t}</span>
                  ))}
                </div>
                <h2 className="text-sm font-mono text-white mt-1 truncate">{post.title}</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/blog/${post.slug}`} className="text-[10px] font-mono text-neon-400 hover:underline">View</Link>
                <Link href={`/admin/edit/${post.slug}`} className="text-[10px] font-mono text-white/40 hover:text-neon-400 transition-colors">Edit</Link>
                <button onClick={() => handleDelete(post.slug)} className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors cursor-pointer">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}