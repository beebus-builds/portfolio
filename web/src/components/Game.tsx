"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Player from './Player';
import World from './World';
import GameUI from './GameUI';

export const zoneData = [
  { id: 'about', position: new THREE.Vector3(-6, 0, -5), label: 'About Me', color: '#8b5cf6' },
  { id: 'projects', position: new THREE.Vector3(6, 0, -5), label: 'Projects', color: '#4f46e5' },
  { id: 'contact', position: new THREE.Vector3(0, 0, 6), label: 'Contact', color: '#ec4899' },
];

export default function Game() {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [interactedZone, setInteractedZone] = useState<string | null>(null);
  const playerPos = useRef(new THREE.Vector3(0, 0.5, 0));
  const [showHelp, setShowHelp] = useState(true);
  const prevZone = useRef<string | null>(null);

  const handleProximity = useCallback((zoneId: string | null) => {
    if (zoneId !== prevZone.current) {
      prevZone.current = zoneId;
      setActiveZone(zoneId);
      if (!zoneId) setPanelOpen(false);
    }
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && activeZone && !panelOpen) {
        setInteractedZone(activeZone);
        setPanelOpen(true);
      } else if (e.key.toLowerCase() === 'e' && panelOpen) {
        setPanelOpen(false);
      } else if (e.key === 'Escape' && panelOpen) {
        setPanelOpen(false);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [activeZone, panelOpen]);

  return (
    <div className="fixed inset-0 bg-zinc-950">
      {showHelp && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 bg-zinc-900/80 backdrop-blur text-white px-6 py-3 rounded-full text-sm font-mono border border-zinc-700/50 flex items-center gap-3">
          <span>Use <kbd className="text-indigo-400 font-bold bg-zinc-800 px-1.5 py-0.5 rounded">WASD</kbd> to explore</span>
          <button onClick={() => setShowHelp(false)} className="text-zinc-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>
      )}

      {activeZone && !panelOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 text-sm font-mono pointer-events-none animate-bounce">
          <span className="bg-zinc-900/80 backdrop-blur text-zinc-300 px-5 py-2.5 rounded-full border border-zinc-700/50 inline-flex items-center gap-2">
            Press <kbd className="text-indigo-400 font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-xs">E</kbd> to interact
          </span>
        </div>
      )}

      <Canvas camera={{ position: [0, 12, 14], fov: 40 }}>
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 14, 22]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} />
        <pointLight position={[-6, 4, -5]} color="#8b5cf6" intensity={1} distance={8} />
        <pointLight position={[6, 4, -5]} color="#4f46e5" intensity={1} distance={8} />
        <pointLight position={[0, 4, 6]} color="#ec4899" intensity={1} distance={8} />
        <World activeZone={activeZone} />
        <Player position={playerPos} zones={zoneData} onProximity={handleProximity} />
      </Canvas>

      <GameUI activeZone={interactedZone} isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
