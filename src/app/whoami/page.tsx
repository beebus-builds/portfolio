import Link from "next/link";
import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";

export const metadata = {
  title: "Whoami",
  description: "Identity card — profile, bio, and links of Bibash Poudel.",
};

const stats = [
  { label: "Name", value: "Bibash Poudel" },
  { label: "From", value: "Sindhuli, Nepal" },
  { label: "Role", value: "Developer Intern @ Smartsites Nepal" },
  { label: "Study", value: "BIT @ Bhaktapur Multiple Campus" },
  { label: "Age", value: "23" },
  { label: "Timezone", value: "Asia/Kathmandu (UTC+5:45)" },
  { label: "Languages", value: "Nepali (native), English (fluent)" },
];

const pageLinks = [
  { cmd: "about", href: "/about", desc: "Full bio and journey" },
  { cmd: "projects", href: "/projects", desc: "Things I've built" },
  { cmd: "skills", href: "/skills", desc: "Technologies I use" },
  { cmd: "contact", href: "/contact", desc: "Get in touch" },
  { cmd: "education", href: "/education", desc: "Academic background" },
  { cmd: "nepal", href: "/nepal", desc: "About my country" },
  { cmd: "namaste", href: "/namaste", desc: "Nepali welcome" },
];

export default function WhoamiPage() {
  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
      <section className="mb-16 thread">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-neon-400 to-blue-500 flex items-center justify-center text-terminal-900 font-bold font-mono text-3xl shrink-0">
            BP
          </div>
          <div className="text-center md:text-left">
            <div className="section-accent" />
            <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-2">
              Bibash Poudel
            </h1>
            <p className="text-lg font-mono text-neon-400/70">The Architect of Digital Voids</p>
            <p className="text-sm font-mono text-white/35 mt-2">Developer · Creator · Curious Mind</p>
          </div>
        </div>
      </section>
      </ScrollTrigger>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Profile</h2>
        <div className="neon-card border border-white/5 rounded-xl overflow-hidden">
          <div className="divide-y divide-white/5">
            {stats.map((s) => (
              <div key={s.label} className="px-6 py-3 flex items-center justify-between gap-4 bg-terminal-900/50">
                <span className="text-sm font-mono text-white/30">{s.label}</span>
                <span className="text-sm font-mono text-white/65 text-right">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="mb-16 thread-dot offset-right">
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Bio</h2>
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <p className="text-sm font-mono text-white/45 leading-relaxed">
            A 23-year-old developer from the hills of Sindhuli, Nepal. Currently pursuing a Bachelor&apos;s in
            Information Technology while interning at Smartsites Nepal. I build for the web — turning ideas into
            interactive experiences with clean code and thoughtful design.
          </p>
        </div>
      </section>
      </div>

      <section>
        <div className="section-accent" />
        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-6">Explore This Site</h2>
        <div className="grid gap-3 md:grid-cols-2 offset-left">
          {pageLinks.map((item) => (
            <Link key={item.cmd} href={item.href}
              className="neon-card flex items-center gap-3 border border-white/5 rounded-xl p-4 bg-terminal-900/50 hover:border-white/10 transition-all group"
            >
              <span className="shape-dot" />
              <span className="text-[10px] font-mono text-neon-400/60 bg-neon-400/10 px-1.5 py-0.5 rounded">{item.cmd}</span>
              <span className="text-sm font-mono text-white/45 group-hover:text-white/70 transition-colors">{item.desc}</span>
            </Link>
          ))}
          <Link href="/resume.pdf" download
            className="neon-card flex items-center gap-3 border border-white/5 rounded-xl p-4 bg-terminal-900/50 hover:border-white/10 transition-all group cursor-pointer"
          >
            <span className="shape-square" />
            <span className="text-[10px] font-mono text-neon-400/60 bg-neon-400/10 px-1.5 py-0.5 rounded">resume</span>
            <span className="text-sm font-mono text-white/45 group-hover:text-white/70 transition-colors">Download CV →</span>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}