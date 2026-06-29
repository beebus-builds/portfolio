"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function Contact() {
  return (
    <section id="contact" className="py-24 px-4 bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Get In <span className="text-indigo-500">Touch</span></h2>
          <p className="text-zinc-400">Have a project in mind or just want to say hello?</p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6 text-left"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-mono text-zinc-500 ml-1">Name</label>
              <input 
                type="text" 
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-mono text-zinc-500 ml-1">Email</label>
              <input 
                type="email" 
                className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-mono text-zinc-500 ml-1">Message</label>
            <textarea 
              rows={5} 
              className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Tell me about your project..."
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition-colors"
          >
            Send Message <Send size={18} />
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}
