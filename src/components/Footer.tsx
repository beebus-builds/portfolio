import Link from "next/link";
import Logo from "@/components/Logo";

const footerLinks = [
  { label: "Blog", href: "/blog" },
  { label: "Terminal", href: "/commands" },
  { label: "Chess", href: "/chess" },
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Contact", href: "/contact" },
  { label: "Education", href: "/education" },
];

const socialLinks = [
  { label: "GitHub", href: "https://github.com/beebus-builds" },
  { label: "Email", href: "mailto:bibashpoudel@email.com" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-terminal-900/50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3 group">
              <Logo size={22} />
              <span className="text-white font-mono text-sm group-hover:text-neon-400 transition-colors">bibashpoudel</span>
            </Link>
            <p className="text-xs font-mono text-white/40 leading-relaxed max-w-xs">
              Developer from Sindhuli, Nepal. Building for the web — turning ideas into interactive experiences.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-3">Pages</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {footerLinks.map((l) => (
                <Link key={l.label} href={l.href}
                  className="text-xs font-mono text-white/40 hover:text-neon-400 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono text-white/30 uppercase tracking-wider mb-3">Connect</h4>
            <div className="flex flex-col gap-1.5">
              {socialLinks.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-mono text-white/40 hover:text-neon-400 transition-colors"
                >
                  {s.label} ↗
                </a>
              ))}
              <p className="text-[10px] font-mono text-white/15 mt-2">
                UTC+5:45 — Nepal Time
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] font-mono text-white/10">
            Built from the Himalayas with altitude attitude. © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
