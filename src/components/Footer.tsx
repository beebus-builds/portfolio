"use client";

import { useEffect, useState } from "react";
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
  const [ktm, setKtm] = useState("");
  useEffect(() => {
    const update = () => setKtm(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" }).format(new Date()));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="border-t border-white/5 bg-terminal-900/60 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* top meta bar — mirrors header ribbon */}
        <div className="flex items-center justify-between py-3 border-b border-white/5 text-[10px] font-mono tracking-wider text-white/25">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">footer.tsx</span>
            <span className="text-white/10">::</span>
            <span className="hidden md:inline">SYS: NOMINAL</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">Sindhuli • Nepal</span>
            <span className="text-white/10 hidden sm:inline">•</span>
            <span className="text-neon-400/70">KTM {ktm || "--:--"}</span>
          </span>
        </div>

        <div className="py-10 flex flex-col md:grid md:grid-cols-[1.2fr_auto_1fr] gap-8 items-start md:items-center">
          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <div className="leading-none">
              <p className="text-xs font-mono font-bold text-white/80">bibashpoudel.dev</p>
              <p className="text-[10px] font-mono text-white/30">© {new Date().getFullYear()} Bibash Poudel • Crafted in Sindhuli</p>
            </div>
          </div>

          {/* Center: nav — simple text links */}
          <nav className="flex flex-wrap items-center gap-5 md:justify-center">
            {footerLinks.map((l) => (
              <Link key={l.label} href={l.href} className="nav-link text-[11px] font-mono tracking-widest text-white/40 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-4 md:justify-end w-full md:w-auto">
            <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-white/40 hover:text-neon-400 transition-colors flex items-center gap-1">
              GitHub <span className="text-[10px]">↗</span>
            </a>
            <span className="w-px h-4 bg-white/10" />
            <a href="mailto:bibashpoudel@email.com" className="text-[11px] font-mono text-white/40 hover:text-neon-400 transition-colors flex items-center gap-1">
              Email <span className="text-[10px]">↗</span>
            </a>
            <Link href="/contact" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] font-mono tracking-widest text-white/50 hover:text-white hover:border-neon-400/20 transition-colors">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Hire me
            </Link>
          </div>
        </div>

        <div className="pb-6 flex items-center justify-between text-[10px] font-mono text-white/15">
          <span>Built with Next.js 16 • Tailwind 4 • Neon Postgres</span>
          <span className="hidden sm:inline">~ $ echo &quot;craft over code&quot;</span>
        </div>
      </div>
    </footer>
  );
}
