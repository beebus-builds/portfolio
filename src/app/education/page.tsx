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
  { name: "JavaScript Algorithms & Data Structures", source: "freeCodeCamp", year: "2024" },
  { name: "Responsive Web Design", source: "freeCodeCamp", year: "2023" },
];

export default function EducationPage() {
  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
      <section className="mb-16 thread">
        <div className="section-accent" />
        <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
          Academic Background
        </h1>
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          My formal education in technology, combined with self-directed learning and real-world experience at Smartsites Nepal.
        </p>
      </section>
      </ScrollTrigger>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Degrees &amp; Diplomas</h2>
        <div className="space-y-4">
          {education.map((e) => (
            <div key={e.degree} className="neon-card border border-white/5 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${e.color}10` }}>
                  <span className="shape-line" style={{ width: 16, background: `linear-gradient(90deg, ${e.color}60, transparent)`, height: 16, width: 16, borderRadius: '2px', transform: 'rotate(45deg)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                    <div>
                      <h3 className="text-lg font-mono text-white tracking-wide">{e.degree}</h3>
                      <p className="text-sm font-mono mt-0.5" style={{ color: e.color }}>{e.institution}</p>
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded shrink-0" style={{ color: e.color, backgroundColor: `${e.color}20` }}>{e.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs font-mono text-white/30">{e.location}</span>
                    <span className="text-xs font-mono text-white/20">·</span>
                    <span className="text-xs font-mono text-white/30">{e.period}</span>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {e.details.map((d, j) => (
                      <li key={j} className="text-sm font-mono text-white/45 leading-relaxed flex items-start gap-2">
                        <span className="shape-dot mt-1.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Certifications</h2>
        <div className="neon-card border border-white/5 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {certs.map((c) => (
              <div key={c.name} className="px-6 py-4 flex items-center justify-between gap-4 bg-terminal-900/50">
                <div>
                  <p className="text-sm font-mono text-white/65">{c.name}</p>
                  <p className="text-xs font-mono text-white/30 mt-0.5">{c.source}</p>
                </div>
                <span className="text-xs font-mono text-white/20 shrink-0">{c.year}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="thread-dot">
        <div className="section-accent" />
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-3">Current Focus</h2>
          <p className="text-sm font-mono text-white/45 leading-relaxed">
            Applying academic knowledge to real-world challenges at Smartsites Nepal — bridging the gap between
            classroom theory and production-grade engineering. Every project is a lesson in scale, performance, and craftsmanship.
          </p>
        </div>
      </section>
      </div>
    </PageShell>
  );
}