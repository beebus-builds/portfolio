"use client";

import { playClick } from "@/lib/audio";

export default function RightCluster({ ribbonClosed, onRestore }: { ribbonClosed: boolean; onRestore: () => void }) {
  return (
    <div className="hidden md:flex items-center gap-1 ml-2">
      <a
        href="https://github.com/beebus-builds"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="GitHub"
        onClick={() => playClick()}
        className="p-2 text-white/35 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-md"
      >
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
        </svg>
      </a>

      <span className="w-px h-4 bg-white/10 mx-1" aria-hidden />

      {ribbonClosed && (
        <button onClick={onRestore} title="Restore ribbon" className="text-[10px] font-mono text-white/40 hover:text-white transition-colors cursor-pointer px-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm">
          + SYS
        </button>
      )}

      <button
        onClick={() => {
          playClick();
          window.dispatchEvent(new Event("toggle-command-palette"));
        }}
        title="Command palette (Ctrl+K)"
        className="inline-flex items-center gap-2 text-[11px] font-mono text-white/35 hover:text-white transition-colors cursor-pointer pl-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm"
      >
        <span className="text-white/20">$</span>
        <span className="hidden lg:inline">search</span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.04] text-white/30">⌘K</span>
      </button>
    </div>
  );
}
