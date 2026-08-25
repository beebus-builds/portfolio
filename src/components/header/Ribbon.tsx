"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "@/lib/audio";

interface Crumb { label: string; href: string }

export default function Ribbon({
  crumbs,
  tickerText,
  tickerIndex,
  sparkPath,
  mem,
  ktmTime,
  audioMuted,
  minimized,
  onAudioToggle,
  onMinimize,
  onMaximize,
  onClose,
}: {
  crumbs: Crumb[];
  tickerText: string;
  tickerIndex: number;
  sparkPath: string;
  mem: number;
  ktmTime: string;
  audioMuted: boolean;
  minimized: boolean;
  onAudioToggle: (e: React.MouseEvent) => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className={`relative z-10 hidden md:flex w-full border-b border-white/[0.06] bg-terminal-950/50 px-6 items-center justify-between select-none text-[10px] font-mono tracking-wider transition-all duration-300 overflow-hidden ${
        minimized ? "h-[6px] opacity-30" : "h-[30px]"
      }`}
    >
      {!minimized && (
        <>
          <div className="flex items-center gap-3 text-white/35 min-w-0">
            <span className="flex items-center gap-1.5 text-emerald-400 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              SYS
            </span>
            <span className="flex items-center gap-1 text-white/25">
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <span key={c.href + i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-white/15">/</span>}
                    {isLast ? (
                      <span aria-current="page" className="text-white/70">{c.label}</span>
                    ) : (
                      <Link href={c.href} onClick={() => playClick()} className="hover:text-neon-400 transition-colors focus-visible:outline-none focus-visible:text-neon-400 focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm">
                        {c.label}
                      </Link>
                    )}
                  </span>
                );
              })}
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-white/15">
              <span>::</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={tickerIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28 }}
                  className="text-white/30 hidden xl:inline"
                >
                  {tickerText}
                </motion.span>
              </AnimatePresence>
              <span>::</span>
            </span>
            <span className="hidden xl:flex items-center gap-2 text-white/25">
              <svg width="60" height="14" viewBox="0 0 60 14" className="overflow-visible">
                <path d={sparkPath} fill="none" stroke="rgba(84,230,212,0.9)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="tabular-nums text-neon-400/80">{mem.toFixed(1)} MB</span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-white/35 font-bold hidden sm:inline">
              KTM <span className="text-neon-400 tabular-nums">[{ktmTime || "00:00:00"}]</span>
            </span>
            <button
              onClick={onAudioToggle}
              className={`hidden sm:flex items-center gap-1 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm ${audioMuted ? "text-white/20 hover:text-white/50" : "text-neon-400/80 hover:text-neon-400"}`}
              title={audioMuted ? "Unmute" : "Mute"}
            >
              {audioMuted ? (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l7 7V12.73l4.73 4.73c-.58.46-1.24.81-1.96 1.01v2.06c1.24-.26 2.37-.81 3.32-1.57L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  <span>AUDIO OFF</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l7 7V3L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                  <span>AUDIO ON</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      <div className="flex items-center gap-2 text-white/25 ml-auto">
        <button onClick={onMinimize} className="hover:text-white transition-colors cursor-pointer px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm" aria-label="Minimize ribbon">
          [ {minimized ? "+" : "—"} ]
        </button>
        <button onClick={onMaximize} className="hover:text-white transition-colors cursor-pointer px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm" aria-label="Fullscreen">
          [ ▢ ]
        </button>
        <button onClick={onClose} className="hover:text-red-400 transition-colors cursor-pointer px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400/40 rounded-sm" aria-label="Close ribbon">
          [ ✕ ]
        </button>
      </div>
    </div>
  );
}
