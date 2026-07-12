"use client";

import { motion } from 'framer-motion';

export default function UniverseHUD({ position, velocity, activeZone }: { position: THREE.Vector3; velocity: THREE.Vector3; activeZone: string | null }) {
  const speed = Math.round(velocity.length() * 10);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center">
      {/* Center Crosshair */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border border-indigo-500/30 rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-indigo-400 rounded-full" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-2 bg-indigo-500/50" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-2 bg-indigo-500/50" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-px bg-indigo-500/50" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-px bg-indigo-500/50" />
      </div>

      {/* Top Left: Coordinates */}
      <div className="absolute top-8 left-8 font-mono text-[10px] text-indigo-400/70 space-y-1">
        <div className="flex justify-between gap-8">
          <span>SECTOR_COORD:</span>
          <span className="text-white">X:{position.x.toFixed(2)} Z:{position.z.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-8">
          <span>VELOCITY_VEC:</span>
          <span className="text-white">{speed} LY/S</span>
        </div>
        <div className="h-px w-full bg-indigo-500/20 my-1" />
        <div className="flex justify-between gap-8">
          <span>STATUS:</span>
          <span className="text-green-400">STABLE</span>
        </div>
      </div>

      {/* Top Right: Target Data */}
      <div className="absolute top-8 right-8 font-mono text-[10px] text-indigo-400/70 text-right space-y-1">
        <div className="flex justify-end gap-8">
          <span>TARGET_LOCKED:</span>
          <span className={activeZone ? 'text-white' : 'text-zinc-600'}>
            {activeZone ? activeZone.toUpperCase() : 'NONE'}
          </span>
        </div>
        <div className="flex justify-end gap-8">
          <span>SYNC_LEVEL:</span>
          <span className="text-white">{activeZone ? '98.4%' : '0.0%'}</span>
        </div>
        <div className="h-px w-full bg-indigo-500/20 my-1" />
        <div className="flex justify-end gap-8">
          <span>SENSORS:</span>
          <span className="text-green-400">ACTIVE</span>
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-12 flex items-end justify-center gap-1 opacity-50">
        {[...Array(12)].map((_, i) => (
          <motion.div 
            key={i}
            animate={{ height: [4, 12, 4] }}
            transition={{ repeat: Infinity, duration: 1 + Math.random(), delay: i * 0.1 }}
            className="w-1 bg-indigo-500/40"
          />
        ))}
      </div>
    </div>
  );
}
