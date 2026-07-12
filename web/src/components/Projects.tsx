"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Code, Briefcase } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  link: string;
  github: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section id="projects" className="py-24 px-4 bg-neutral-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Selected <span className="text-indigo-600 dark:text-indigo-500">Works</span></h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">A collection of projects where I pushed the boundaries of web interaction.</p>
        </div>

        {loading ? (
          <div className="text-center text-zinc-400">Loading projects...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group relative p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-indigo-500/50 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <div className="flex gap-3">
                    <a href={project.github} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"><Code size={20} /></a>
                    <a href={project.link} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"><ExternalLink size={20} /></a>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs font-mono px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-full border border-zinc-200 dark:border-zinc-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
