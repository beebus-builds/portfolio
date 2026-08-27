"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { playClick } from "@/lib/audio";
import { workLinks } from "./data";

export default function MobileDrawer({
  open,
  crumbs,
  ktmTime,
  isActive,
  onClose,
}: {
  open: boolean;
  crumbs: { label: string; href: string }[];
  ktmTime: string;
  isActive: (href: string) => boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="md:hidden border-t border-white/5 py-3 space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/25 px-3 py-1">
            <span className="text-neon-400">{crumbs.map((c) => c.label).join(" / ")}</span>
            <span className="ml-auto tabular-nums text-white/30">{ktmTime}</span>
          </div>
          <Link href="/about" onClick={() => { playClick(); onClose(); }} className={`block px-3 py-2.5 text-xs font-mono rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 ${isActive("/about") ? "text-neon-400 bg-neon-400/5" : "text-white/60 hover:text-white hover:bg-white/5"}`}>About</Link>
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/20">About also includes</div>
          <Link href="/education" onClick={() => { playClick(); onClose(); }} className="ml-4 block px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">Education</Link>
          <Link href="/skills" onClick={() => { playClick(); onClose(); }} className="ml-4 block px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">Skills Matrix</Link>
          <Link href="/resume.pdf" onClick={() => { playClick(); onClose(); }} className="ml-4 block px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">Résumé / CV</Link>
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/20">Work</div>
          <Link href="/projects" onClick={() => { playClick(); onClose(); }} className="ml-4 block px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">All Projects</Link>
          {workLinks.map((w) => (
            <Link key={w.href} href={w.href} onClick={() => { playClick(); onClose(); }} className="ml-4 flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: w.color }} aria-hidden />
              {w.title}
            </Link>
          ))}
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-white/20">Bytes</div>
          <Link href="/blog" onClick={() => { playClick(); onClose(); }} className="ml-4 block px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">Blog</Link>
          <Link href="/chess" onClick={() => { playClick(); onClose(); }} className="ml-4 block px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">Play Chess</Link>
          <Link href="/commands" onClick={() => { playClick(); onClose(); }} className="ml-4 block px-3 py-1.5 text-xs font-mono text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">Terminal CLI</Link>
          <Link href="/contact" onClick={() => { playClick(); onClose(); }} className={`block px-3 py-2.5 text-xs font-mono rounded-lg mt-2 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 ${isActive("/contact") ? "text-neon-400 bg-neon-400/5" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Contact — Available for work
          </Link>
          <button onClick={() => { playClick(); window.dispatchEvent(new Event("toggle-command-palette")); onClose(); }} className="w-full mt-2 px-3 py-2.5 text-xs font-mono text-neon-400 bg-neon-400/5 border border-neon-400/15 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40">bibash@dev:~ $ search ⌘K</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
