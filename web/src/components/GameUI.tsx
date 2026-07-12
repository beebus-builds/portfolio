"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, ExternalLink, Code, X, Cpu, Calendar, User, Globe } from 'lucide-react';

// --- Types ---
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

interface Skill {
  name: string;
  level: number; // 0 to 1
  category: string;
}

interface Experience {
  year: string;
  role: string;
  company: string;
  desc: string;
}

// --- Shared UI Wrapper ---
const PanelWrapper = ({ title, children, color, onClose }: { title: string; children: React.ReactNode; color: string; onClose: () => void }) => (
  <motion.div
    initial={{ scale: 0.9, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.9, opacity: 0, y: 20 }}
    className={`relative bg-zinc-950/80 backdrop-blur-2xl border-2 ${color} rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col overflow-hidden`}
  >
    {/* Sci-Fi Corner Accents */}
    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/30 rounded-tl-2xl" />
    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/30 rounded-tr-2xl" />
    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/30 rounded-bl-2xl" />
    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/30 rounded-br-2xl" />

    <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        <h2 className="text-lg font-mono font-bold text-white tracking-widest uppercase">{title}</h2>
      </div>
      <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
        <X size={20} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
      {children}
    </div>
    <div className="px-6 py-3 bg-white/5 border-t border-white/10 text-center">
      <span className="text-[10px] text-zinc-600 font-mono tracking-tighter uppercase">SECURE_SESSION // DATA_STREAM_ACTIVE</span>
    </div>
  </motion.div>
);

// --- Panel Implementations ---

function AboutPanel({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<AboutData | null>(null);
  useEffect(() => {
    fetch('/api/about').then(r => r.json()).then(setData).catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
          <User className="text-indigo-400" size={40} />
        </div>
      </div>
      <h3 className="text-4xl font-black text-white mb-6 tracking-tighter italic">
        {data?.title ?? 'CORE_MEMORIES'}
      </h3>
      <div className="space-y-4 text-zinc-400 text-base leading-relaxed">
        {data?.paragraphs?.map((p, i) => (
          <p key={i} className="opacity-80">{p}</p>
        ))}
      </div>
    </div>
  );
}

function SkillsPanel({ onClose }: { onClose: () => void }) {
  const skills: Skill[] = [
    { name: 'React / Next.js', level: 0.95, category: 'Frontend' },
    { name: 'Three.js / R3F', level: 0.9, category: '3D/Graphics' },
    { name: 'TypeScript', level: 0.85, category: 'Language' },
    { name: 'Node.js / Express', level: 0.8, category: 'Backend' },
    { name: 'Tailwind CSS', level: 0.9, category: 'Styling' },
    { name: 'PostgreSQL / MongoDB', level: 0.7, category: 'Database' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {skills.map(skill => (
        <div key={skill.name} className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:border-indigo-500/50 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-mono text-indigo-400">{skill.category}</span>
            <span className="text-xs font-mono text-white">{Math.round(skill.level * 100)}%</span>
          </div>
          <div className="text-white font-bold mb-3">{skill.name}</div>
          <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${skill.level * 100}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExperiencePanel({ onClose }: { onClose: () => void }) {
  const exp: Experience[] = [
    { year: '2024 - Present', role: 'Software Engineering Intern', company: 'Smartsites Nepal', desc: 'Developing scalable web applications and enhancing user interfaces with a focus on performance and modern UX patterns.' },
    { year: '2021 - Present', role: 'BIT Student', company: 'Bhaktapur Multiple Campus', desc: 'Deeply exploring Information Technology, specializing in software architecture, algorithms, and interactive web systems.' },
    { year: '2003', role: 'Born', company: 'Sindhuli, Nepal', desc: 'The origin point. Beginning a journey of curiosity and passion for technology.' },
  ];

  return (
    <div className="max-w-2xl mx-auto relative">
      {/* Vertical Line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-indigo-500/30" />
      
      <div className="space-y-12">
        {exp.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="relative pl-12"
          >
            <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
            <div className="text-xs font-mono text-indigo-400 mb-1">{item.year}</div>
            <div className="text-white font-bold text-lg">{item.role}</div>
            <div className="text-zinc-500 text-sm font-mono mb-2">{item.company}</div>
            <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
          </motion.div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map(p => (
        <div key={p.id} className="p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{p.title}</h3>
            <div className="flex gap-2">
              <a href={p.github} className="text-zinc-500 hover:text-white transition-colors"><Code size={16} /></a>
              <a href={p.link} className="text-zinc-500 hover:text-white transition-colors"><ExternalLink size={16} /></a>
            </div>
          </div>
          <p className="text-zinc-400 text-xs mb-4 leading-relaxed">{p.description}</p>
          <div className="flex gap-2 flex-wrap">
            {p.tags.map(t => (
              <span key={t} className="text-[10px] font-mono px-2 py la-0.5 bg-white/5 border border-white/10 text-zinc-400 rounded">
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
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
    skills: 'border-blue-500/50 shadow-blue-500/20',
    experience: 'border-emerald-500/50 shadow-emerald-500/20',
    projects: 'border-indigo-500/50 shadow-indigo-500/20',
    contact: 'border-pink-500/50 shadow-pink-500/20',
  };

  const zoneTitles: Record<string, string> = {
    about: 'CORE_MEMORIES',
    skills: 'TECH_LAB',
    experience: 'TEMPORAL_GRID',
    projects: 'THE_FORGE',
    contact: 'SIGNAL_BEACON',
  };

  return (
    <AnimatePresence>
      {isOpen && activeZone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <PanelWrapper 
            title={zoneTitles[activeZone] ?? activeZone} 
            color={zoneColors[activeZone] ?? 'border-zinc-700/50'} 
            onClose={onClose}
          >
            {activeZone === 'about' && <AboutPanel onClose={onClose} />}
            {activeZone === 'skills' && <SkillsPanel onClose={onClose} />}
            {activeZone === 'experience' && <ExperiencePanel onClose={onClose} />}
            {activeZone === 'projects' && <ProjectsPanel onClose={onClose} />}
            {activeZone === 'contact' && <ContactPanel onClose={onClose} />}
          </PanelWrapper>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
