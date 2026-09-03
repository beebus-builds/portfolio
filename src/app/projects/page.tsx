"use client";

import Link from "next/link";
import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";
import TiltCard from "@/components/projects/TiltCard";
import { useState, useEffect } from "react";
import type { ProjectRow } from "@/lib/db";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load projects");
        setLoading(false);
      });
  }, []);

  const tags = ["all", ...new Set(projects.map((p) => p.tag))];
  const filtered = filter === "all" ? projects : projects.filter((p) => p.tag === filter);
  const [featured, runnerUp, ...remainder] = filtered;

  if (loading) {
    return (
      <PageShell>
        <div className="term-window border border-white/5 rounded-xl overflow-hidden">
          <div className="term-titlebar">
            <span className="term-dot" /><span className="term-dot" /><span className="term-dot" />
            <span className="term-path">~/projects --loading</span>
          </div>
          <div className="term-body space-y-4">
            <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
            <div className="bento">
              {[1, 2, 3].map((i) => (
                <div key={i} className="neon-card p-6 rounded-xl border border-white/5 bg-terminal-900/30 animate-pulse">
                  <div className="w-10 h-10 rounded-lg bg-white/5 mb-4" />
                  <div className="h-3 w-3/4 bg-white/5 rounded mb-2" />
                  <div className="h-3 w-full bg-white/[0.03] rounded mb-1" />
                  <div className="h-3 w-2/3 bg-white/[0.03] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="text-center py-20 font-mono text-red-400">{error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
        <section className="mb-14">
          <p className="comment-label mb-3">projects/index.tsx</p>
          <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
            Things I&apos;ve Built
          </h1>
          <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
            A collection of projects spanning full-stack applications, WordPress development, and open source tools.
            Each project reflects a problem solved and something learned.
          </p>
        </section>
      </ScrollTrigger>

      {/* Filter rendered as editor tabs rather than pill buttons */}
      <ScrollTrigger animation="fade-up" delay={100}>
        <section className="mb-12">
          <div className="tab-strip">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`tab-chip ${filter === tag ? "active" : ""}`}
              >
                {tag === "all" ? "all-projects" : tag}
              </button>
            ))}
          </div>
        </section>
      </ScrollTrigger>

      {/* Featured pair — large + medium, asymmetric */}
      <section className="mb-16">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Featured Work</h2>
        <div className="bento">
          {featured && (
            <TiltCard accent={featured.color} className="bento-lg">
            <div className="neon-card bento-lg border border-white/5 rounded-xl p-6 md:p-8 bg-terminal-900/50 flex flex-col justify-between h-full">
              <div>
                <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${featured.color}10` }}>
                    <span className="shape-line" style={{ width: 24, background: `linear-gradient(90deg, ${featured.color}80, transparent)` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Link href={`/projects/${featured.slug}`}>
                        <h3 className="text-xl font-mono text-white tracking-wide hover:text-neon-400 transition-colors">{featured.title}</h3>
                      </Link>
                      <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: featured.color, backgroundColor: `${featured.color}20` }}>{featured.tag}</span>
                    </div>
                    <p className="text-sm font-mono text-white/40 leading-relaxed">{featured.description}</p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Link href={`/projects/${featured.slug}`} className="inline-block text-xs font-mono text-neon-400/60 hover:text-neon-400 transition-colors">
                    Case Study →
                  </Link>
                  {featured.url && (
                    <a href={featured.url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-mono text-white/30 hover:text-white/60 transition-colors">
                      Live Demo →
                    </a>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-white/5">
                  {featured.tech.map((t) => (
                    <span key={t} className="text-[10px] font-mono text-white/30 border border-white/5 px-2 py-0.5 rounded bg-terminal-800/50">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            </TiltCard>
          )}
          {runnerUp && (
            <TiltCard accent={runnerUp.color} max={12} className="bento-sm">
            <Link href={`/projects/${runnerUp.slug}`} className="neon-card block border border-white/5 rounded-xl p-6 bg-terminal-900/50 h-full">
              <div className="flex items-start gap-3 mb-3">
                <span className="shape-square" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-mono text-white tracking-wide truncate">{runnerUp.title}</h3>
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: runnerUp.color }}>{runnerUp.tag}</span>
                </div>
              </div>
              <p className="text-xs font-mono text-white/35 leading-relaxed line-clamp-4">{runnerUp.description}</p>
            </Link>
            </TiltCard>
          )}
          {!featured && (
            <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center bento-lg">
              <p className="text-sm font-mono text-white/40">No projects in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Remaining projects — even grid */}
      <section className="mb-16">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">All Projects</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {remainder.map((p) => (
            <TiltCard key={p.title} accent={p.color} max={9}>
            <Link href={`/projects/${p.slug}`} className="neon-card block border border-white/5 rounded-xl p-5 bg-terminal-900/50 h-full">
              <div className="flex items-center gap-3 mb-3">
                <span className="shape-dot" style={{ background: p.color }} />
                <h3 className="text-sm font-mono text-white tracking-wide truncate">{p.title}</h3>
              </div>
              <p className="text-xs font-mono text-white/35 leading-relaxed line-clamp-3 mb-3">{p.description}</p>
              <div className="flex flex-wrap gap-1">
                {p.tech.slice(0, 3).map((t) => (
                  <span key={t} className="text-[9px] font-mono text-white/25 border border-white/5 px-1.5 py-0.5 rounded bg-terminal-800/50">{t}</span>
                ))}
              </div>
            </Link>
            </TiltCard>
          ))}
          {remainder.length === 0 && filtered.length > 0 && (
            <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50 text-center col-span-3">
              <p className="text-sm font-mono text-white/40">No more projects in this category.</p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm font-mono text-white/50">
              Want to see more? Check out my{" "}
              <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer" className="text-neon-400 hover:underline">GitHub</a>.
            </p>
            <Link href="/contact" className="btn-ghost text-xs">Get in Touch →</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
