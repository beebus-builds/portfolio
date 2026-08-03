"use client";

import Link from "next/link";
import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";
import { useState } from "react";
import { projects } from "@/lib/projects";

export default function ProjectsPage() {
  const [filter, setFilter] = useState<string>("all");
  const tags = ["all", ...new Set(projects.map((p) => p.tag))];
  const filtered = filter === "all" ? projects : projects.filter((p) => p.tag === filter);

  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
      <section className="mb-16 thread">
        <div className="section-accent" />
        <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
          Things I&apos;ve Built
        </h1>
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          A collection of projects spanning full-stack applications, WordPress development, and open source tools.
          Each project reflects a problem solved and something learned.
        </p>
      </section>
      </ScrollTrigger>

      <ScrollTrigger animation="fade-up" delay={100}>
      <section className="mb-8">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-all ${
                filter === tag
                  ? "border-neon-400/40 bg-neon-400/10 text-neon-400"
                  : "border-white/10 bg-transparent text-white/30 hover:text-white/60"
              }`}
            >
              {tag === "all" ? "All" : tag}
            </button>
          ))}
        </div>
      </section>
      </ScrollTrigger>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Featured Work</h2>
        <div className="grid-asym">
          {filtered.slice(0, 1).map((p) => (
            <div key={p.title} className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50">
              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}10` }}>
                  <span className="shape-line" style={{ width: 24, background: `linear-gradient(90deg, ${p.color}80, transparent)` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Link href={`/projects/${p.slug}`}>
                      <h3 className="text-xl font-mono text-white tracking-wide group-hover:text-neon-400 transition-colors">{p.title}</h3>
                    </Link>
                    <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ color: p.color, backgroundColor: `${p.color}20` }}>{p.tag}</span>
                  </div>
                  <p className="text-sm font-mono text-white/40 leading-relaxed">{p.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Link href={`/projects/${p.slug}`} className="inline-block text-xs font-mono text-neon-400/60 hover:text-neon-400 transition-colors">
                      Case Study →
                    </Link>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs font-mono text-white/30 hover:text-white/60 transition-colors">
                        Live Demo →
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.tech.map((t) => (
                  <span key={t} className="text-[10px] font-mono text-white/30 border border-white/5 px-2 py-0.5 rounded bg-terminal-800/50">{t}</span>
                ))}
              </div>
            </div>
          ))}
          {filtered.slice(1, 2).map((p) => (
            <Link key={p.title} href={`/projects/${p.slug}`} className="neon-card block border border-white/5 rounded-xl p-6 bg-terminal-900/50">
              <div className="flex items-start gap-3 mb-3">
                <span className="shape-square" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-mono text-white tracking-wide truncate">{p.title}</h3>
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: p.color }}>{p.tag}</span>
                </div>
              </div>
              <p className="text-xs font-mono text-white/35 leading-relaxed line-clamp-3">{p.description}</p>
            </Link>
          ))}
          {filtered.slice(0, 2).length === 0 && (
            <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center col-span-2">
              <p className="text-sm font-mono text-white/40">No projects in this category yet.</p>
            </div>
          )}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">All Projects</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {filtered.slice(2).map((p) => (
            <Link key={p.title} href={`/projects/${p.slug}`} className="neon-card block border border-white/5 rounded-xl p-5 bg-terminal-900/50">
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
          ))}
          {filtered.slice(2).length === 0 && filtered.length > 0 && (
            <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50 text-center col-span-3">
              <p className="text-sm font-mono text-white/40">No more projects in this category.</p>
            </div>
          )}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="thread-dot">
        <div className="section-accent" />
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
      </div>
    </PageShell>
  );
}