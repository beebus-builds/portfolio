"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Home, User, Briefcase, Mail } from 'lucide-react';

const NavItem = ({ icon: Icon, label, href }) => (
  <motion.a
    href={href}
    whileHover={{ scale: 1.1, y: -5 }}
    whileTap={{ scale: 0.9 }}
    className="flex flex-col items-center justify-center p-3 text-zinc-400 hover:text-white transition-colors group relative"
  >
    <Icon size={24} />
    <span className="absolute -bottom-8 scale-0 group-hover:scale-100 transition-all bg-zinc-800 text-white text-xs py-1 px-2 rounded">
      {label}
    </span>
  </motion.a>
);

export default function Navbar() {
  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-4 px-6 py-3 bg-zinc-900/50 backdrop-blur-lg border border-zinc-800 rounded-full shadow-2xl"
      >
        <NavItem icon={Home} label="Home" href="#" />
        <NavItem icon={User} label="About" href="#about" />
        <NavItem icon={Briefcase} label="Work" href="#projects" />
        <NavItem icon={Mail} label="Contact" href="#contact" />
      </motion.div>
    </nav>
  );
}
