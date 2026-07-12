"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, ExternalLink, Code, X } from 'lucide-react';

interface AboutData {
  title: string;
  paragraphs: string[];
  skills: string[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  link: string;
  github: string;
}

const PanelWrapper = ({ title, children, color, onClose }: { title: string; children: React.ReactNode; color: string; onClose: () => void }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.9, opacity: 0, y: 20 }}
    className={`relative bg-zinc-950/80 backdrop-blur-xl border-2 ${color} rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden`}
  >
    {/* Corner Accents */}
    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-2xl" />
    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-2xl" />
    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-2xl" />
    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-2xl" />

    <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full animate-pulse bg-white" />
        <h2 className="text-lg font-mono font-bold text-white tracking-widest uppercase">{title}</h2>
      </div>
      <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
        <X size={20} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto scrollbar-hide p-8">
      {children}
    </div>
    <div className="px-6 py-3 bg-white/5 border-t border-white/10 text-center">
      <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">SYSTEM_STATUS: OPERATIONAL // ACCESS_GRANTED</span>
    </div>
  </motion.div>
);

function AboutPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<AboutData | null>(null);
  useEffect(() => {
    fetch('/api/about').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto text-center">
      <h3 className="text-4xl font-black text-white mb-6 tracking-tighter italic">
        {data?.title ?? 'ARCHIVE_01'}
      </h3>
      <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
        {data?.paragraphs?.map((p, i) => (
          <p key={i} className="opacity-80">{p}</p>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap justify-center mt-8">
        {(data?.skills ?? []).map(s => (
          <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-indigo-400">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProjectsPanel({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects).catch(() => {});
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="grid gap-4">
        {projects.map(p => (
          <div key={p.id} className="group p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{p.title}</h3>
              <div className="flex gap-3">
                <a href={p.github} className="text-zinc-500 hover:text-white transition-colors"><Code size={16} /></a>
                <a href={p.link} className="text-zinc-500 hover:text-white transition-colors"><ExternalLink size={16} /></a>
              </div>
            </div>
            <p className="text-zinc-400 text-xs mb-4 leading-relaxed">{p.description}</p>
            <div className="flex gap-2 flex-wrap">
              {p.tags.map(t => (
                <span key={t} className="text-[10px] font-mono px-2 py-0.5 bg-white/10 border border-white/10 text-zinc-400 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactPanel({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error('fail');
      setStatus('success');
      setName(''); setEmail(''); setMessage('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase mb-1 block">Identifier</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white text-sm transition-colors" placeholder="User Name" />
          </div>
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase mb-1 block">Comm_Link</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white text-sm transition-colors" placeholder="email@void.com" />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-mono text-zinc-500 uppercase mb-1 block">Transmission</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-indigo-500 text-white text-sm resize-none transition-colors" />
        </div>
        <button type="submit" disabled={status === 'loading'}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 transition-all disabled:opacity-50 text-xs uppercase tracking-widest">
          {status === 'loading' ? 'TRANSMITTING...' : status === 'success' ? <><CheckCircle size={16} /> LINK ESTABLISHED</> : status === 'error' ? <><AlertCircle size={16} /> SIGNAL LOST</> : <><Send size={16} /> SEND SIGNAL</>}
        </button>
      </form>
    </div>
  );
}

export default function GameUI({ activeZone, isOpen, onClose }: { activeZone: string | null; isOpen: boolean; onClose: () => void }) {
  const zoneColors: Record<string, string> = {
    about: 'border-purple-500/50 shadow-purple-500/20',
    projects: 'border-indigo-500/50 shadow-indigo-500/20',
    contact: 'border-pink-500/50 shadow-pink-500/20',
  };

  const zoneTitles: Record<string, string> = {
    about: 'USER_CORE_DATA',
    projects: 'PROJECT_REPOSITORY',
    contact: 'COMMUNICATION_HUB',
  };

  return (
    <AnimatePresence>
      {isOpen && activeZone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md"
        >
          <PanelWrapper 
            title={zoneTitles[activeZone] ?? activeZone} 
            color={zoneColors[activeZone] ?? 'border-zinc-700/50'} 
            onClose={onClose}
          >
            {activeZone === 'about' && <AboutPanel onClose={onClose} />}
            {activeZone === 'projects' && <ProjectsPanel onClose={onClose} />}
            {activeZone === 'contact' && <ContactPanel onClose={onClose} />}
          </PanelWrapper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
