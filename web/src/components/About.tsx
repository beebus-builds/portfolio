"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AboutData {
  title: string;
  paragraphs: string[];
  skills: string[];
  imagePlaceholder: string;
}

export default function About() {
  const [data, setData] = useState<AboutData | null>(null);

  useEffect(() => {
    fetch('/api/about')
      .then(res => res.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <section id="about" className="py-24 px-4 bg-neutral-50 dark:bg-zinc-950 text-zinc-900 dark:text-white overflow-hidden transition-colors">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative aspect-square bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-300 dark:text-zinc-700 border border-zinc-200 dark:border-zinc-800">
            <span className="text-sm font-mono italic">{data?.imagePlaceholder ?? 'Image / Creative Element'}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold mb-6">
            {data?.title ?? 'Designing the'} <span className="text-indigo-600 dark:text-indigo-500">Future</span>
          </h2>
          {data?.paragraphs?.map((p, i) => (
            <p key={i} className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed mb-6">{p}</p>
          ))}
          <div className="flex gap-4 flex-wrap">
            {(data?.skills ?? ['React', 'Next.js', 'Three.js', 'Tailwind']).map(skill => (
              <div key={skill} className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-mono text-indigo-600 dark:text-indigo-400">
                {skill}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
