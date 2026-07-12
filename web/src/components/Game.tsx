"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import Spaceship from './Spaceship';
import Universe from './Universe';
import GameUI from './GameUI';
import UniverseHUD from './UniverseHUD';
import { audioManager } from '@/lib/audio';

export const zoneData = [
  { id: 'about', position: new THREE.Vector3(-20, 0, -30), label: 'S-1: THE_CORE', color: '#a855f7' },
  { id: 'projects', position: new THREE.Vector3(20, 0, -30), label: 'S-2: THE_FORGE', color: '#6366f1' },
  { id: 'contact', position: new THREE.Vector3(0, 0, 30), label: 'S-3: THE_BEACON', color: '#ec4899' },
];

export default function Game() {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [interactedZone, setInteractedZone] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const playerVel = useRef(new THREE.Vector3(0, 0, 0));
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
        audioManager.playBlip();
        setInteractedZone(activeZone);
        setPanelOpen(true);
      } else if (e.key.toLowerCase() === 'e' && panelOpen) {
        audioManager.playBlip();
        setPanelOpen(false);
      } else if (e.key === 'Escape' && panelOpen) {
        audioManager.playBlip();
        setPanelOpen(false);
      }
      
      if (!isLinked && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
        audioManager.init();
        setIsLinked(true);
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [activeZone, panelOpen, isLinked]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <AnimatePresence>
        {!isLinked && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
          >
            <div className="text-center space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="text-indigo-500 font-mono text-xs tracking-[0.3em] uppercase mb-4"
              >
                ESTABLISHING INTERSTELLAR LINK...
              </motion.div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl md:text-7xl font-black text-white tracking-tighter italic"
              >
                GALACTIC<span className="text-indigo-600">_VOID</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-zinc-500 font-mono text-sm"
              >
                Press <kbd className="text-indigo-400 bg-zinc-900 px-2 py-1 rounded">WASD</kbd> to engage thrusters
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeZone && !panelOpen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 text-sm font-mono pointer-events-none animate-bounce">
          <span className="bg-zinc-900/80 backdrop-blur text-zinc-300 px-5 py-2.5 rounded-full border border-zinc-700/50 inline-flex items-center gap-2">
            Press <kbd className="text-indigo-400 font-bold bg-zinc-800 px-1.5 py-0.5 rounded text-xs">E</kbd> to interface with {zoneData.find(z => z.id === activeZone)?.label}
          </span>
        </div>
      )}

      <Canvas camera={{ position: [0, 12, 14], fov: 40 }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 20, 100]} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        <World activeZone={activeZone} />
        <Spaceship position={playerPos} velocity={playerVel} zones={zoneData} onProximity={handleProximity} />
      </Canvas>

      <UniverseHUD position={playerPos.current} velocity={playerVel.current} activeZone={activeZone} />
      <GameUI activeZone={interactedZone} isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  );
}
