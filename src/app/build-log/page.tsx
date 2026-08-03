import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Build Log",
  description: "A developer diary of decisions, experiments, and progress.",
};

const entries = [
  { date: "2026-08-03", title: "Blog posts now publish straight to Neon", note: "Replaced the 'download a .md file' flow with real publishing. Posts live in Postgres — /admin/new publishes instantly, /blog + /blog/[slug] read live from the DB (dynamic routes), and there's a Manage Posts page to edit or delete. The old markdown post was migrated into the DB. /rss.xml and /sitemap.xml follow the same source." },
  { date: "2026-07-31", title: "Accessibility + light mode overhaul", note: "Every text-white/opacity class is now remapped for light mode (real contrast instead of invisible white-on-white), tiny 9–12px labels were bumped to a readable floor, the base font went from 15px to 17px, buttons/cards/code blocks got light-theme variants, and the terminal panels stay dark in both themes via a dark-surface scope." },
  { date: "2026-07-31", title: "Terminal is now a real shell", note: "Streaming output, interactive prompts, sudo with a password gate, ctrl+c/crtl+l, live cmatrix + nmap-style scans, shell operators (&&, ;, |, >), a writable filesystem (touch/mkdir/rm/echo>), man pages and history. Built a shared useTerminal hook so the landing terminal, floating widget, and playground all run the same engine." },
  { date: "2026-07-31", title: "Added algorithms visualizer + fractal explorer", note: "A* / Dijkstra / BFS pathfinding with a paintable maze grid, four sorting algorithms with live bar animation, and an interactive Mandelbrot / Julia explorer. All rendered client-side on canvas." },
  { date: "2026-07-31", title: "Switched to Anonymous Pro + hacker styling", note: "Ditched Courier New for Anonymous Pro (self-hosted via next/font), cranked the base size up, made everything bolder, and added matrix rain behind the landing terminal. Feels like a real hacker box now." },
  { date: "2026-07-31", title: "Terminal now has an AI companion", note: "The 'ask' command answers questions about projects, skills, contact, Nepal, and the blog. Rule-based, zero APIs — but reads like an assistant." },
  { date: "2026-07-31", title: "Redesigned portfolio with asymmetric layouts", note: "Ditched the uniform card grid for offset sections, CSS art shapes, and a connecting visual thread. Still feels like it's missing something — maybe more personality in the spacing." },
  { date: "2026-07-30", title: "Built WebRTC calling pipeline", note: "Python WebSocket signaling server on port 8001, paired with Next.js on 3001. ngrok handles HTTPS tunnels so camera/mic works on mobile. The call flow works end-to-end." },
  { date: "2026-07-29", title: "Added blog system with markdown publishing", note: "Markdown files in content/blog/ parsed at build time. Admin editor at /admin/new generates downloadable .md files. Simple but functional — no CMS, no dependencies." },
  { date: "2026-07-28", title: "Scrapped the 3D game approach", note: "Removed three.js, react-three-fiber, and related deps (52 packages gone). The terminal-based portfolio feels more intentional and personal." },
  { date: "2026-07-27", title: "Initial terminal build with routing", note: "Terminal.tsx as the homepage launcher, PageShell for shared layouts, Header with megamenu, Footer with links. 8 content pages all rendering inside PageShell." },
];

export default function BuildLogPage() {
  return (
    <PageShell title="Build Log" subtitle="A dev diary of decisions, experiments, and lessons.">
      <section className="mb-12 thread">
        <div className="section-accent" />
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          Not a changelog — a collection of honest notes about what I built, why, and what I learned. Updated when something matters.
        </p>
      </section>

      <div className="space-y-6">
        {entries.map((entry) => (
          <div key={entry.date} className="neon-card rail-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
            <div className="flex items-start justify-between gap-4 mb-2">
              <span className="text-xs font-mono text-neon-400/60">{entry.date}</span>
            </div>
            <h3 className="text-base font-mono text-white tracking-wide mb-2">{entry.title}</h3>
            <p className="text-sm font-mono text-white/40 leading-relaxed">{entry.note}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}