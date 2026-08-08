import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Terminal from "@/components/Terminal";
import ChatWidget from "@/components/ChatWidget";
import MouseScroll from "@/components/MouseScroll";
import { projects } from "@/lib/projects";
import { getBlogPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

const stats = [
  { label: "Projects", value: projects.length },
  { label: "Intern", value: "Smartsites Nepal" },
  { label: "Studying", value: "BIT @ BMC" },
  { label: "Based", value: "Sindhuli, NP" },
];

const values = [
  {
    title: "Craft over code",
    desc: "Code is the means. The experience, the design, the story — that's the end goal of every project.",
  },
  {
    title: "Learn by building",
    desc: "Every project teaches something new. The stack evolves, trends shift, and I grow with them.",
  },
  {
    title: "Rooted in Nepal",
    desc: "Built from the Himalayas with patience, resilience, and a perspective shaped by Sindhuli's hills.",
  },
];

export default async function Home() {
  const posts = (await getBlogPosts()).slice(0, 3);
  const featured = projects.slice(0, 3);

  return (
    <div className="min-h-screen bg-terminal-900 flex flex-col">
      <Header />

      {/* ─── Intro ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left: Narrative Copy */}
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 mb-6">
              <span className="shape-square" />
              <p className="text-xs font-mono text-neon-400/80 tracking-widest uppercase">
                Building from the Himalayas
              </p>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-mono font-bold text-white leading-[1.1] tracking-tighter">
              <span className="block text-white/90">Sindhuli to</span>
              <span className="text-[var(--color-neon-400)] glow-neon">the Web.</span>
            </h1>
            
            <p className="mt-8 text-lg font-mono text-white/50 max-w-xl leading-relaxed">
              I'm Bibash. I bridge technical complexity with quiet, performant interfaces. 
              Currently crafting full-stack experiences with Next.js, and obsessing over 
              the subtle details that make software actually <em>feel</em> human.
            </p>
            
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/projects" className="btn-neon text-sm">
                Explore Projects
              </Link>
              <Link href="/contact" className="btn-ghost text-sm">
                Say Hello
              </Link>
            </div>
          </div>

          {/* Right: Tactile Artifact */}
          <div className="md:col-span-5 relative">
            <div className="neon-card border border-[var(--color-terminal-700)] p-8 bg-[var(--color-terminal-900)] rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[var(--color-neon-400)] animate-pulse" />
                <span className="text-[10px] font-mono text-[var(--color-terminal-text)] uppercase tracking-widest">Live Status</span>
              </div>
              <h3 className="text-sm font-mono text-white mb-2">Building: DevVerse Core</h3>
              <p className="text-xs font-mono text-white/40 leading-relaxed mb-6">
                Refactoring the terminal state machine for better performance. 
                Focusing on reducing main-thread blocking time.
              </p>
              <div className="text-[10px] font-mono text-[var(--color-terminal-text)]/30 border-t border-white/5 pt-4">
                LAST COMMIT: 14m ago · github.com/bibash
              </div>
            </div>
          </div>
        </div>
        <MouseScroll />
      </section>

      {/* ─── Terminal (the real homepage experience) ────────── */}
      <section className="thread" id="terminal">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="thread-dot">
            <div className="section-accent" />
            <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-4">Try the terminal</h2>
          </div>
          <Terminal variant="section" />
          <p className="mt-4 text-[10px] font-mono text-white/30">
            Type <span className="text-neon-400/60">help</span> to start — or run{" "}
            <span className="text-neon-400/60">about</span>,{" "}
            <span className="text-neon-400/60">projects</span>,{" "}
            <span className="text-neon-400/60">skills</span>, or ask{" "}
            <span className="text-neon-400/60">ask</span> anything to the AI companion.
          </p>
        </div>
      </section>

      {/* ─── Featured work ──────────────────────────────────── */}
      <div className="thread">
        <section className="max-w-6xl mx-auto px-4 py-14 offset-left">
          <div className="section-accent" />
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
            <h2 className="text-xs font-mono text-neon-400 tracking-wider">Featured Work</h2>
            <Link href="/projects" className="text-[10px] font-mono text-white/30 hover:text-neon-400 transition-colors">
              all projects →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((p) => (
              <Link
                key={p.slug}
                href={`/projects/${p.slug}`}
                className="neon-card rail-card group border border-white/5 rounded-xl p-6 bg-terminal-900/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono" style={{ color: p.color }}>{p.tag}</span>
                  <span className="text-[10px] font-mono text-white/20">{p.year}</span>
                </div>
                <h3 className="text-sm font-mono text-white group-hover:text-neon-400 transition-colors leading-relaxed">
                  {p.title}
                </h3>
                <p className="text-xs font-mono text-white/40 leading-relaxed mt-2 line-clamp-3">
                  {p.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {p.tech.slice(0, 4).map((t) => (
                    <span key={t} className="text-[9px] font-mono text-white/25 border border-white/5 rounded px-1.5 py-0.5 bg-terminal-800/50">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ─── At a glance ────────────────────────────────────── */}
      <div className="thread">
        <section className="max-w-6xl mx-auto px-4 py-14 offset-right">
          <div className="section-accent" />
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">At a Glance</h2>
          <div className="grid-asym">
            <div className="grid gap-4 sm:grid-cols-2">
              {stats.map((s) => (
                <div key={s.label} className="neon-card rail-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-mono text-white mt-1">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-4">Currently</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm font-mono text-white/50">
                  <span className="shape-dot mt-1.5" /> Interning at Smartsites Nepal
                </li>
                <li className="flex items-start gap-2.5 text-sm font-mono text-white/50">
                  <span className="shape-dot mt-1.5" /> Finishing BIT at Bhaktapur Multiple Campus
                </li>
                <li className="flex items-start gap-2.5 text-sm font-mono text-white/50">
                  <span className="shape-dot mt-1.5" /> Picking up Rust, Docker, and system design
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* ─── Values ─────────────────────────────────────────── */}
      <div className="thread">
        <section className="max-w-6xl mx-auto px-4 py-14 offset-left">
          <div className="section-accent" />
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">What I Care About</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="neon-card rail-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
                <span className="shape-square mb-4 block" />
                <h3 className="text-sm font-mono text-white tracking-wide mb-2">{v.title}</h3>
                <p className="text-xs font-mono text-white/40 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─── Latest posts ───────────────────────────────────── */}
      {posts.length > 0 && (
        <div className="thread">
          <section className="max-w-6xl mx-auto px-4 py-14 offset-right">
            <div className="section-accent" />
            <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
              <h2 className="text-xs font-mono text-neon-400 tracking-wider">From the Blog</h2>
              <Link href="/blog" className="text-[10px] font-mono text-white/30 hover:text-neon-400 transition-colors">
                all posts →
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="neon-card rail-card group border border-white/5 rounded-xl p-6 bg-terminal-900/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-mono text-white/25">{post.date}</span>
                    <span className="text-[10px] font-mono text-white/20">· {post.readingTime} min</span>
                  </div>
                  <h3 className="text-sm font-mono text-white group-hover:text-neon-400 transition-colors leading-relaxed">
                    {post.title}
                  </h3>
                  <p className="text-xs font-mono text-white/40 leading-relaxed mt-2 line-clamp-2">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ─── CTA ────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="neon-card rail-card border border-white/5 rounded-xl p-8 bg-terminal-900/50">
          <p className="text-sm font-mono text-white/50 max-w-lg leading-relaxed">
            Looking for someone to build, fix, or improve something on the web? I&apos;m open to
            internships, freelance work, and collaboration.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-neon text-sm">Get in Touch →</Link>
            <Link href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
              Download Resume
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  );
}
