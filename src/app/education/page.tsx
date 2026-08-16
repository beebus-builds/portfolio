import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Education",
  description: "Academic background — BIT at Bhaktapur Multiple Campus.",
};

const education = [
  {
    degree: "Bachelor of Information Technology",
    institution: "Bhaktapur Multiple Campus",
    location: "Bhaktapur, Nepal",
    period: "2023 — 2026",
    status: "In Progress",
    color: "#ffd700",
    details: [
      "Core coursework in algorithms, data structures, databases, and software engineering",
      "Building a strong foundation in computer science theory and practical application",
    ],
  },
  {
    degree: "Higher Secondary Education (NEB)",
    institution: "National Examinations Board",
    location: "Sindhuli, Nepal",
    period: "2020 — 2022",
    status: "Completed",
    color: "#4af0ff",
    details: [
      "Majored in Science with Mathematics and Computer Science",
      "Developed early interest in programming and web development",
    ],
  },
];

const certs = [
  { name: "JavaScript Algorithms & Data Structures", source: "freeCodeCamp", year: "2024", ext: ".cert" },
  { name: "Responsive Web Design", source: "freeCodeCamp", year: "2023", ext: ".cert" },
];

export default function EducationPage() {
  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
        <section className="mb-16">
          <p className="comment-label mb-3">education/transcript.log</p>
          <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
            Academic Background
          </h1>
          <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
            My formal education in technology, combined with self-directed learning and real-world experience at Smartsites Nepal.
          </p>
        </section>
      </ScrollTrigger>

      {/* ─── Degrees ── stacked transcript entries, status-led not icon-led ── */}
      <section className="mb-16 offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Degrees &amp; Diplomas</h2>
        <div className="term-window">
          <div className="term-body py-4">
            <div className="divide-y divide-white/5">
              {education.map((e) => (
                <div key={e.degree} className="py-6 first:pt-2 last:pb-2">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-[11px] font-mono text-white/20 w-24 shrink-0">{e.period}</span>
                      <div>
                        <h3 className="text-lg font-mono text-white tracking-wide">{e.degree}</h3>
                        <p className="text-sm font-mono mt-0.5" style={{ color: e.color }}>{e.institution} · {e.location}</p>
                      </div>
                    </div>
                    <span
                      className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded shrink-0"
                      style={{ color: e.color, backgroundColor: `${e.color}20` }}
                    >
                      {e.status}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5 pl-[6.75rem]">
                    {e.details.map((d, j) => (
                      <li key={j} className="text-sm font-mono text-white/45 leading-relaxed flex items-start gap-2">
                        <span className="diff-plus shrink-0 mt-0.5">·</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Certifications ── directory listing, ls -la feel ──────────── */}
      <section className="mb-16 offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Certifications</h2>
        <div className="term-window">
          <div className="term-titlebar">
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-dot" />
            <span className="term-path">~/certifications</span>
          </div>
          <div className="term-body py-3 px-0">
            <p className="font-mono text-xs text-white/25 px-6 mb-2">
              <span className="text-neon-400/60">$</span> ls -la
            </p>
            <div className="divide-y divide-white/5">
              {certs.map((c) => (
                <div key={c.name} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-white/20 font-mono text-xs shrink-0">{c.ext}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-mono text-white/65 truncate">{c.name}</p>
                      <p className="text-xs font-mono text-white/30 mt-0.5">{c.source}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-white/20 shrink-0">{c.year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-accent" />
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-3">Current Focus</h2>
          <p className="text-sm font-mono text-white/45 leading-relaxed">
            Applying academic knowledge to real-world challenges at Smartsites Nepal — bridging the gap between
            classroom theory and production-grade engineering. Every project is a lesson in scale, performance, and craftsmanship.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
