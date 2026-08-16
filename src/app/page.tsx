import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { projects } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="min-h-screen bg-terminal-900 flex flex-col">
      <Header />

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-400/20 bg-neon-400/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-neon-400 uppercase">
              Available for work
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold tracking-tighter text-white leading-[1.05] mb-6">
            Bibash
            <span className="block text-white/40">Poudel</span>
          </h1>
          <p className="text-base md:text-lg text-white/45 max-w-xl mx-auto leading-relaxed mb-10 font-mono">
            Full-stack developer from the hills of Sindhuli, Nepal.
            I build fast, human-centered web experiences with
            Next.js &amp; TypeScript.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/projects" className="btn-neon text-xs font-mono tracking-wider">
              View my work →
            </Link>
            <Link href="/contact" className="btn-ghost text-xs font-mono tracking-wider">
              Say hello
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured Work ─────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] font-mono tracking-widest text-neon-400/70 uppercase mb-2">
                Selected work
              </p>
              <h2 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter">
                Featured Projects
              </h2>
            </div>
            <Link
              href="/projects"
              className="hidden sm:block text-xs font-mono text-white/40 hover:text-neon-400 transition-colors"
            >
              All projects →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.slice(0, 6).map((p) => (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}`}
                className="group neon-card p-5 flex flex-col"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: `${p.color}1a`, border: `1px solid ${p.color}33` }}
                >
                  <span className="text-sm font-mono font-bold" style={{ color: p.color }}>
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
                  <span className="text-[11px] font-mono text-white/30">
                    {p.year}
                  </span>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {p.tech.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 text-white/45"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter mb-5">
            Let's build something together
          </h2>
          <p className="text-white/45 mb-8 leading-relaxed font-mono text-sm">
            Whether it's a project, an internship, or just a good conversation —
            my inbox is always open.
          </p>
          <Link href="/contact" className="btn-neon text-xs font-mono tracking-wider">
            Start a conversation
          </Link>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  );
}