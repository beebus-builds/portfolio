import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import ScrollTrigger from "@/components/ScrollTrigger";
import DemoViewport from "@/components/projects/DemoViewport";
import ImpactBadges from "@/components/projects/ImpactBadges";
import { getProjectBySlug } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  const ogTitle = encodeURIComponent(project.title);
  const accent = encodeURIComponent(project.color);
  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
      images: [{ url: `/og?type=project&title=${ogTitle}&subtitle=${encodeURIComponent(project.tag)}&accent=${accent}`, width: 1200, height: 630, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: [`/og?type=project&title=${ogTitle}&accent=${accent}`],
    },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
        <section className="mb-14">
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <Link href="/projects" className="text-xs font-mono text-white/30 hover:text-neon-400 transition-colors">
              ← Projects
            </Link>
            <span className="text-white/15">/</span>
            <span className="text-[10px] font-mono text-white/40">{project.slug}</span>
          </div>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="comment-label mb-3">case-study.tsx</p>
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

      <ImpactBadges project={project} />

      {/* Sticky snapshot sidebar alongside a flowing content column */}
      <div className="grid md:grid-cols-[260px_1fr] gap-10 md:gap-12">
        <aside className="md:sticky md:top-24 md:self-start space-y-5">
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-1.5">Role</span>
            <span className="text-sm font-mono text-white/70">{project.role}</span>
          </div>
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-1.5">Year</span>
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
          <div className="flex flex-col gap-2">
            {project.url && (
              <DemoViewport url={project.url} title={project.title} color={project.color} />
            )}
            <a href={`https://github.com/beebus-builds/${project.repo}`} target="_blank" rel="noopener noreferrer" className="btn-ghost text-xs justify-center">
              View Source ↗
            </a>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Highlights — diff-style, reads like a changelog */}
          <section className="mb-14">
            <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Highlights</h2>
            <div className="term-window">
              <div className="term-body py-4 space-y-3">
                {project.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="diff-plus mt-0.5">+</span>
                    <p className="text-sm font-mono text-white/55 leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Process — numbered build log with connecting rail */}
          <section className="mb-14">
            <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">How It Was Built</h2>
            <div className="space-y-0">
              {project.process.map((step, i) => (
                <div key={i} className="flex items-start gap-5 relative pb-8 last:pb-0">
                  {i < project.process.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-0 w-px bg-gradient-to-b from-white/10 to-transparent" />
                  )}
                  <span
                    className="text-[10px] font-mono w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                    style={{ borderColor: `${project.color}40`, color: project.color }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm font-mono text-white/50 leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Outcome — closing statement, quietly emphasized */}
          <section>
            <div className="neon-card rail-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Outcome</span>
              <p className="text-base font-mono text-white/70 leading-relaxed">{project.outcome}</p>
            </div>
          </section>

          <div className="mt-12">
            <Link href="/projects" className="text-xs font-mono text-neon-400 hover:underline">
              ← All Projects
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
