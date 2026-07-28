"use client";

import { useState, useRef, useCallback } from 'react';
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
import { GAME, PLANETS } from '@/lib/config';

export const planetData = PLANETS.map(p => ({
  ...p,
  position: new THREE.Vector3(p.position.x, 0, p.position.z),
}));

export default function Game() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'orbit' | 'gameover'>('menu');
  const [targetPlanetId, setTargetPlanetId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [interactedZone, setInteractedZone] = useState<string | null>(null);
  
  // Game Stats
  const [shield, setShield] = useState(100);
  const [decryption, setDecryption] = useState(0);

  const playerPos = useRef(new THREE.Vector3(0, 0, 0));

  const handleWarpSelect = useCallback((id: string) => {
    if (!isLinked) {
      audioManager.init();
      setIsLinked(true);
    }
    audioManager.playBlip();
    setTargetPlanetId(id);
    setShield(100);
    setDecryption(0);
    setGameState('playing');
    setPanelOpen(false);
  }, [isLinked]);

  const handleCollect = useCallback(() => {
    audioManager.playBlip();
    setDecryption(prev => {
      const next = prev + GAME.DECRYPTION_GAIN_PER_COLLECT;
      if (next >= GAME.DECRYPTION_TARGET) {
        setGameState('orbit');
      }
      return next;
    });
  }, []);

  const handleHit = useCallback(() => {
    audioManager.playThruster(1);
    setShield(prev => {
      const next = prev - GAME.SHIELD_LOSS_PER_HIT;
      if (next <= 0) {
        setGameState('gameover');
      }
      return next;
    });
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    if (cmd.startsWith('/warp ')) {
      const id = cmd.replace('/warp ', '').trim();
      const planet = planetData.find(p => p.id === id || p.label.toLowerCase().includes(id));
      if (planet) {
        handleWarpSelect(planet.id);
      }
    } else if (cmd === '/restart') {
      setGameState('menu');
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
                A gamified odyssey. Collect data cores to decrypt sectors.
              </motion.p>
              <motion.button 
                onClick={() => handleWarpSelect('about')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-indigo-600 border border-indigo-400/30 text-white font-mono text-xs tracking-widest font-bold uppercase rounded-xl hover:bg-indigo-500 pointer-events-auto"
              >
                LAUNCH MISSION
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
        <fog attach="fog" args={['#000000', 10, 100]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[10, 20, 10]} intensity={1} />
        
        <Universe 
          gameState={gameState} 
          shipPos={playerPos} 
          onCollect={handleCollect} 
          onHit={handleHit} 
          activeZone={targetPlanetId} 
          planets={planetData}
        />
        
        <Spaceship 
          gameState={gameState} 
          shipX={playerPos} 
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
          shield={shield}
          decryption={decryption}
          onRestart={() => setGameState('menu')}
        />
      )}

      <Terminal onCommand={handleCommand} shield={shield} decryption={decryption} />

      <AnimatePresence>
        {gameState === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="text-center space-y-6 max-w-md px-6">
              <div className="w-16 h-16 mx-auto border-2 border-red-500/30 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-2xl font-mono">!</span>
              </div>
              <h2 className="text-3xl font-black text-white font-mono tracking-widest uppercase">SHIELD_OFFLINE</h2>
              <p className="text-zinc-500 font-mono text-xs leading-relaxed">
                CRITICAL DAMAGE SUSTAINED. MISSION TERMINATED.
              </p>
              <button 
                onClick={() => { setGameState('menu'); setShield(100); setDecryption(0); }}
                className="px-8 py-3 bg-red-600/80 border border-red-500/30 text-white font-mono text-xs tracking-widest uppercase rounded-xl hover:bg-red-600 transition-all"
              >
                RESTART MISSION
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState === 'orbit' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold text-white font-mono tracking-widest uppercase">DECRYPTION COMPLETE</h2>
              <p className="text-indigo-400 font-mono text-sm">S-S-S-SYNCING... ACCESS GRANTED</p>
              <button 
                onClick={() => {
                  setInteractedZone(targetPlanetId);
                  setPanelOpen(true);
                  setGameState('menu');
                }}
                className="px-8 py-3 bg-indigo-600 text-white font-mono text-xs rounded-lg hover:bg-indigo-500"
              >
                ENTER SECTOR
              </button>
            </div>
          </motion.div>
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
