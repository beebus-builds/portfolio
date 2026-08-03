import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Tools",
  description: "Curated tools and resources that shape how I build.",
};

const categories = [
  {
    name: "IDE & Editors",
    color: "#4af0ff",
    items: [
      { name: "VS Code", desc: "Lightweight, extensible code editor with Git integration and rich ecosystem." },
      { name: "Warp", desc: "Modern terminal with AI-assisted command input and workflow automation." },
    ],
  },
  {
    name: "Design & Prototyping",
    color: "#ff4af0",
    items: [
      { name: "Figma", desc: "Collaborative UI design and prototyping tool. Industry standard for design systems." },
      { name: "Arrow", desc: "Design tool built for developers who want pixel-perfect without the designer overhead." },
    ],
  },
  {
    name: "Deployment & Hosting",
    color: "#ffd700",
    items: [
      { name: "Vercel", desc: "Zero-config deploys for Next.js. Edge-first, automatic SSL, instant rollbacks." },
      { name: "GitHub Pages", desc: "Static site hosting directly from a repository. Free, simple, reliable." },
    ],
  },
  {
    name: "Learning & Community",
    color: "#22c55e",
    items: [
      { name: "freeCodeCamp", desc: "Free curriculum covering responsive design, JavaScript, and backend development." },
      { name: "Dev.to", desc: "Community-driven developer blog with practical tutorials and industry insights." },
    ],
  },
];

export default function ToolsPage() {
  return (
    <PageShell title="Tools" subtitle="Curated tools and resources I rely on.">
      <section className="mb-12 thread">
        <div className="section-accent" />
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          These are the tools, platforms, and resources I return to daily — selected for real impact, not popularity.
        </p>
      </section>

      <div className="space-y-10">
        {categories.map((cat) => (
          <div key={cat.name} className="thread thread-dot offset-left">
            <div className="section-accent" />
            <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {cat.items.map((item) => (
                <div key={item.name} className="neon-card rail-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
                  <h3 className="text-sm font-mono text-white tracking-wide mb-1" style={{ color: cat.color }}>{item.name}</h3>
                  <p className="text-xs font-mono text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}