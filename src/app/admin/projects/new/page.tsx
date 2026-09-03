"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      slug: formData.get("slug"),
      title: formData.get("title"),
      tag: formData.get("tag"),
      repo: formData.get("repo"),
      description: formData.get("description"),
      tech: (formData.get("tech") as string).split(",").map(t => t.trim()),
      color: formData.get("color"),
      url: formData.get("url") || null,
      role: formData.get("role"),
      year: formData.get("year"),
      highlights: (formData.get("highlights") as string).split("\n").filter(Boolean),
      process: (formData.get("process") as string).split("\n").filter(Boolean),
      outcome: formData.get("outcome"),
      metrics: (formData.get("metrics") as string).split("\n").filter(Boolean),
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/projects");
    } else {
      alert("Failed to save project");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-mono text-white mb-8">New Project</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Simplified form for brevity, add all fields */}
        <input name="slug" placeholder="Slug" className="w-full bg-terminal-900 p-2 text-white" required />
        <input name="title" placeholder="Title" className="w-full bg-terminal-900 p-2 text-white" required />
        <input name="tag" placeholder="Tag" className="w-full bg-terminal-900 p-2 text-white" required />
        <input name="repo" placeholder="Repo" className="w-full bg-terminal-900 p-2 text-white" required />
        <textarea name="description" placeholder="Description" className="w-full bg-terminal-900 p-2 text-white" required />
        <input name="tech" placeholder="Tech (comma separated)" className="w-full bg-terminal-900 p-2 text-white" />
        <input name="color" placeholder="Color (#hex)" className="w-full bg-terminal-900 p-2 text-white" />
        <input name="url" placeholder="URL" className="w-full bg-terminal-900 p-2 text-white" />
        <input name="role" placeholder="Role" className="w-full bg-terminal-900 p-2 text-white" />
        <input name="year" placeholder="Year" className="w-full bg-terminal-900 p-2 text-white" />
        <textarea name="highlights" placeholder="Highlights (new line per item)" className="w-full bg-terminal-900 p-2 text-white" />
        <textarea name="process" placeholder="Process (new line per item)" className="w-full bg-terminal-900 p-2 text-white" />
        <textarea name="outcome" placeholder="Outcome" className="w-full bg-terminal-900 p-2 text-white" />
        <textarea name="metrics" placeholder="Impact metrics (new line per item, e.g. 100% E2E Encrypted)" className="w-full bg-terminal-900 p-2 text-white" />
        <button type="submit" className="btn-neon w-full" disabled={loading}>{loading ? "Saving..." : "Save Project"}</button>
      </form>
    </div>
  );
}
