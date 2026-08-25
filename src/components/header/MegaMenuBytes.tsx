"use client";

import Link from "next/link";
import { labLinks } from "./data";
import { playClick } from "@/lib/audio";

export default function MegaMenuBytes() {
  return (
    <div
      role="menu"
      className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[620px] bg-terminal-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.75)] z-50 grid grid-cols-2 gap-6 animate-fade-in"
    >
      <div className="border-r border-white/5 pr-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-neon-400/70 mb-4">Writings &amp; Insights</p>
        <Link
          href="/blog"
          role="menuitem"
          onClick={() => playClick()}
          className="block rounded-xl border border-white/5 hover:border-neon-400/25 hover:bg-white/[0.03] transition-all group overflow-hidden focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40"
        >
          <div className="relative h-28 w-full overflow-hidden">
            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400&auto=format&fit=crop" alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
          <div className="p-4">
            <h4 className="text-xs font-mono font-bold text-white group-hover:text-neon-400 transition-colors mb-1.5">Bridging the gap between code &amp; human design</h4>
            <p className="text-[11px] font-mono text-white/40 leading-relaxed line-clamp-2">Why technology shouldn&apos;t feel sterile — tactile feedback and details.</p>
          </div>
        </Link>
      </div>
      <div className="flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-4">Interactive Lab</p>
          <div className="space-y-3">
            {labLinks.map((item) => (
              <Link
                key={item.title}
                role="menuitem"
                href={item.href}
                onClick={() => playClick()}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 hover:border-neon-400/25 hover:bg-white/[0.03] transition-all group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40"
              >
                {item.image && <img src={item.image} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-white/10" />}
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
