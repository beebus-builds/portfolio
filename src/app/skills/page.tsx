"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";

const categories = [
  {
    name: "Frontend",
    color: "#4af0ff",
    skills: [
      { name: "React", level: "Advanced" },
      { name: "Next.js", level: "Advanced" },
      { name: "TypeScript", level: "Advanced" },
      { name: "Tailwind CSS", level: "Expert" },
      { name: "Three.js", level: "Intermediate" },
      { name: "HTML / CSS", level: "Expert" },
    ],
  },
  {
    name: "Backend",
    color: "#ffd700",
    skills: [
      { name: "Node.js", level: "Advanced" },
      { name: "REST APIs", level: "Advanced" },
      { name: "PostgreSQL", level: "Intermediate" },
      { name: "Python", level: "Intermediate" },
      { name: "Git", level: "Advanced" },
    ],
  },
  {
    name: "Tools & Platforms",
    color: "#ff4af0",
    skills: [
      { name: "VS Code", level: "Expert" },
      { name: "Figma", level: "Intermediate" },
      { name: "Linux CLI", level: "Advanced" },
      { name: "WordPress", level: "Advanced" },
      { name: "Vercel", level: "Intermediate" },
      { name: "Agile / Scrum", level: "Intermediate" },
    ],
  },
];

const proficiencies = [
  { name: "Tailwind CSS", level: 90 },
  { name: "React / Next.js", level: 85 },
  { name: "TypeScript", level: 80 },
  { name: "Node.js", level: 70 },
  { name: "Three.js", level: 60 },
  { name: "PostgreSQL", level: 55 },
  { name: "Python", level: 50 },
];

const currentlyLearning = ["Rust", "Docker", "System Design", "GraphQL", "AWS"];

const levelColor = (level: string) => {
  if (level === "Expert") return "text-neon-400";
  if (level === "Advanced") return "text-gold-400";
  return "text-white/50";
};

export default function SkillsPage() {
  const [active, setActive] = useState(0);
  const cat = categories[active];

  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
        <section className="mb-16">
          <p className="comment-label mb-3">skills/stack.ts</p>
          <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
            Technologies I Work With
          </h1>
          <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
            A breakdown of the tools, languages, and frameworks I use daily — from frontend to backend
            and everything in between.
          </p>
        </section>
      </ScrollTrigger>

      {/* ─── By category ── tabbed panel instead of three equal cards ──── */}
      <section className="mb-16">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">By Category</h2>
        <div className="term-window">
          <div className="tab-strip px-2">
            {categories.map((c, i) => (
              <button
                key={c.name}
                onClick={() => setActive(i)}
                className={`tab-chip ${active === i ? "active" : ""}`}
                style={active === i ? { color: c.color, borderBottomColor: c.color } : undefined}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="term-body grid md:grid-cols-[1fr_auto] gap-8">
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {cat.skills.map((s) => (
                <div key={s.name} className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="shape-dot" style={{ background: cat.color }} />
                    <span className="text-sm font-mono text-white/65">{s.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono ${levelColor(s.level)}`}>{s.level}</span>
                </div>
              ))}
            </div>
            {/* side readout: category share */}
            <div className="hidden md:flex flex-col justify-center items-start md:border-l md:border-white/5 md:pl-8 shrink-0">
              <dt className="text-[10px] uppercase tracking-widest text-white/25 font-mono">Category</dt>
              <dd className="font-mono text-4xl mt-1" style={{ color: cat.color }}>
                {String(active + 1).padStart(2, "0")}
                <span className="text-white/15 text-lg">/{String(categories.length).padStart(2, "0")}</span>
              </dd>
              <p className="text-[11px] font-mono text-white/25 mt-2">{cat.skills.length} tools tracked</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Proficiency ── line-numbered gutter, code-review feel ─────── */}
      <section className="mb-16 offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Proficiency</h2>
        <div className="neon-card border border-white/5 rounded-xl p-6 md:p-8">
          <div className="gutter gutter-n">
            <div className="col-start-2 space-y-5">
              {proficiencies.map((s) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm font-mono mb-1.5">
                    <span className="text-white/55">{s.name}</span>
                    <span className="text-white/30">{s.level}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.15, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-neon-400 to-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Currently learning ── framed as an install queue ──────────── */}
      <section className="offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Currently Learning</h2>
        <div className="term-window">
          <div className="term-titlebar">
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-path">~/learning-queue.sh</span>
          </div>
          <div className="term-body">
            <p className="font-mono text-xs text-white/30 mb-5">
              <span className="text-neon-400/70">$</span> queue --status pending
            </p>
            <div className="flex flex-wrap gap-2.5 mb-6">
              {currentlyLearning.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 text-sm font-mono text-white/60 border border-white/10 px-3 py-1.5 rounded-lg bg-terminal-800/50">
                  <span className="diff-plus">+</span>
                  {item}
                </span>
              ))}
            </div>
            <p className="text-sm font-mono text-white/30 leading-relaxed border-t border-white/5 pt-5">
              The stack keeps growing. I believe in learning by building — every project adds a new tool to the belt.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
