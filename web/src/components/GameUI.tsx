"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, ExternalLink, Code, X } from 'lucide-react';

interface AboutData {
  title: string;
  paragraphs: string[];
  skills: string[];
  imagePlaceholder: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  link: string;
  github: string;
}

function AboutPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<AboutData | null>(null);
  useEffect(() => {
    fetch('/api/about').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">
          {data?.title ?? 'About'} <span className="text-indigo-500">Me</span>
        </h2>
        {data?.paragraphs?.map((p, i) => (
          <p key={i} className="text-zinc-400 text-base leading-relaxed mb-4">{p}</p>
        ))}
        <div className="flex gap-3 flex-wrap mt-6">
          {(data?.skills ?? []).map(s => (
            <span key={s} className="px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm font-mono text-indigo-400">
              {s}
            </span>
          ))}
        </div>
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
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">
          Selected <span className="text-indigo-500">Works</span>
        </h2>
        <div className="grid gap-4">
          {projects.map(p => (
            <div key={p.id} className="p-5 bg-zinc-800/30 border border-zinc-700/50 rounded-xl hover:border-indigo-500/40 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                <div className="flex gap-2">
                  <a href={p.github} className="text-zinc-500 hover:text-white transition-colors"><Code size={16} /></a>
                  <a href={p.link} className="text-zinc-500 hover:text-white transition-colors"><ExternalLink size={16} /></a>
                </div>
              </div>
              <p className="text-zinc-400 text-sm mb-3">{p.description}</p>
              <div className="flex gap-2 flex-wrap">
                {p.tags.map(t => (
                  <span key={t} className="text-xs font-mono px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
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
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">
          Get In <span className="text-indigo-500">Touch</span>
        </h2>
        <p className="text-zinc-500 mb-8 text-sm">Have a project in mind? Drop a message.</p>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-mono text-zinc-500 mb-1 block">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm" placeholder="John Doe" />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-500 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm" placeholder="john@example.com" />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-zinc-500 mb-1 block">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={4}
              className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl focus:outline-none focus:border-indigo-500 text-white text-sm resize-none" />
          </div>
          <button type="submit" disabled={status === 'loading'}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50 text-sm">
            {status === 'loading' ? 'Sending...' : status === 'success' ? <><CheckCircle size={16} /> Sent!</> : status === 'error' ? <><AlertCircle size={16} /> Failed</> : <><Send size={16} /> Send Message</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GameUI({ activeZone, isOpen, onClose }: { activeZone: string | null; isOpen: boolean; onClose: () => void }) {
  const zoneColors: Record<string, string> = {
    about: 'border-purple-500/30',
    projects: 'border-indigo-500/30',
    contact: 'border-pink-500/30',
  };

  const zoneTitles: Record<string, string> = {
    about: 'About Me',
    projects: 'Projects',
    contact: 'Contact',
  };

  return (
    <AnimatePresence>
      {isOpen && activeZone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`bg-zinc-900/95 border ${zoneColors[activeZone] ?? 'border-zinc-700/50'} rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col overflow-hidden`}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
              <h2 className="text-lg font-bold text-white">{zoneTitles[activeZone] ?? activeZone}</h2>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              {activeZone === 'about' && <AboutPanel onClose={onClose} />}
              {activeZone === 'projects' && <ProjectsPanel onClose={onClose} />}
              {activeZone === 'contact' && <ContactPanel onClose={onClose} />}
            </div>
            <div className="px-6 py-3 border-t border-zinc-800/50 text-center">
              <span className="text-xs text-zinc-600 font-mono">Press <kbd className="text-zinc-400 bg-zinc-800 px-1 rounded">E</kbd> or <kbd className="text-zinc-400 bg-zinc-800 px-1 rounded">Esc</kbd> to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
