import Link from "next/link";
import Logo from "@/components/Logo";

const links = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Skills", href: "/skills" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#08090a]">
      <div className="portfolio-container py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="flex items-center gap-3">
            <Logo size={30} />
            <div>
              <p className="text-sm font-semibold text-white">Bibash Poudel</p>
              <p className="text-xs text-white/35">Full-stack developer · Nepal</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {links.map((link) => <Link key={link.href} href={link.href} className="text-xs text-white/45 hover:text-neon-400 transition-colors">{link.label}</Link>)}
          </nav>
          <div className="flex gap-5 text-xs">
            <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer" className="text-white/45 hover:text-neon-400">GitHub ↗</a>
            <a href="mailto:bibashpoudel@email.com" className="text-white/45 hover:text-neon-400">Email ↗</a>
          </div>
        </div>
        <div className="mt-9 pt-5 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between text-[11px] text-white/25">
          <span>© {new Date().getFullYear()} Bibash Poudel. All rights reserved.</span>
          <span>Designed & built with care.</span>
        </div>
      </div>
    </footer>
  );
}
