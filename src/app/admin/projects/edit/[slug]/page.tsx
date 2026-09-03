"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ProjectForm {
  slug: string;
  title: string;
  tag: string;
  repo: string;
  description: string;
  tech: string;
  color: string;
  url: string;
  role: string;
  year: string;
  highlights: string;
  process: string;
  outcome: string;
  metrics: string;
}

const joinLines = (v: unknown): string => (Array.isArray(v) ? v.map(String).join("\n") : "");

export default function EditProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [form, setForm] = useState<ProjectForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projects/${slug}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Project not found");
        const p = data.project;
        setForm({
          slug: p.slug,
          title: p.title ?? "",
          tag: p.tag ?? "",
          repo: p.repo ?? "",
          description: p.description ?? "",
          tech: Array.isArray(p.tech) ? p.tech.join(", ") : "",
          color: p.color ?? "#4af0ff",
          url: p.url ?? "",
          role: p.role ?? "",
          year: p.year ?? "",
          highlights: joinLines(p.highlights),
          process: joinLines(p.process),
          outcome: p.outcome ?? "",
          metrics: joinLines(p.metrics),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const set = (key: keyof ProjectForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          tag: form.tag,
          repo: form.repo,
          description: form.description,
          tech: form.tech.split(",").map((t) => t.trim()).filter(Boolean),
          color: form.color || "#4af0ff",
          url: form.url.trim() || null,
          role: form.role,
          year: form.year,
          highlights: form.highlights.split("\n").map((t) => t.trim()).filter(Boolean),
          process: form.process.split("\n").map((t) => t.trim()).filter(Boolean),
          outcome: form.outcome,
          metrics: form.metrics.split("\n").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save project");
      router.push("/admin/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-sm font-mono text-white/40">Loading project…</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-sm font-mono text-red-400">{error || "Project not found"}</p>
        <Link href="/admin/projects" className="text-xs font-mono text-white/40">← Projects</Link>
      </div>
    );
  }

  const inputCls = "w-full bg-terminal-900 p-2 text-white";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-mono text-white mb-8">Edit Project — {form.slug}</h1>
      {error && <p className="text-xs font-mono text-red-400 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input value={form.title} onChange={set("title")} placeholder="Title" className={inputCls} required />
        <input value={form.tag} onChange={set("tag")} placeholder="Tag" className={inputCls} required />
        <input value={form.repo} onChange={set("repo")} placeholder="Repo" className={inputCls} required />
        <textarea value={form.description} onChange={set("description")} placeholder="Description" className={inputCls} required />
        <input value={form.tech} onChange={set("tech")} placeholder="Tech (comma separated)" className={inputCls} />
        <input value={form.color} onChange={set("color")} placeholder="Color (#hex)" className={inputCls} />
        <input value={form.url} onChange={set("url")} placeholder="URL" className={inputCls} />
        <input value={form.role} onChange={set("role")} placeholder="Role" className={inputCls} required />
        <input value={form.year} onChange={set("year")} placeholder="Year" className={inputCls} required />
        <textarea value={form.highlights} onChange={set("highlights")} placeholder="Highlights (new line per item)" className={inputCls} />
        <textarea value={form.process} onChange={set("process")} placeholder="Process (new line per item)" className={inputCls} />
        <textarea value={form.outcome} onChange={set("outcome")} placeholder="Outcome" className={inputCls} required />
        <textarea value={form.metrics} onChange={set("metrics")} placeholder="Impact metrics (new line per item)" className={inputCls} />
        <button type="submit" className="btn-neon w-full" disabled={saving}>{saving ? "Saving..." : "Save Project"}</button>
      </form>
    </div>
  );
}
