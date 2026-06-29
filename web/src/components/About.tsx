"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <section id="about" className="py-24 px-4 bg-zinc-950 text-white overflow-hidden">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-700 border border-zinc-800">
            <span className="text-sm font-mono italic">Image / Creative Element</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold mb-6">Designing the <span className="text-indigo-500">Future</span></h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-6">
            I am a software engineer with a passion for blending technical precision with creative expression. 
            My approach focuses on creating intuitive, high-performance web applications that leave a lasting impression.
          </p>
          <p className="text-zinc-400 text-lg leading-relaxed mb-8">
            With expertise in modern frameworks and a deep love for motion design, I bridge the gap between 
            static interfaces and living experiences.
          </p>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-indigo-400">React</div>
            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-indigo-400">Next.js</div>
            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-indigo-400">Three.js</div>
            <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-mono text-indigo-400">Tailwind</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
