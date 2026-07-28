"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';

const AVAILABLE_COMMANDS = [
  { cmd: '/warp <sector>', desc: 'Warp to a sector (about, skills, experience, projects, contact)' },
  { cmd: '/scan', desc: 'Scan nearby sectors' },
  { cmd: '/status', desc: 'Display ship status' },
  { cmd: '/clear', desc: 'Clear terminal' },
  { cmd: '/restart', desc: 'Return to main menu' },
  { cmd: '/help', desc: 'Show available commands' },
];

const SECTORS = [
  { id: 'about', label: 'S-1: CORE_MEMORIES' },
  { id: 'skills', label: 'S-2: TECH_LAB' },
  { id: 'experience', label: 'S-3: TEMPORAL_GRID' },
  { id: 'projects', label: 'S-4: THE_FORGE' },
  { id: 'contact', label: 'S-5: SIGNAL_BEACON' },
];

interface TerminalProps {
  onCommand: (cmd: string) => void;
  shield?: number;
  decryption?: number;
}

export default function Terminal({ onCommand, shield = 100, decryption = 0 }: TerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'SYSTEM ONLINE. WELCOME, OPERATOR.',
    'TYPE /HELP FOR AVAILABLE COMMANDS.',
    '',
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const appendLines = useCallback((...lines: string[]) => {
    setHistory(prev => [...prev, ...lines]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const raw = input.trim();
    const cmd = raw.toLowerCase();
    const parts = cmd.split(/\s+/);
    const base = parts[0];

    if (base === '/help') {
      appendLines(
        `> ${raw}`,
        'AVAILABLE COMMANDS:',
        ...AVAILABLE_COMMANDS.map(c => `  ${c.cmd.padEnd(30)} ${c.desc}`),
        '',
      );
    } else if (base === '/clear') {
      setHistory([]);
    } else if (base === '/status') {
      appendLines(
        `> ${raw}`,
        `SHIELD: ${shield}%`,
        `DECRYPTION: ${decryption}%`,
        `SECTOR_NAV: ${SECTORS.map(s => s.id).join(', ')}`,
        '',
      );
    } else if (base === '/scan') {
      appendLines(
        `> ${raw}`,
        'SCANNING NEARBY SECTORS...',
        ...SECTORS.map(s => `  ${s.id} -> ${s.label}`),
        'SCAN COMPLETE.',
        '',
      );
    } else {
      appendLines(`> ${raw}`, `EXECUTING: ${cmd}...`);
      onCommand(cmd);
    }

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
          {history.map((line, i) => {
            if (line.startsWith('> ')) {
              return <div key={i} className="text-white">{line}</div>;
            }
            if (line.startsWith('  /')) {
              return <div key={i} className="text-indigo-400/80 pl-2">{line}</div>;
            }
            return <div key={i} className="text-indigo-400/60">{line}</div>;
          })}
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
