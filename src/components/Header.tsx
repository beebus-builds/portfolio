"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import Clock from "@/components/Clock";

const navItems = [
  {
    label: "Blog",
    href: "/blog",
    sections: [
      { title: "All Posts", desc: "Read the latest", href: "/blog" },
      { title: "Write a Post", desc: "Compose new content", href: "/admin/new" },
      { title: "Manage Posts", desc: "Edit or delete", href: "/admin" },
    ],
  },
  {
    label: "About",
    href: "/about",
    sections: [
      { title: "Biography", desc: "Who I am", href: "/about" },
      { title: "Journey", desc: "My path so far", href: "/about" },
    ],
  },
  {
    label: "Work",
    href: "/projects",
    sections: [
      { title: "Projects", desc: "Things I've built", href: "/projects" },
      { title: "Skills", desc: "Technologies I use", href: "/skills" },
    ],
  },
  {
    label: "Commands",
    href: "/commands",
    sections: [
      { title: "Playground", desc: "Interactive terminal", href: "/commands" },
    ],
  },
  {
    label: "Algorithms",
    href: "/algorithms",
    sections: [
      { title: "Visualizer", desc: "Pathfinding + sorting", href: "/algorithms" },
      { title: "Fractals", desc: "Mandelbrot explorer", href: "/fractals" },
    ],
  },
  {
    label: "Tools",
    href: "/tools",
    sections: [
      { title: "Curated Tools", desc: "What I use daily", href: "/tools" },
    ],
  },
  {
    label: "Connect",
    href: "/contact",
    sections: [
      { title: "Contact", desc: "Get in touch", href: "/contact" },
      { title: "Education", desc: "Academic background", href: "/education" },
    ],
  },
  {
    label: "Nepal",
    href: "/nepal",
    sections: [
      { title: "About Nepal", desc: "My country", href: "/nepal" },
      { title: "Namaste", desc: "Nepali welcome", href: "/namaste" },
    ],
  },
  {
    label: "Build Log",
    href: "/build-log",
    sections: [
      { title: "Dev Diary", desc: "What I'm building", href: "/build-log" },
    ],
  },
  {
    label: "Surprise",
    href: "/random",
    sections: [
      { title: "Random Project", desc: "Pick one at random", href: "/random" },
    ],
  },
  {
    label: "Guestbook",
    href: "/guestbook",
    sections: [
      { title: "Sign the Guestbook", desc: "Leave a message", href: "/guestbook" },
    ],
  },
  {
    label: "Identity",
    href: "/whoami",
    sections: [
      { title: "Whoami", desc: "Identity card", href: "/whoami" },
    ],
  },
];

export default function Header() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function openMenuWithKeyboard(label: string) {
    setOpenMenu(label);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-terminal-900/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-neon-400 font-mono text-sm glow-neon">~/</span>
            <span className="text-white font-mono text-sm tracking-wide group-hover:text-neon-400 transition-colors">bibashpoudel</span>
          </Link>

          <nav ref={menuRef} className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <div key={item.label} className="relative"
                onMouseEnter={() => setOpenMenu(item.label)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  type="button"
                  onClick={() => setOpenMenu(openMenu === item.label ? null : item.label)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                      e.preventDefault();
                      openMenuWithKeyboard(item.label);
                    }
                  }}
                  className="px-3 py-2 text-xs font-mono text-white/50 hover:text-white transition-colors rounded hover:bg-white/5"
                >
                  {item.label}
                </button>
                {openMenu === item.label && (
                  <div className="absolute top-full left-0 mt-1 w-56 border border-white/5 rounded-xl bg-terminal-900/95 backdrop-blur-xl shadow-2xl p-2">
                    {item.sections.map((s) => (
                      <Link key={s.title} href={s.href}
                        className="flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        onClick={() => setOpenMenu(null)}
                      >
                        <span className="text-xs font-mono text-white/80">{s.title}</span>
                        <span className="text-[10px] font-mono text-white/30">{s.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer"
              className="ml-2 px-3 py-1.5 text-xs font-mono text-neon-400 border border-neon-400/30 rounded-lg hover:bg-neon-400/10 transition-all"
            >
              GitHub ↗
            </a>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle light/dark"
              className="ml-2 p-2 text-xs font-mono text-white/50 hover:text-neon-400 transition-colors rounded-lg hover:bg-white/5"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
              title="Open command palette (Ctrl+K)"
              className="ml-2 px-2 py-1.5 text-[10px] font-mono text-white/30 border border-white/10 rounded-lg hover:text-neon-400 hover:border-neon-400/30 transition-all"
            >
              ⌘K
            </button>
            <Clock />
          </nav>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white/50 hover:text-white p-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 py-3 pb-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link key={item.label} href={item.href}
                  className="px-3 py-2 text-xs font-mono text-white/50 hover:text-white rounded hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer"
                className="mt-2 mx-3 px-3 py-1.5 text-xs font-mono text-neon-400 border border-neon-400/30 rounded-lg text-center"
              >
                GitHub ↗
              </a>
              <button
                onClick={toggleTheme}
                className="mt-1 mx-3 px-3 py-1.5 text-xs font-mono text-white/50 border border-white/10 rounded-lg text-center hover:text-neon-400 transition-colors"
              >
                {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
