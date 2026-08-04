"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default function EditPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<{
    title: string;
    date: string;
    tags: string[];
    color: string;
    content: string;
    cover?: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/posts/${slug}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Post not found");
        const p = data.post;
        setPost({
          title: p.title,
          date: p.date,
          tags: Array.isArray(p.tags) ? p.tags : [],
          color: p.color,
          content: p.content,
          cover: p.cover || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load post");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  async function handleSave(payload: Parameters<Parameters<typeof PostEditor>[0]["onSubmit"]>[0]) {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, slug }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save");
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

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/50">
            {error || "Post not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PostEditor
      mode="edit"
      initialSlug={slug}
      initialTitle={post.title}
      initialDate={post.date}
      initialTags={post.tags.join(", ")}
      initialColor={post.color}
      initialContent={post.content}
      initialCover={post.cover}
      publishLabel="↑ Save Changes"
      savedLabel="✓ Saved!"
      onSubmit={handleSave}
    />
  );
}
