"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Clock from "@/components/Clock";

const navItems = [
  {
    label: "Blog",
    href: "/blog",
    links: [
      { title: "All Posts", href: "/blog" },
      { title: "Write a Post", href: "/admin/new" },
      { title: "Manage Posts", href: "/admin" },
    ],
  },
  { label: "About", href: "/about", links: [] },
  {
    label: "Work",
    href: "/projects",
    links: [
      { title: "Projects", href: "/projects" },
      { title: "Skills", href: "/skills" },
      { title: "Education", href: "/education" },
    ],
  },
  { label: "Terminal", href: "/commands", links: [] },
  { label: "Chess", href: "/chess", links: [] },
  { label: "Contact", href: "/contact", links: [] },
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
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  // Active item: match the current path against the item's own route or any sub-route
  const activeLabel = navItems.find((item) => {
    if (item.href === "/") return pathname === "/";
    return (
      pathname === item.href ||
      pathname.startsWith(item.href + "/") ||
      item.links.some((l) => pathname === l.href || pathname.startsWith(l.href + "/"))
    );
  })?.label;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Close any open menu when navigating
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
    return () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [pathname]);

  function scheduleOpen(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => setOpenMenu(label), 80);
  }

  function scheduleClose() {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  }

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

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-terminal-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="text-neon-400 font-mono text-sm glow-neon">~/</span>
            <span className="hidden sm:inline text-white font-mono text-xs tracking-wide group-hover:text-neon-400 transition-colors">
              bibashpoudel<span className="text-white/20">:devverse</span>
            </span>
          </Link>

          {/* Center: primary nav */}
          <nav
            ref={menuRef}
            aria-label="Primary"
            className="hidden lg:flex items-center gap-7 min-w-0"
          >
            {navItems.map((item, index) => {
              const isActive = item.label === activeLabel;
              const isRightEdge = index >= navItems.length - 2;
              const isOpen = openMenu === item.label;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => scheduleOpen(item.label)}
                  onMouseLeave={scheduleClose}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpenMenu(null)}
                    aria-current={isActive}
                    className={`nav-link flex items-center gap-1.5 py-1.5 text-sm font-mono tracking-wide transition-colors ${
                      isActive
                        ? "text-neon-400"
                        : isOpen
                          ? "text-white"
                          : "text-white/45 hover:text-white"
                    }`}
                  >
                    {item.label}
                    {item.links.length > 0 && (
                      <svg
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </Link>

                  {isOpen && item.links.length > 0 && (
                    <div
                      className={`absolute top-full z-40 pt-3 ${isRightEdge ? "right-0" : "left-0"}`}
                    >
                      <div
                        role="menu"
                        className={`dark-surface w-56 rounded-xl border border-white/10 shadow-2xl overflow-hidden anim-fade-up`}
                        style={{ background: "linear-gradient(135deg, rgba(15,15,42,0.98), rgba(10,10,30,0.98))" }}
                      >
                        <div className="p-1.5 flex flex-col">
                          {item.links.map((l) => (
                            <Link
                              key={l.title}
                              href={l.href}
                              role="menuitem"
                              onClick={() => setOpenMenu(null)}
                              className={`px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                                pathname === l.href
                                  ? "text-neon-400 bg-neon-400/5"
                                  : "text-white/60 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              {l.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Right: minimal actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Clock />
            <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-2 text-sm font-mono text-white/45 hover:text-neon-400 transition-colors rounded-lg hover:bg-white/5"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
              </svg>
            </a>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle light/dark"
              className="p-2 text-sm font-mono text-white/50 hover:text-neon-400 transition-colors rounded-lg hover:bg-white/5"
              suppressHydrationWarning
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
              title="Open command palette (Ctrl+K)"
              className="px-2.5 py-1.5 text-xs font-mono text-white/30 border border-white/10 rounded-lg hover:text-neon-400 hover:border-neon-400/30 transition-all"
            >
              ⌘K
            </button>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-white/50 hover:text-white p-2">
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
          <div className="lg:hidden border-t border-white/5 py-3 pb-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link href={item.href}
                    className="px-3 py-2 text-xs font-mono text-white/50 hover:text-white rounded hover:bg-white/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.links.length > 0 && (
                    <div className="ml-4 flex flex-col">
                      {item.links.map((l) => (
                        <Link key={l.title} href={l.href}
                          className="px-3 py-1.5 text-xs font-mono text-white/30 hover:text-neon-400 rounded"
                          onClick={() => setMobileOpen(false)}
                        >
                          {l.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="mt-3 flex items-center gap-2 px-3">
                <button
                  onClick={toggleTheme}
                  suppressHydrationWarning
                  className="flex-1 px-3 py-1.5 text-xs font-mono text-white/50 border border-white/10 rounded-lg text-center hover:text-neon-400 transition-colors"
                >
                  {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                </button>
                <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer"
                  className="flex-1 px-3 py-1.5 text-xs font-mono text-neon-400 border border-neon-400/30 rounded-lg text-center"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
