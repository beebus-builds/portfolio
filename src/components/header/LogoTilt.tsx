"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { playClick } from "@/lib/audio";

export default function LogoTilt() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ rx: -dy * 10, ry: dx * 12 });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0 });

  return (
    <Link
      href="/"
      aria-label="Home"
      onClick={() => playClick()}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="flex items-center gap-3 shrink-0 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-lg"
      style={{ perspective: "600px" }}
    >
      <div
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`, transformStyle: "preserve-3d" }}
        className="transition-transform duration-150 ease-out will-change-transform"
      >
        <Logo size={32} />
      </div>
      <span className="hidden sm:flex flex-col leading-none">
        <span className="text-[12px] font-mono font-bold tracking-tight text-white/85 group-hover:text-white transition-colors">bibashpoudel.dev</span>
        <span className="text-[9px] font-mono tracking-widest text-white/25 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Sindhuli • KTM
        </span>
      </span>
    </Link>
  );
}
