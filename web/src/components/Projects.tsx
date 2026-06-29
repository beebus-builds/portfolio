"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Code } from 'lucide-react';

const projects = [
  {
    title: "AI Creative Studio",
    description: "A platform generating 3D art using generative AI.",
    tags: ["React", "Three.js", "OpenAI"],
    link: "#",
    github: "#"
  },
  {
    title: "Neural Nexus",
    description: "Interactive visualization of neural network layers.",
    tags: ["TypeScript", "D3.js", "Next.js"],
    link: "#",
    github: "#"
  },
  {
    title: "Quantum Dash",
    description: "High-performance dashboard for quantum computing metrics.",
    tags: ["Rust", "Wasm", "Tailwind"],
    link: "#",
    github: "#"
  },
  {
    title: "Ethereal UI",
    description: "A design system focused on glassmorphism and depth.",
    tags: ["Figma", "React", "Framer"],
    link: "#",
    github: "#"
  }
];

export default function Projects() {
  return (
    <section id="projects" className="py-24 px-4 bg-zinc-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Selected <span className="text-indigo-500">Works</span></h2>
          <p className="text-zinc-400 max-w-xl mx-auto">A collection of projects where I pushed the boundaries of web interaction.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative p-8 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-indigo-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Briefcase size={24} />
                </div>
                <div className="flex gap-3">
                  <a href={project.github} className="text-zinc-500 hover:text-white transition-colors"><Code size={20} /></a>
                  <a href={project.link} className="text-zinc-500 hover:text-white transition-colors"><ExternalLink size={20} /></a>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
              <p className="text-zinc-400 mb-6 leading-relaxed">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <span key={tag} className="text-xs font-mono px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Briefcase({ size }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
  );
}
