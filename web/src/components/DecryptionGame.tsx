"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DecryptProps {
  sectorId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DecryptionGame({ sectorId, onSuccess, onCancel }: DecryptProps) {
  const [targetValue, setTargetValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setTargetValue(Math.random() * 100);
    
    const interval = setInterval(() => {
      setCurrentValue(prev => {
        const next = prev + (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, next));
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const handleSync = () => {
    const diff = Math.abs(currentValue - targetValue);
    if (diff < 10) {
      onSuccess();
    } else {
      // Shake effect or error
      console.log("Sync failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-zinc-900 border-2 border-indigo-500/50 p-8 rounded-3xl text-center max-w-md relative overflow-hidden"
      >
        {/* Background Grid Animation */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[linear-gradient(rgba(99,102,241,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />

        <h2 className="text-indigo-400 font-mono text-xs tracking-widest uppercase mb-2">Signal Decryption</h2>
        <h3 className="text-white font-bold text-xl mb-8 uppercase tracking-tighter">S-S-S-SYNCING {sectorId}</h3>

        <div className="relative h-48 w-full flex items-end justify-center gap-1 mb-8">
          {/* Target Line */}
          <div 
            className="absolute w-full h-1 bg-white shadow-[0_0_10px_#fff] z-10" 
            style={{ bottom: `${targetValue}%` }} 
          />
          
          {/* Signal Bar */}
          <motion.div 
            className="w-4 bg-indigo-500 shadow-[0_0_15px_#6366f1]" 
            style={{ height: `${currentValue}%` }}
            animate={{ height: `${currentValue}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </div>

        <div className="flex gap-4 justify-center">
          <button 
            onClick={onCancel}
            className="px-6 py-2 bg-zinc-800 text-zinc-400 font-mono text-xs rounded-lg hover:bg-zinc-700 transition-colors"
          >
            ABORT
          </button>
          <button 
            onClick={handleSync}
            className="px-8 py-2 bg-indigo-600 text-white font-bold font-mono text-xs rounded-lg hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all active:scale-95"
          >
            SYNC SIGNAL
          </button>
        </div>
      </motion.div>
    </div>
  );
}
