"use client";

import PostEditor from "@/components/PostEditor";

export const dynamic = "force-dynamic";

export default function NewPostPage() {
  async function handlePublish(payload: Parameters<Parameters<typeof PostEditor>[0]["onSubmit"]>[0]) {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to publish");
  }

  return (
    <PostEditor
      mode="create"
      publishLabel="↑ Publish Post"
      savedLabel="✓ Published!"
      onSubmit={handlePublish}
    />
  );
}
