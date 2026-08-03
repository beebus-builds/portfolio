"use client";

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
  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
      <section className="mb-16 thread">
        <div className="section-accent" />
        <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
          Technologies I Work With
        </h1>
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          A breakdown of the tools, languages, and frameworks I use daily — from frontend to backend
          and everything in between.
        </p>
      </section>
      </ScrollTrigger>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">By Category</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.name} className="neon-card border border-white/5 rounded-xl p-6">
              <h3 className="text-sm font-mono tracking-wider mb-5 uppercase" style={{ color: cat.color }}>{cat.name}</h3>
              <div className="flex flex-col gap-3">
                {cat.skills.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="shape-dot" style={{ background: cat.color }} />
                      <span className="text-sm font-mono text-white/60">{s.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono ${levelColor(s.level)}`}>{s.level}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Proficiency</h2>
        <div className="neon-card border border-white/5 rounded-xl p-6">
          <div className="space-y-4">
            {proficiencies.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm font-mono mb-1.5">
                  <span className="text-white/55">{s.name}</span>
                  <span className="text-white/30">{s.level}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.level}%` }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-neon-400 to-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      <section>
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Currently Learning</h2>
        <div className="neon-card border border-white/5 rounded-xl p-6">
          <div className="flex flex-wrap gap-3 mb-4">
            {currentlyLearning.map((item) => (
              <span key={item} className="text-sm font-mono text-white/45 border border-white/10 px-3 py-1.5 rounded-lg bg-terminal-800/50">{item}</span>
            ))}
          </div>
          <p className="text-sm font-mono text-white/30 leading-relaxed">
            The stack keeps growing. I believe in learning by building — every project adds a new tool to the belt.
          </p>
        </div>
      </section>
    </PageShell>
  );
}