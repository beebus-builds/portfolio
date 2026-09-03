"use client";

import Link from "next/link";
import Image from "next/image";
import { aboutLinks } from "./data";
import { playClick } from "@/lib/audio";

export default function MegaMenuAbout() {
  const [feature, ...rest] = aboutLinks;

  return (
    <div
      role="menu"
      className="absolute top-[calc(100%+10px)] left-0 w-[560px] bg-terminal-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.75)] z-50 grid grid-cols-[1.1fr_1fr] gap-6 animate-fade-in"
    >
      {/* Featured — About Me */}
      <Link
        href={feature.href}
        role="menuitem"
        onClick={() => playClick()}
        className="block rounded-xl border border-white/5 hover:border-neon-400/25 hover:bg-white/[0.03] transition-all group overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40"
      >
        <div className="relative h-32 w-full overflow-hidden">
          {feature.image && (
            <Image src={feature.image} alt="" fill sizes="(max-width: 768px) 100vw, 400px" loading="lazy" className="object-cover group-hover:scale-105 transition-transform duration-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {feature.badge && (
            <span className="absolute top-2 left-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-400 text-terminal-900 tracking-wider">
              {feature.badge}
            </span>
          )}
        </div>
        <div className="p-4">
          <h4 className="text-xs font-mono font-bold text-white group-hover:text-neon-400 transition-colors mb-1.5">{feature.title}</h4>
          <p className="text-[11px] font-mono text-white/40 leading-relaxed line-clamp-2">{feature.description}</p>
        </div>
      </Link>

      {/* Rest of the About cluster */}
      <div className="flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-4">More about me</p>
          <div className="space-y-3">
            {rest.map((item) => (
              <Link
                key={item.title}
                role="menuitem"
                href={item.href}
                onClick={() => playClick()}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 hover:border-neon-400/25 hover:bg-white/[0.03] transition-all group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40"
              >
                {item.image && <Image src={item.image} alt="" width={40} height={40} loading="lazy" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-mono font-bold text-white group-hover:text-neon-400 transition-colors truncate">{item.title}</h4>
                  <p className="text-[10px] font-mono text-white/40 truncate">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
