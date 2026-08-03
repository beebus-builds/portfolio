import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "About",
  description: "Biography, journey, and what drives a developer from Sindhuli, Nepal.",
};

const journey = [
  { year: "2025", title: "Intern at Smartsites Nepal", desc: "Building real-world web apps with React, Next.js, and TypeScript alongside senior engineers on production code." },
  { year: "2023", title: "Started BIT at Bhaktapur Multiple Campus", desc: "Formal computer science education covering algorithms, data structures, databases, and software engineering." },
  { year: "2022", title: "First Line of Code", desc: "Wrote my first HTML page and discovered the power of the browser. The beginning of a journey into full-stack development." },
];

const values = [
  { title: "Problem Solving", desc: "Breaking complex problems into simple, elegant solutions through careful thinking and iteration." },
  { title: "Craft Over Code", desc: "Code is a means. The experience, the design, the story — that is the end goal of every project." },
  { title: "Always Learning", desc: "Every project teaches something new. The stack evolves, trends shift, and I grow with them." },
  { title: "Rooted in Nepal", desc: "Built from the Himalayas with patience, resilience, and a perspective shaped by Sindhuli's hills." },
];

export default function AboutPage() {
  return (
    <PageShell title="About" subtitle="">
      <section className="mb-16 thread">
        <div className="flex flex-col md:flex-row items-start gap-10 md:gap-16">
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-neon-400 to-blue-500 flex items-center justify-center text-terminal-900 font-bold font-mono text-3xl">
              BP
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-terminal-900 border-2 border-neon-400/30" />
          </div>
          <div className="flex-1">
            <div className="ornament">
              <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight">
                Bibash Poudel
              </h1>
            </div>
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
      </section>

      <div className="thread">
      <section className="mb-16 thread-dot">
        <div className="ornament ornament-lg">
          <div className="section-accent" />
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">At a Glance</h2>
        </div>
        <div className="grid-asym">
          <div className="neon-card rail-card border border-white/5 rounded-xl p-6">
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">Studying</h3>
            <p className="text-sm font-mono text-white/80 mt-1">BIT</p>
            <p className="text-[10px] font-mono text-white/30 mt-1.5">Bhaktapur Multiple Campus</p>
          </div>
          <div className="neon-card rail-card border border-white/5 rounded-xl p-6">
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">Working</h3>
            <p className="text-sm font-mono text-white/80 mt-1">Developer Intern</p>
            <p className="text-[10px] font-mono text-white/30 mt-1.5">Smartsites Nepal</p>
          </div>
          <div className="neon-card rail-card border border-white/5 rounded-xl p-6">
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">From</h3>
            <p className="text-sm font-mono text-white/80 mt-1">Sindhuli</p>
            <p className="text-[10px] font-mono text-white/30 mt-1.5">Nepal</p>
          </div>
          <div className="neon-card rail-card border border-white/5 rounded-xl p-6">
            <h3 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">Age</h3>
            <p className="text-sm font-mono text-white/80 mt-1">23</p>
            <p className="text-[10px] font-mono text-white/30 mt-1.5">Years</p>
          </div>
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">My Journey</h2>
        <div className="space-y-0">
          {journey.map((j, i) => (
            <div key={j.year} className="flex gap-5 relative pb-10 last:pb-0">
              {i < journey.length - 1 && <div className="absolute left-[5px] top-4 bottom-0 w-px bg-gradient-to-b from-neon-400/20 to-transparent" />}
              <div className="w-[10px] shrink-0 flex flex-col items-center pt-0.5">
                <div className="w-2.5 h-2.5 rounded-full border border-neon-400/30 bg-terminal-900" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <span className="text-xs font-mono text-neon-400/50">{j.year}</span>
                <h3 className="text-base font-mono text-white mt-1">{j.title}</h3>
                <p className="text-sm font-mono text-white/35 mt-2 leading-relaxed max-w-lg">{j.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      <section>
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">What I Believe In</h2>
        <div className="grid gap-4 md:grid-cols-2 offset-right">
          {values.map((v) => (
            <div key={v.title} className="neon-card rail-card border border-white/5 rounded-xl p-6">
              <div className="w-8 h-8 rounded-lg bg-neon-400/5 flex items-center justify-center mb-4">
                <span className="shape-circle" style={{ background: 'rgba(74,240,255,0.4)' }} />
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
