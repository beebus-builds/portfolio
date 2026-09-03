"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface ProjectItem {
  slug: string;
  title: string;
  tag: string;
  year: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load projects");
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (slug: string) => {
    if (!window.confirm(`Delete project "${slug}"?`)) return;
    try {
      const res = await fetch(`/api/projects/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setProjects((prev) => prev.filter((p) => p.slug !== slug));
    } catch {
      setError("Failed to delete project");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-mono text-white">Manage Projects</h1>
          <p className="text-xs font-mono text-white/30 mt-1">All database projects</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/projects/new" className="btn-neon text-xs">+ New Project</Link>
          <Link href="/admin" className="text-xs font-mono text-white/40 hover:text-white transition-colors">← Admin</Link>
        </div>
      </div>

      {error && <p className="text-xs font-mono text-red-400 mb-4">{error}</p>}

      {loading ? (
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/40">Loading projects…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.slug} className="neon-card flex items-center justify-between gap-4 border border-white/5 rounded-xl p-5 bg-terminal-900/50">
              <div>
                <h2 className="text-sm font-mono text-white">{project.title}</h2>
                <p className="text-[10px] font-mono text-white/40">{project.tag} • {project.year}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/projects/edit/${project.slug}`} className="text-[10px] font-mono text-white/40 hover:text-neon-400">Edit</Link>
                <button onClick={() => handleDelete(project.slug)} className="text-[10px] font-mono text-red-400 hover:text-red-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
