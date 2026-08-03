import Link from "next/link";
import PageShell from "@/components/PageShell";
import { projects } from "@/lib/projects";

export const metadata = {
  title: "Surprise Me",
  description: "A random project from the collection.",
};

export default function RandomPage() {
  const project = projects[Math.floor(Math.random() * projects.length)];

  return (
    <PageShell title="Random" subtitle="A random project from the collection.">
      <section className="mb-16 thread">
        <div className="section-accent" />
        <div className="text-center">
          <span className="shape-circle mb-4 inline-block" style={{ background: project.color }} />
          <h1 className="text-3xl md:text-4xl font-mono text-white tracking-tight leading-tight">
            Surprise Me
          </h1>
          <p className="text-sm font-mono text-white/40 mt-2">Every refresh reveals a different project.</p>
        </div>
      </section>

      <div className="neon-card border border-white/5 rounded-2xl p-8 bg-terminal-900/50" style={{ borderLeft: `3px solid ${project.color}` }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: project.color, backgroundColor: `${project.color}20` }}>{project.tag}</span>
        </div>
        <h2 className="text-xl font-mono text-white tracking-wide mb-3">{project.title}</h2>
        <p className="text-sm font-mono text-white/40 leading-relaxed mb-6">{project.description}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/projects/${project.slug}`} className="btn-neon text-xs">
            Read the Case Study →
          </Link>
          <Link href="/projects" className="btn-ghost text-xs">
            View All Projects →
          </Link>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/random" className="text-xs font-mono text-neon-400/60 hover:text-neon-400 transition-colors">
          ↻ Try another
        </Link>
      </div>
    </PageShell>
  );
}