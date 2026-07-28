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
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'fail'>('idle');

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
      setFeedback('success');
      setTimeout(() => onSuccess(), 600);
    } else {
      setFeedback('fail');
      setTimeout(() => setFeedback('idle'), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={feedback === 'fail' ? { x: [-6, 6, -4, 4, 0], scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`bg-zinc-900 border-2 p-8 rounded-3xl text-center max-w-md relative overflow-hidden ${
          feedback === 'success' ? 'border-emerald-500/50' : feedback === 'fail' ? 'border-red-500/50' : 'border-indigo-500/50'
        }`}
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
            className={`w-4 shadow-[0_0_15px_#6366f1] ${
              feedback === 'success' ? 'bg-emerald-500' : feedback === 'fail' ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            style={{ height: `${currentValue}%` }}
            animate={{ height: `${currentValue}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        </div>

        {feedback === 'fail' && (
          <p className="text-red-400 font-mono text-xs mb-4 tracking-wider">SYNC_FAILED — SIGNAL_MISALIGNMENT</p>
        )}
        {feedback === 'success' && (
          <p className="text-emerald-400 font-mono text-xs mb-4 tracking-wider">S-S-S-SYNC_SUCCESSFUL</p>
        )}

        <div className="flex gap-4 justify-center">
          <button 
            onClick={onCancel}
            disabled={feedback === 'success'}
            className="px-6 py-2 bg-zinc-800 text-zinc-400 font-mono text-xs rounded-lg hover:bg-zinc-700 transition-colors disabled:opacity-30"
          >
            ABORT
          </button>
          <button 
            onClick={handleSync}
            disabled={feedback !== 'idle'}
            className="px-8 py-2 bg-indigo-600 text-white font-bold font-mono text-xs rounded-lg hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {feedback === 'success' ? 'SYNCED' : feedback === 'fail' ? 'RETRY' : 'SYNC SIGNAL'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
