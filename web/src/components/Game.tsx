"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import Spaceship from './Spaceship';
import Universe from './Universe';
import GameUI from './GameUI';
import UniverseHUD from './UniverseHUD';
import Terminal from './Terminal';
import DecryptionGame from './DecryptionGame';
import { audioManager } from '@/lib/audio';

export const planetData = [
  { id: 'about', position: new THREE.Vector3(-20, 0, -30), label: 'S-1: CORE_MEMORIES', color: '#a855f7' },
  { id: 'skills', position: new THREE.Vector3(20, 0, -25), label: 'S-2: TECH_LAB', color: '#3b82f6' },
  { id: 'experience', position: new THREE.Vector3(30, 0, 15), label: 'S-3: TEMPORAL_GRID', color: '#10b981' },
  { id: 'projects', position: new THREE.Vector3(-30, 0, 15), label: 'S-4: THE_FORGE', color: '#6366f1' },
  { id: 'contact', position: new THREE.Vector3(0, 0, 35), label: 'S-5: SIGNAL_BEACON', color: '#ec4899' },
];

export default function Game() {
  const [targetPlanetId, setTargetPlanetId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [interactedZone, setInteractedZone] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const playerVel = useRef(new THREE.Vector3(0, 0, 0));

  const handleWarpSelect = useCallback((id: string) => {
    if (!isLinked) {
      audioManager.init();
      setIsLinked(true);
    }
    audioManager.playBlip();
    setTargetPlanetId(id);
    setPanelOpen(false);
  }, [isLinked]);

  const handleArrival = useCallback(() => {
    if (targetPlanetId) {
      setIsDecrypting(true);
    }
  }, [targetPlanetId]);

  const handleDecryptionSuccess = useCallback(() => {
    setIsDecrypting(false);
    setInteractedZone(targetPlanetId);
    setPanelOpen(true);
    audioManager.playBlip();
  }, [targetPlanetId]);

  const handleCommand = useCallback((cmd: string) => {
    if (cmd.startsWith('/warp ')) {
      const id = cmd.replace('/warp ', '').trim();
      const planet = planetData.find(p => p.id === id || p.label.toLowerCase().includes(id));
      if (planet) {
        handleWarpSelect(planet.id);
      } else {
        // Error handled by terminal's internal history usually
      }
    } else if (cmd === '/status') {
      // Just a fluff command
    } else if (cmd === '/help') {
      // Just a fluff command
    }
  }, [handleWarpSelect]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden select-none">
      <AnimatePresence>
        {!isLinked && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950"
          >
            <div className="text-center space-y-8 max-w-lg px-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="text-indigo-500 font-mono text-[10px] tracking-[0.4em] uppercase"
              >
                ESTABLISHING QUANTUM LINK...
              </motion.div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-5xl md:text-6xl font-black text-white tracking-widest uppercase italic font-mono"
              >
                GALACTIC<span className="text-indigo-600">_VOID</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-zinc-500 font-mono text-xs leading-relaxed"
              >
                Operate the command deck. Warp to sectors. Decrypt the core.
              </motion.p>
              <motion.button 
                onClick={() => handleWarpSelect('about')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-indigo-600 border border-indigo-400/30 text-white font-mono text-xs tracking-widest font-bold uppercase rounded-xl hover:bg-indigo-500 pointer-events-auto"
              >
                INITIALIZE INTERFACE
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Canvas 
        camera={{ position: [0, 10, 15], fov: 45 }} 
        gl={{ antialias: false, stencil: false, depth: true }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 30, 140]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        
        <Universe />
        
        <Spaceship 
          targetPlanetId={targetPlanetId} 
          planets={planetData} 
          onArrival={handleArrival} 
        />
        
        <EffectComposer>
          <Bloom 
            intensity={1.8} 
            luminanceThreshold={0.08} 
            luminanceSmoothing={0.9} 
            mipmapBlur 
          />
          <Vignette eskil={false} offset={0.15} darkness={1.2} />
        </EffectComposer>
      </Canvas>

      {isLinked && (
        <UniverseHUD 
          activeZone={targetPlanetId} 
          onWarpTrigger={handleWarpSelect}
          shipPosition={playerPos.current}
        />
      )}

      <Terminal onCommand={handleCommand} />

      <AnimatePresence>
        {isDecrypting && (
          <DecryptionGame 
            sectorId={targetPlanetId || 'UNKNOWN'} 
            onSuccess={handleDecryptionSuccess} 
            onCancel={() => setIsDecrypting(false)} 
          />
        )}
      </AnimatePresence>

      <GameUI 
        activeZone={interactedZone} 
        isOpen={panelOpen} 
        onClose={() => setPanelOpen(false)} 
      />
    </div>
  );
}
