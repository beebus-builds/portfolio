"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Compass, Cpu, Clock, Code, Mail, RotateCcw, X, CornerDownLeft } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onWarpTrigger: (id: string) => void;
  onRestart: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export default function CommandPalette({ isOpen, onClose, onWarpTrigger, onRestart }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = [
    {
      id: 'about',
      title: 'S-1: CORE_MEMORIES (About)',
      category: 'Navigation',
      icon: <Compass className="text-purple-400" size={18} />,
      action: () => { onWarpTrigger('about'); onClose(); },
      shortcut: '1'
    },
    {
      id: 'skills',
      title: 'S-2: TECH_LAB (Skills)',
      category: 'Navigation',
      icon: <Cpu className="text-blue-400" size={18} />,
      action: () => { onWarpTrigger('skills'); onClose(); },
      shortcut: '2'
    },
    {
      id: 'experience',
      title: 'S-3: TEMPORAL_GRID (Experience)',
      category: 'Navigation',
      icon: <Clock className="text-emerald-400" size={18} />,
      action: () => { onWarpTrigger('experience'); onClose(); },
      shortcut: '3'
    },
    {
      id: 'projects',
      title: 'S-4: THE_FORGE (Projects)',
      category: 'Navigation',
      icon: <Code className="text-indigo-400" size={18} />,
      action: () => { onWarpTrigger('projects'); onClose(); },
      shortcut: '4'
    },
    {
      id: 'contact',
      title: 'S-5: SIGNAL_BEACON (Contact)',
      category: 'Navigation',
      icon: <Mail className="text-pink-400" size={18} />,
      action: () => { onWarpTrigger('contact'); onClose(); },
      shortcut: '5'
    },
    {
      id: 'restart',
      title: 'System: Restart Mission',
      category: 'System',
      icon: <RotateCcw className="text-yellow-400" size={18} />,
      action: () => { onRestart(); onClose(); },
      shortcut: 'R'
    },
  ];

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-xl"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-xl bg-zinc-950/95 border border-indigo-500/40 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden font-mono"
            onClick={e => e.stopPropagation()}
          >
            {/* Header / Search Input */}
            <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-white/5">
              <Search className="text-indigo-400 mr-3 shrink-0" size={20} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or search sectors... (e.g. about, skills)"
                className="w-full bg-transparent border-none outline-none text-white text-sm placeholder:text-zinc-600 font-mono"
              />
              <button 
                onClick={onClose}
                className="p-1 text-zinc-500 hover:text-white transition-colors ml-2"
              >
                <X size={18} />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-zinc-600 text-xs tracking-widest">
                  NO_COMMAND_MATCH_FOUND
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs transition-all ${
                      selectedIndex === idx
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'border border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 border border-white/10 rounded-lg">
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-bold text-white tracking-wide">{item.title}</div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">{item.category}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.shortcut && (
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-zinc-400 font-mono">
                          {item.shortcut}
                        </span>
                      )}
                      <CornerDownLeft size={14} className={selectedIndex === idx ? 'text-indigo-400' : 'text-zinc-700'} />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-black/60 border-t border-white/10 flex justify-between items-center text-[10px] text-zinc-600">
              <div className="flex items-center gap-3">
                <span>Navigate: <strong className="text-zinc-400">↑↓</strong></span>
                <span>Select: <strong className="text-zinc-400">↵</strong></span>
                <span>Close: <strong className="text-zinc-400">ESC</strong></span>
              </div>
              <span className="text-indigo-400 font-bold tracking-widest">COMMAND_PALETTE_v1.0</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
