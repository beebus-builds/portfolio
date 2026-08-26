"use client";

import Link from "next/link";
import { workLinks, ecosystemLinks } from "./data";
import { playClick } from "@/lib/audio";

export default function MegaMenuWork() {
  return (
    <div
      role="menu"
      className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[720px] bg-terminal-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.75),0_0_0_1px_rgba(84,230,212,0.06)] z-50 grid grid-cols-[1.25fr_0.85fr_1fr] gap-6 animate-fade-in"
    >
      <div className="border-r border-white/5 pr-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-neon-400/70 mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-neon-400 rounded-full" /> Case Studies
        </p>
        <div className="space-y-3">
          {workLinks.map((item) => (
            <Link
              key={item.title}
              role="menuitem"
              href={item.href}
              onClick={() => playClick()}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 hover:border-neon-400/25 hover:bg-white/[0.03] transition-all group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40"
            >
              {item.image && <img src={item.image} alt="" loading="lazy" className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/10 group-hover:border-neon-400/20 transition-colors" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="text-xs font-mono font-bold text-white group-hover:text-neon-400 transition-colors truncate">{item.title}</h4>
                  {item.badge && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-400/10 text-neon-400 border border-neon-400/20">{item.badge}</span>}
                </div>
                <p className="text-[10px] font-mono text-white/40 line-clamp-1 leading-normal">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border-r border-white/5 pr-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-4">Ecosystem</p>
        <div className="space-y-2">
          {ecosystemLinks.map((item) => (
            <Link
              key={item.label}
              role="menuitem"
              href={item.href}
              onClick={() => playClick()}
              className="flex items-center gap-3 p-2 rounded-lg text-[11px] font-mono text-white/55 hover:text-white hover:bg-white/5 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40"
            >
              <span className={item.shape === "square" ? "shape-square shrink-0" : item.shape === "triangle" ? "shape-triangle shrink-0" : "shape-circle shrink-0"} style={item.shape !== "triangle" ? { background: item.color } as React.CSSProperties : { borderBottomColor: item.color } as unknown as React.CSSProperties} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/35 mb-4">Engineer Profile</p>
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.015]">
            <div className="flex items-center gap-3 mb-3">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="" loading="lazy" className="w-9 h-9 rounded-full object-cover border border-neon-400/30" />
              <div>
                <p className="text-xs font-mono font-bold text-white">@beebus-builds</p>
                <p className="text-[10px] font-mono text-neon-400">Full-Stack Dev</p>
              </div>
            </div>
            <p className="text-[11px] font-mono text-white/40 leading-relaxed">Building scalable architectures &amp; secure cryptographic tools.</p>
          </div>
        </div>
        <Link href="/projects" onClick={() => playClick()} className="btn-neon text-center py-2 text-[11px] font-mono tracking-widest uppercase mt-4 block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-full">
          All projects →
        </Link>
      </div>
    </div>
  );
}
