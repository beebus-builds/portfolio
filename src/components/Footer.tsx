import Link from "next/link";
import Logo from "@/components/Logo";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-terminal-900/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-xs font-mono text-white/40">
              © {new Date().getFullYear()} Bibash Poudel
            </span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-5">
            {footerLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs font-mono text-white/40 hover:text-neon-400 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/beebus-builds"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-white/40 hover:text-neon-400 transition-colors"
            >
              GitHub ↗
            </a>
            <a
              href="mailto:bibashpoudel@email.com"
              className="text-xs font-mono text-white/40 hover:text-neon-400 transition-colors"
            >
              Email ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}