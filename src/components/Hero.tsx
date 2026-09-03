"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects } from "@/lib/projects";
import { playClick } from "@/lib/audio";

// tech ticker for Visual-depth 6
const TECH = ["Next.js", "TypeScript", "Neon Postgres", "Three.js", "Tailwind", "Framer Motion", "Cloudinary", "Node.js"];

// typewriter commands + rotating statuses (module scope: stable across renders)
const TYPE_COMMANDS = ["whoami --verbose", "cat ~/sindhuli.txt", "ls skills --color"];

export default function Hero() {
  const statsBase = [
    { label: "Years coding", value: "4+", numeric: 4, suffix: "+" },
    { label: "Shipped projects", value: projects.length.toString().padStart(2, "0"), numeric: projects.length, suffix: "" },
    { label: "Based in", value: "Nepal", numeric: null, suffix: "" },
    { label: "Status", value: "Open", numeric: null, suffix: "" },
  ];

  // 1) count-up
  const termRef = useRef<HTMLDivElement | null>(null);
  const [counted, setCounted] = useState(false);
  const [years, setYears] = useState(0);
  const [shipped, setShipped] = useState(0);
  useEffect(() => {
    const el = termRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !counted) {
          setCounted(true);
          let y = 0;
          const yi = setInterval(() => {
            y += 1;
            setYears(y);
            if (y >= 4) clearInterval(yi);
          }, 120);
          let s = 0;
          const target = projects.length;
          const si = setInterval(() => {
            s += 1;
            setShipped(s);
            if (s >= target) clearInterval(si);
          }, 90);
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [counted]);

  // 2) copy on long-press
  const [copied, setCopied] = useState(false);
  const holdRef = useRef<number | null>(null);
  const startHold = () => {
    holdRef.current = window.setTimeout(async () => {
      try {
        await navigator.clipboard.writeText("bibashpoudel@email.com");
        setCopied(true);
        playClick();
        setTimeout(() => setCopied(false), 1800);
      } catch {}
    }, 600);
  };
  const cancelHold = () => {
    if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
  };

  // 4) scroll cue hide
  const [showCue, setShowCue] = useState(true);
  useEffect(() => {
    const onScroll = () => setShowCue(window.scrollY < 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 5) typewriter whoami cycling
  const [cmdIdx, setCmdIdx] = useState(0);
  const [typed, setTyped] = useState(TYPE_COMMANDS[0]);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setCmdIdx((i) => (i + 1) % TYPE_COMMANDS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const target = TYPE_COMMANDS[cmdIdx];
    let i = 0;
    setTyping(true);
    setTyped("");
    const t = setInterval(() => {
      i += 1;
      setTyped(target.slice(0, i));
      if (i >= target.length) { clearInterval(t); setTyping(false); }
    }, 28);
    return () => clearInterval(t);
  }, [cmdIdx]);

  // 9) live status rotating
  const statuses = useMemo(() => [
    "currently shipping something new",
    "building iVote encryption — Paillier • liveness",
    "open to internships — avg reply < 24h",
    `KTM ${new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit" })} — online`,
  ], []);
  const [statusIdx, setStatusIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStatusIdx((s) => (s + 1) % statuses.length), 3200);
    return () => clearInterval(id);
  }, [statuses.length]);

  return (
    <section className="relative px-4 sm:px-6 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
      {/* 3) depth orb + grid */}
      <div aria-hidden className="absolute -top-28 -left-24 w-[720px] h-[720px] rounded-full blur-[120px] opacity-[0.04] bg-neon-400 pointer-events-none" />
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: "linear-gradient(rgba(84,230,212,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(84,230,212,0.12) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div aria-hidden className="absolute -right-40 top-20 w-[520px] h-[520px] rounded-full blur-[100px] opacity-[0.03] bg-white pointer-events-none" />

      <div className="max-w-6xl mx-auto grid md:grid-cols-[1.15fr_0.85fr] gap-12 md:gap-8 items-center relative z-10">
        {/* Left */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-400/20 bg-neon-400/5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-neon-400 uppercase">Available for work</span>
          </div>

          <p className="comment-label mb-3">portfolio/hero.tsx</p>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold tracking-tighter text-white leading-[0.98] mb-6">
            Bibash
            <span className="block text-white/35">Poudel</span>
          </h1>

          <p className="text-base md:text-lg text-white/45 max-w-md leading-relaxed mb-6 font-mono">
            Full-stack developer from the hills of Sindhuli, Nepal. I build fast, human-centered web experiences with Next.js &amp; TypeScript.
          </p>

          {/* 6) tech ticker under bio */}
          <div className="relative overflow-hidden max-w-md mb-8 rounded-lg border border-white/5 bg-white/[0.02] py-2 group/tech">
            <div className="flex w-max gap-6 animate-[tech-scroll_18s_linear_infinite] group-hover/tech:[animation-play-state:paused] px-4">
              {[...TECH, ...TECH].map((t, i) => (
                <span key={t + i} className="text-[10px] font-mono tracking-widest text-white/25 whitespace-nowrap">
                  {t} <span className="text-white/10 mx-2">•</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/projects" onClick={() => playClick()} className="btn-neon text-xs font-mono tracking-wider group">
              <span>View my work</span>
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
            <div className="relative">
              <Link
                href="/contact"
                onClick={() => playClick()}
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                className="btn-ghost text-xs font-mono tracking-wider select-none"
                title="Hold 0.6s to copy email"
              >
                Say hello
              </Link>
              <AnimatePresence>
                {copied && (
                  <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-mono px-2 py-1 rounded bg-neon-400 text-terminal-900 whitespace-nowrap">
                    copied bibashpoudel@email.com
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="text-[10px] font-mono text-white/20 mt-2 hidden sm:block">hold Say hello to copy email</p>
        </div>

        {/* Right: terminal — 10) bleed into next section */}
        <div ref={termRef} className="relative md:-mr-4 md:translate-y-2 md:mb-[-24px] z-10">
          <div className="term-window backdrop-blur-[2px] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="term-titlebar">
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-path">~/whoami.sh</span>
              <span className="ml-auto hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
              </span>
            </div>
            <div className="term-body">
              {/* 5) typewriter */}
              <p className="font-mono text-xs text-white/30 mb-6 flex items-center gap-1.5 min-h-[18px]">
                <span className="text-neon-400/70">$</span>
                <span className="text-white/50">{typed}</span>
                <span className={`w-2 h-3 bg-neon-400 ${typing ? "opacity-60" : "animate-pulse"}`} />
              </p>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-5 stat-readout">
                {statsBase.map((s) => {
                  let display = s.value;
                  if (s.numeric !== null && counted) {
                    if (s.label === "Years coding") display = `${years}${s.suffix}`;
                    if (s.label === "Shipped projects") display = shipped.toString().padStart(2, "0");
                  } else if (s.numeric !== null && !counted) {
                    display = `0${s.suffix}`.padStart(2, "0");
                  }
                  return (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd className={`${s.value === "Open" ? "text-neon-400" : ""} tabular-nums`}>{display}</dd>
                    </div>
                  );
                })}
              </dl>

              {/* 9) live status rotating */}
              <div className="mt-7 pt-5 border-t border-white/5 flex items-center gap-2 min-h-[22px]">
                <span className="chess-thinking-dot" />
                <span className="chess-thinking-dot" />
                <span className="chess-thinking-dot" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={statusIdx}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className="text-[11px] font-mono text-white/25 ml-1 truncate"
                  >
                    {statuses[statusIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* 8) command preview */}
              <button
                onClick={() => { playClick(); window.dispatchEvent(new Event("toggle-command-palette")); }}
                className="mt-4 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-neon-400/20 transition-colors text-left group/cmd focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/30 cursor-pointer"
              >
                <span className="text-neon-400/60 text-[11px] font-mono">bibash@dev:~ $</span>
                <span className="flex-1 text-[11px] font-mono text-white/20 group-hover/cmd:text-white/40">type to search…</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-white/25">⌘K</span>
              </button>
            </div>
          </div>
          <div className="hidden md:block absolute -z-10 inset-0 translate-x-4 translate-y-4 rounded-[0.85rem] border border-white/5" aria-hidden="true" />
        </div>
      </div>

      {/* 4) scroll cue */}
      <AnimatePresence>
        {showCue && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1.5 text-white/25">
            <span className="text-[10px] font-mono tracking-widest uppercase">scroll — featured.json</span>
            <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.4, repeat: Infinity }} className="text-sm">↓</motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes tech-scroll { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
    </section>
  );
}
