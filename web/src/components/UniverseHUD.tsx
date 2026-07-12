"use client";

import { motion } from 'framer-motion';
import * as THREE from 'three';

const navigationPoints = [
  { id: 'about', index: 'S-1', title: 'MEMORIES', color: 'border-purple-500/30 text-purple-400 bg-purple-500/5', dotColor: 'bg-purple-500' },
  { id: 'skills', index: 'S-2', title: 'TECH_LAB', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5', dotColor: 'bg-blue-500' },
  { id: 'experience', index: 'S-3', title: 'CHRONO', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5', dotColor: 'bg-emerald-500' },
  { id: 'projects', index: 'S-4', title: 'FORGE', color: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/5', dotColor: 'bg-indigo-500' },
  { id: 'contact', index: 'S-5', title: 'BEACON', color: 'border-pink-500/30 text-pink-400 bg-pink-500/5', dotColor: 'bg-pink-500' },
];

export default function UniverseHUD({ 
  activeZone, 
  onWarpTrigger,
  shipPosition
}: { 
  activeZone: string | null; 
  onWarpTrigger: (id: string) => void;
  shipPosition: THREE.Vector3;
}) {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 flex flex-col justify-between p-8">
      
      {/* TOP HEADER STATUS */}
      <div className="flex justify-between items-start">
        {/* Left: Interactive Tactical Minimap Radar */}
        <div className="bg-zinc-950/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl flex items-center gap-4 pointer-events-auto">
          <div className="relative w-20 h-20 border border-emerald-500/20 rounded-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 border border-emerald-500/10 rounded-full scale-75" />
            <div className="absolute inset-0 border border-emerald-500/10 rounded-full scale-50" />
            
            {/* Sweep radar hand */}
            <div className="absolute inset-0 border-l border-emerald-500/20 rounded-full origin-center animate-[spin_4s_linear_infinite]" />
            
            {/* Sun in center */}
            <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#ffffff]" />
            
            {/* Planet Nodes relative positioning */}
            <div className="absolute top-[25%] left-[25%] w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_6px_#a855f7]" title="S-1" />
            <div className="absolute top-[25%] right-[25%] w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_6px_#3b82f6]" title="S-2" />
            <div className="absolute bottom-[35%] right-[20%] w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" title="S-3" />
            <div className="absolute bottom-[35%] left-[20%] w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_6px_#6366f1]" title="S-4" />
            <div className="absolute bottom-[10%] left-[45%] w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_6px_#ec4899]" title="S-5" />
          </div>
          
          <div className="font-mono text-[9px] text-emerald-400 space-y-0.5 select-none">
            <div className="text-[10px] font-bold text-white tracking-widest">TACTICAL_RADAR</div>
            <div>SCAN_FREQ: 24.8 GHz</div>
            <div>STATUS: ONLINE // RADIAL</div>
            <div>RANGE: 1500 AU</div>
          </div>
        </div>

        {/* Right: Quantum Telemetry */}
        <div className="bg-zinc-950/90 border border-white/10 backdrop-blur-xl p-4 rounded-2xl font-mono text-[9px] text-indigo-400 space-y-0.5 select-none text-right">
          <div className="text-[10px] font-bold text-white tracking-widest">TELEMETRY_LINK</div>
          <div>SHIP_X: {shipPosition?.x.toFixed(1) ?? '0.0'}</div>
          <div>SHIP_Z: {shipPosition?.z.toFixed(1) ?? '0.0'}</div>
          <div className="text-green-400">COMMS: SYNCHRONIZED</div>
        </div>
      </div>

      {/* CENTER CROSSHAIR RETICLE */}
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

      {/* BOTTOM CONTROL DECK */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xl mx-auto pointer-events-auto">
        <div className="bg-zinc-950/90 border border-white/10 backdrop-blur-xl px-6 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-full">
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <span className="text-[10px] font-mono text-zinc-500 tracking-wider">NAV_STEERING_COORDINATOR</span>
            <span className="text-[9px] font-mono text-zinc-400">WARP_CAPABLE: TRUE</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {navigationPoints.map(point => (
              <button
                key={point.id}
                onClick={() => onWarpTrigger(point.id)}
                className={`py-2.5 px-1 border rounded-lg text-[9px] font-mono tracking-widest uppercase transition-all duration-300 pointer-events-auto flex flex-col items-center gap-1 ${
                  activeZone === point.id 
                    ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]' 
                    : `${point.color} hover:border-white/20 hover:bg-white/5`
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-1 h-1 rounded-full ${point.dotColor}`} />
                  <span>{point.index}</span>
                </div>
                <div className="text-[7px] text-zinc-500 truncate w-full text-center">{point.title}</div>
              </button>
            ))}
          </div>
        </div>
        
        <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase select-none">
          SYSTEMS ONLINE // SELECT SECTOR COORDINATE TO ACTIVATE HYPERDRIVE
        </span>
      </div>

    </div>
  );
}
