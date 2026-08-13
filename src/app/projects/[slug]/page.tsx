import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import ScrollTrigger from "@/components/ScrollTrigger";
import { getProjectBySlug } from "@/lib/db";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  
  if (!project) notFound();

  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
        <section className="mb-16 thread">
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <Link href="/projects" className="text-xs font-mono text-white/30 hover:text-neon-400 transition-colors">
              ← Projects
            </Link>
            <span className="text-white/15">/</span>
            <span className="text-[10px] font-mono text-white/40">{project.slug}</span>
          </div>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="section-accent" />
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <h1 className="text-3xl md:text-4xl font-mono text-white tracking-tight leading-tight">
                  {project.title}
                </h1>
                <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: project.color, backgroundColor: `${project.color}20` }}>
                  {project.tag}
                </span>
              </div>
              <p className="text-sm font-mono text-white/45 max-w-xl leading-relaxed">
                {project.description}
              </p>
            </div>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${project.color}10` }}>
              <span className="shape-triangle" style={{ borderBottomColor: project.color }} />
            </div>
          </div>
        </section>
      </ScrollTrigger>

      <div className="thread">
        <section className="mb-16 thread-dot offset-left">
          <div className="section-accent" />
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Snapshot</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Role</span>
              <span className="text-sm font-mono text-white/70">{project.role}</span>
            </div>
            <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Year</span>
              <span className="text-sm font-mono text-white/70">{project.year}</span>
            </div>
            <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Stack</span>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span key={t} className="text-[9px] font-mono text-white/40 border border-white/5 px-1.5 py-0.5 rounded bg-terminal-800/50">{t}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {project.url && (
              <a href={project.url} target="_blank" rel="noopener noreferrer" className="btn-neon text-xs">
                Live Demo →
              </a>
            )}
            <a href={`https://github.com/beebus-builds/${project.repo}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs">
              View Source ↗
            </a>
          </div>
        </section>
      </div>

      <div className="thread">
        <section className="mb-16 thread-dot offset-right">
          <div className="section-accent" />
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Highlights</h2>
          <div className="space-y-3">
            {project.highlights.map((h, i) => (
              <div key={i} className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50 flex items-start gap-4">
                <span className="shape-circle shrink-0 mt-1" style={{ background: project.color }} />
                <p className="text-sm font-mono text-white/50 leading-relaxed">{h}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="thread">
        <section className="mb-16 thread-dot offset-left">
          <div className="section-accent" />
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">How It Was Built</h2>
          <div className="space-y-0">
            {project.process.map((step, i) => (
              <div key={i} className="flex items-start gap-4 py-3 border-l border-white/5 pl-6">
                <span className="text-[10px] font-mono text-white/20 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm font-mono text-white/50 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="thread">
        <section className="thread-dot">
          <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50 rail-card">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Outcome</span>
            <p className="text-sm font-mono text-white/55 leading-relaxed">{project.outcome}</p>
          </div>
        </section>
      </div>

      <div className="mt-12">
        <Link href="/projects" className="text-xs font-mono text-neon-400 hover:underline">
          ← All Projects
        </Link>
      </div>
    </PageShell>
  );
}
