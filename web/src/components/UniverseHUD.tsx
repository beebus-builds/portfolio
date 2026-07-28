"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Command } from 'lucide-react';
import CommandPalette from './CommandPalette';

export default function UniverseHUD({ 
  activeZone, 
  onWarpTrigger,
  shipPosition,
  shield,
  decryption,
  onRestart
}: { 
  activeZone: string | null; 
  onWarpTrigger: (id: string) => void;
  shipPosition: THREE.Vector3;
  shield: number;
  decryption: number;
  onRestart: () => void;
}) {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
        
        {/* TOP HUD: Telemetry & Status */}
        <div className="flex justify-between items-start">
          <div className="bg-zinc-950/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 pointer-events-auto">
            <div className="relative w-20 h-20 border border-emerald-500/20 rounded-full flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 border border-emerald-500/10 rounded-full scale-75" />
              <div className="absolute inset-0 border border-emerald-500/10 rounded-full scale-50" />
              <div className="absolute inset-0 border-l border-emerald-500/20 rounded-full origin-center animate-[spin_4s_linear_infinite]" />
              <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
            </div>
            <div className="font-mono text-[9px] text-emerald-400 space-y-0.5 select-none">
              <div className="text-[10px] font-bold text-white tracking-widest">TACTICAL_RADAR</div>
              <div>SCAN_FREQ: 24.8 GHz</div>
              <div>STATUS: ONLINE</div>
              <div>COORD: {shipPosition?.x.toFixed(1)}, {shipPosition?.z.toFixed(1)}</div>
            </div>
          </div>

          <div className="bg-zinc-950/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl font-mono text-[9px] text-indigo-400 space-y-2 select-none text-right">
            <div className="text-[10px] font-bold text-white tracking-widest">SYSTEM_METRICS</div>
            <div className="flex justify-end gap-4">
              <span className="text-zinc-500">SHIELD:</span>
              <span className={shield < 40 ? 'text-red-500 animate-pulse' : 'text-white'}>{shield}%</span>
            </div>
            <div className="flex justify-end gap-4">
              <span className="text-zinc-500">DECRYPT:</span>
              <span className="text-white">{decryption}%</span>
            </div>
          </div>
        </div>

        {/* CENTER RETICLE */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border border-indigo-500/10 rounded-full animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 bg-indigo-500/30" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-3 bg-indigo-500/30" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px bg-indigo-500/30" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-px bg-indigo-500/30" />
          </div>
        </div>

        {/* BOTTOM COMMAND PALETTE NAVBAR TRIGGER */}
        <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto pointer-events-auto">
          <button
            onClick={() => setIsPaletteOpen(true)}
            className="group w-full bg-zinc-950/90 border border-indigo-500/40 hover:border-indigo-500 backdrop-blur-xl px-5 py-4 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.15)] flex items-center justify-between transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl group-hover:scale-105 transition-transform">
                <Command size={18} className="text-indigo-400 animate-pulse" />
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] font-bold text-white tracking-widest">COMMAND PALETTE NAVIGATION</div>
                <div className="text-[9px] text-zinc-500">Active Sector: {activeZone || 'None'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-indigo-300 group-hover:bg-indigo-500/20 transition-colors">
                ⌘K
              </span>
            </div>
          </button>
          
          {/* Decryption Progress Bar */}
          <div className="w-full max-w-md h-1 bg-zinc-800 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" 
              animate={{ width: `${decryption}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
          <span className="text-[9px] text-zinc-600 font-mono tracking-widest uppercase select-none">
            SYNCING_DATA_STREAM... {decryption}%
          </span>
        </div>
      </div>

      <CommandPalette 
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onWarpTrigger={onWarpTrigger}
        onRestart={onRestart}
      />
    </>
  );
}
