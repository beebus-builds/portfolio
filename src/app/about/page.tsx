import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "About",
  description: "Biography, journey, and what drives a developer from Sindhuli, Nepal.",
};

const journey = [
  { hash: "a3f9c1e", year: "2025", title: "Intern at Smartsites Nepal", desc: "Building real-world web apps with React, Next.js, and TypeScript alongside senior engineers on production code." },
  { hash: "7b2d84a", year: "2023", title: "Started BIT at Bhaktapur Multiple Campus", desc: "Formal computer science education covering algorithms, data structures, databases, and software engineering." },
  { hash: "1f0c332", year: "2022", title: "First Line of Code", desc: "Wrote my first HTML page and discovered the power of the browser. The beginning of a journey into full-stack development." },
];

const values = [
  { title: "Problem Solving", desc: "Breaking complex problems into simple, elegant solutions through careful thinking and iteration." },
  { title: "Craft Over Code", desc: "Code is a means. The experience, the design, the story — that is the end goal of every project." },
  { title: "Always Learning", desc: "Every project teaches something new. The stack evolves, trends shift, and I grow with them." },
  { title: "Rooted in Nepal", desc: "Built from the Himalayas with patience, resilience, and a perspective shaped by Sindhuli's hills." },
];

export default function AboutPage() {
  return (
    <PageShell>
      {/* ─── Bio ── terminal window framing the identity block ─────────── */}
      <section className="mb-20">
        <div className="term-window">
          <div className="term-titlebar">
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-path">~/about.tsx</span>
          </div>
          <div className="term-body">
            <div className="flex flex-col md:flex-row items-start gap-10 md:gap-14">
              <div className="relative shrink-0 md:sticky md:top-24">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-neon-400 to-blue-500 flex items-center justify-center text-terminal-900 font-bold font-mono text-3xl">
                  BP
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-terminal-900 border-2 border-neon-400/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="comment-label mb-3">export default function Bio()</p>
                <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight">
                  Bibash Poudel
                </h1>
                <p className="text-lg font-mono text-neon-400/70 mt-3">Developer from Nepal · Building for the web</p>
                <p className="text-sm font-mono text-white/40 mt-5 max-w-lg leading-relaxed">
                  I craft digital experiences from the hills of Sindhuli. Every line of code I write is a bridge between
                  logic and artistry — turning complex problems into intuitive, beautiful interfaces.
                </p>
                <div className="flex gap-3 mt-8">
                  <Link href="/projects" className="btn-neon">
                    View Projects →
                  </Link>
                  <Link href="/contact" className="btn-ghost">
                    Contact Me
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── At a glance ── asymmetric bento, one wide + three narrow ──── */}
      <section className="mb-20">
        <p className="comment-label mb-4">const snapshot = {"{"}</p>
        <div className="bento">
          <div className="neon-card rail-card bento-half border border-white/5 rounded-xl p-6 flex flex-col justify-center">
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">Studying</h3>
            <p className="text-lg font-mono text-white/85 mt-1">Bachelor of Information Technology</p>
            <p className="text-[11px] font-mono text-white/30 mt-1.5">Bhaktapur Multiple Campus</p>
          </div>
          <div className="neon-card rail-card bento-sm border border-white/5 rounded-xl p-6">
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">Working</h3>
            <p className="text-sm font-mono text-white/80 mt-1">Dev Intern</p>
            <p className="text-[10px] font-mono text-white/30 mt-1.5">Smartsites Nepal</p>
          </div>
          <div className="neon-card rail-card bento-sm border border-white/5 rounded-xl p-6">
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">From</h3>
            <p className="text-sm font-mono text-white/80 mt-1">Sindhuli</p>
            <p className="text-[10px] font-mono text-white/30 mt-1.5">Nepal</p>
          </div>
        </div>
        <p className="comment-label mt-4">{"}"}</p>
      </section>

      {/* ─── Journey ── git-log style timeline ────── */}
      <section className="mb-20">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">git log --oneline --reverse</h2>
        <div className="term-window">
          <div className="term-body py-4">
            <div className="space-y-0 divide-y divide-white/5">
              {journey.map((j) => (
                <div key={j.hash} className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-5 py-4">
                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-40">
                    <span className="text-[11px] font-mono text-neon-400/50">{j.hash}</span>
                    <span className="text-[11px] font-mono text-white/20">{j.year}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-mono text-white">{j.title}</h3>
                    <p className="text-sm font-mono text-white/35 mt-1.5 leading-relaxed max-w-lg">{j.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Values ── staggered offset cards, not a uniform grid ──────── */}
      <section>
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">What I Believe In</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {values.map((v, i) => (
            <div
              key={v.title}
              className={`neon-card rail-card border border-white/5 rounded-xl p-6 ${i % 2 === 1 ? "sm:translate-y-6" : ""}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="diff-plus">{String(i + 1).padStart(2, "0")}</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <h3 className="text-base font-mono text-white tracking-wide mb-2">{v.title}</h3>
              <p className="text-sm font-mono text-white/40 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
