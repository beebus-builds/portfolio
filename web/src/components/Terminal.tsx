"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TerminalProps {
  onCommand: (cmd: string) => void;
}

export default function Terminal({ onCommand }: TerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>(['SYSTEM ONLINE. WELCOME, OPERATOR.', 'TYPE /HELP FOR AVAILABLE COMMANDS.']);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim().toLowerCase();
    setHistory(prev => [...prev, `> ${input}`, `EXECUTING: ${cmd}...`]);
    onCommand(cmd);
    setInput('');
  };

  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 pointer-events-auto">
      <div className="bg-black/80 backdrop-blur-md border border-indigo-500/30 rounded-t-xl overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="bg-indigo-900/20 px-4 py-1 border-b border-indigo-500/30 flex justify-between items-center">
          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">Neural_Terminal_v4.0</span>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="h-32 overflow-y-auto p-4 font-mono text-[11px] text-indigo-300/80 space-y-1 scrollbar-hide"
        >
          {history.map((line, i) => (
            <div key={i} className={line.startsWith('>') ? 'text-white' : 'text-indigo-400/60'}>
              {line}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-3 border-t border-indigo-500/20 flex items-center gap-3 bg-zinc-900/50">
          <span className="text-indigo-500 font-mono text-xs">root@void:~$</span>
          <input 
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-transparent border-none outline-none text-white font-mono text-xs flex-1"
            placeholder="Enter command..."
          />
        </form>
      </div>
    </div>
  );
}
