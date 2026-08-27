import type { ProjectRow } from "@/lib/db";

function parseMetric(metric: string): { value: string; label: string } {
  const match = metric.match(/^\s*([\d<>%]+|[A-Za-z]+\+?)\s*[–-]?\s*(.+)$/);
  if (match) {
    return { value: match[1], label: match[2].trim() };
  }
  return { value: "✦", label: metric };
}

export default function ImpactBadges({ project }: { project: ProjectRow }) {
  const metrics = project.metrics ?? [];
  const items = metrics.length
    ? metrics
    : [
        `${project.tech.length} — Core technologies`,
        `${project.highlights.length} — Key engineering wins`,
        `Since ${project.year} — In active development`,
        `${project.tag} — Project category`,
      ];

  return (
    <section className="mb-14">
      <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Impact</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((m, i) => {
          const { value, label } = parseMetric(m);
          return (
            <div
              key={i}
              className="neon-card border border-white/5 rounded-xl p-4 bg-terminal-900/50 relative overflow-hidden group"
            >
              <div
                className="absolute -top-6 -right-6 w-16 h-16 rounded-full opacity-10 blur-xl group-hover:opacity-20 transition-opacity"
                style={{ background: project.color }}
              />
              <p
                className="text-2xl font-mono font-bold leading-none mb-2"
                style={{ color: project.color }}
              >
                {value}
              </p>
              <p className="text-[10px] font-mono text-white/45 leading-snug">{label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
