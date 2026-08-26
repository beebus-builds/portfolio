import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import AsciiEngine from "@/components/AsciiEngine";
import DatabaseTelemetry from "@/components/DatabaseTelemetry";
import Hero from "@/components/Hero";
import { projects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function Home() {
  const [pinned, ...rest] = projects.slice(0, 5);

  return (
    <div className="min-h-screen bg-terminal-900 flex flex-col">
      <Header />

      <Hero />

      {/* ─── Featured Work ── bento grid, one pinned + 3D ASCII Engine ───── */}
      <section className="section-py px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="term-window mb-8">
            <div className="tab-strip px-2">
              <span className="tab-chip active">featured.json</span>
              <Link href="/projects" className="tab-chip">
                all-projects →
              </Link>
            </div>
          </div>

          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="comment-label mb-2">Selected work &amp; lab</p>
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter">
                Featured Projects &amp; 3D Lab
              </h2>
            </div>
            <Link
              href="/projects"
              className="hidden sm:block text-xs font-mono text-white/40 hover:text-neon-400 transition-colors"
            >
              All projects →
            </Link>
          </div>

          <div className="bento">
            {/* Pinned project — large tile, richer content */}
            {pinned && (
              <Link
                href={`/projects/${pinned.slug}`}
                className="group neon-card bento-lg p-6 md:p-8 flex flex-col justify-between relative overflow-hidden"
              >
                <div
                  className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
                  style={{ background: pinned.color }}
                  aria-hidden="true"
                />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ background: `${pinned.color}1a`, border: `1px solid ${pinned.color}33` }}
                    >
                      <span className="text-sm font-mono font-bold" style={{ color: pinned.color }}>
                        {pinned.title.charAt(0)}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded" style={{ color: pinned.color, backgroundColor: `${pinned.color}18` }}>
                      {pinned.tag}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-mono font-bold text-white group-hover:text-neon-400 transition-colors mb-3">
                    {pinned.title}
                  </h3>
                  <p className="text-sm font-mono text-white/40 leading-relaxed max-w-md">
                    {pinned.description}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/5">
                  <span className="text-[11px] font-mono text-white/30">{pinned.year}</span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {pinned.tech.slice(0, 4).map((t) => (
                      <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 text-white/45">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            )}

            {/* Interactive 3D ASCII Torus Embedded Right Inside Bento Grid */}
            <AsciiEngine />

            {/* Remaining projects — compact tiles */}
            {rest.map((p) => (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}`}
                className="group neon-card bento-sm p-5 flex flex-col"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${p.color}1a`, border: `1px solid ${p.color}33` }}
                >
                  <span className="text-xs font-mono font-bold" style={{ color: p.color }}>
                    {p.title.charAt(0)}
                  </span>
                </div>
                <h3 className="text-sm font-mono font-bold text-white group-hover:text-neon-400 transition-colors mb-1.5">
                  {p.title}
                </h3>
                <p className="text-[13px] font-mono text-white/40 leading-relaxed mb-4 line-clamp-3 flex-1">
                  {p.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-white/30">{p.year}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 text-white/45">
                    {p.tech[0]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DATABASE SYSTEM TELEMETRY CONTROL ROOM ───────────────────── */}
      <section className="section-py px-4 sm:px-6 border-t border-white/5 bg-terminal-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="comment-label mb-2">Live Telemetry</p>
            <h2 className="text-2xl md:text-3xl font-mono font-bold text-white tracking-tighter">
              Neon Postgres Node Control Room
            </h2>
            <p className="text-xs font-mono text-white/40 mt-1">
              Active database querying, round-trip latency checks, and live throughput plotting.
            </p>
          </div>
          <DatabaseTelemetry />
        </div>
      </section>

      {/* ─── CTA ── framed as a command about to be run ────────────────── */}
      <section className="section-py px-4 border-t border-white/5">
        <div className="max-w-xl mx-auto">
          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-path">~/contact.sh</span>
            </div>
            <div className="term-body text-center">
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter mb-5">
                Let&apos;s build something together
              </h2>
              <p className="text-white/45 mb-8 leading-relaxed font-mono text-sm max-w-md mx-auto">
                Whether it&apos;s a project, an internship, or just a good conversation —
                my inbox is always open.
              </p>
              <div className="flex flex-col items-center gap-4">
                <Link href="/contact" className="btn-neon text-xs font-mono tracking-wider">
                  Start a conversation
                </Link>
                <p className="font-mono text-[11px] text-white/20">
                  <span className="text-neon-400/50">$</span> echo &quot;hello&quot; | mail bibash
                  <span className="caret-blink" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  );
}