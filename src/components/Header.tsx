"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Clock from "@/components/Clock";
import Logo from "@/components/Logo";

const navItems = [
  {
    label: "Blog",
    href: "/blog",
    links: [
      { title: "All Posts", href: "/blog" },
      { title: "Write a Pos", href: "/admin/new" },
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
    <header className="sticky top-0 z-50 w-full pointer-events-none select-none">
      
      {/* ─── FULL-WIDTH BACKGROUND PLATES (Desktop only) ────────────────── */}
      <div className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* Top Deck Slanted Background Plate */}
        <div 
          className="absolute right-0 top-0 h-[50px] w-[calc(50vw+220px)] -skew-x-12 border-l border-t border-[var(--color-terminal-700)]/30"
          style={{ 
            background: "linear-gradient(135deg, var(--color-terminal-800), var(--color-terminal-900))",
            opacity: 0.97
          }}
        />
        {/* Main Deck Background Plate */}
        <div 
          className="absolute left-0 right-0 bottom-0 h-[75px] border-b border-[var(--color-terminal-700)]/30"
          style={{ 
            background: "linear-gradient(135deg, var(--color-terminal-900), var(--color-terminal-800))",
            backdropFilter: "blur(20px)",
            opacity: 0.96
          }}
        />
      </div>

      {/* ─── HEADER CONTENT CONTAINER ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative pointer-events-auto">
        
        {/* TOP DECK (Actions & Clock) */}
        <div className="hidden lg:flex justify-end h-[50px] relative">
          <div className="relative z-10 flex items-center gap-3.5 pr-4 h-full">
            <Clock />
            <a 
              href="https://github.com/beebus-builds" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="p-2 text-sm font-mono text-[var(--color-terminal-text)] hover:text-[var(--color-neon-400)] transition-colors rounded-lg hover:bg-white/5"
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
              </svg>
            </a>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle light/dark"
              className="p-2 text-sm font-mono text-[var(--color-terminal-text)] hover:text-[var(--color-neon-400)] transition-colors rounded-lg hover:bg-white/5"
              suppressHydrationWarning
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button
              onClick={() => window.dispatchEvent(new Event("toggle-command-palette"))}
              title="Open command palette (Ctrl+K)"
              className="px-3 py-1.5 text-xs font-mono text-[var(--color-terminal-text)] border border-[var(--color-terminal-700)]/30 rounded-lg hover:text-[var(--color-neon-400)] hover:border-[var(--color-neon-400)]/30 transition-all bg-[var(--color-terminal-800)]/20"
            >
              ⌘K
            </button>
          </div>
        </div>

        {/* BOTTOM DECK (Main Navbar) */}
        <div className="flex items-center justify-between h-20 lg:h-[75px] relative">
          
          {/* Mobile Full-Width Background Plate */}
          <div 
            className="lg:hidden absolute inset-0 border-b border-[var(--color-terminal-700)]/30 pointer-events-none"
            style={{ 
              background: "linear-gradient(135deg, var(--color-terminal-900), var(--color-terminal-800))",
              backdropFilter: "blur(20px)",
              opacity: 0.95
            }}
          />

          {/* Left: logo */}
          <div className="relative z-10 pl-2 lg:pl-4">
            <Link href="/" className="group shrink-0" aria-label="Home">
              <span className="relative block transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Logo size={36} />
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md bg-neon-400/20" />
              </span>
            </Link>
          </div>

          {/* Center/Right: navigation tabs (Horizontal Diamonds with Middle Gap) */}
          <nav
            ref={menuRef}
            aria-label="Primary"
            className="hidden lg:flex items-center h-full relative z-10 ml-auto mr-4 lg:mr-10"
          >
            {navItems.map((item, index) => {
              const isActive = item.label === activeLabel;
              const isRightEdge = index >= navItems.length - 2;
              const isOpen = openMenu === item.label;
              const showDropdown = item.links.length > 0;
              return (
                <div
                  key={item.label}
                  className="relative group/tab h-full flex items-center"
                  onMouseEnter={() => scheduleOpen(item.label)}
                  onMouseLeave={scheduleClose}
                  style={{ marginLeft: index > 0 ? "-1px" : "0" }} // Share points cleanly
                >
                  {/* Diamond tab wrapper */}
                  <div className="w-[110px] h-[52px] relative flex items-center justify-center select-none">
                    
                    {/* The diamond background shape */}
                    {(isActive || isOpen) ? (
                      <div 
                        className="absolute inset-0 bg-[var(--color-neon-400)]/80 transition-all duration-300"
                        style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                      >
                        <div 
                          className="absolute inset-[1.5px]"
                          style={{ 
                            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                            background: "linear-gradient(135deg, var(--color-terminal-800), var(--color-terminal-900))"
                          }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="absolute inset-0 bg-[var(--color-terminal-700)]/40 opacity-0 group-hover/tab:opacity-100 transition-all duration-200"
                        style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                      >
                        <div 
                          className="absolute inset-[1px]"
                          style={{ 
                            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                            background: "linear-gradient(135deg, var(--color-terminal-800), var(--color-terminal-900))"
                          }}
                        />
                      </div>
                    )}

                    {/* Nav Link text inside the diamond */}
                    <Link
                      href={item.href}
                      onClick={() => setOpenMenu(null)}
                      aria-current={isActive}
                      className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full"
                    >
                      <span
                        className={`text-xs font-mono tracking-wider transition-colors duration-150 ${
                          isActive || isOpen
                            ? "text-[var(--color-neon-400)] glow-neon font-bold"
                            : "text-[var(--color-terminal-text)] group-hover/tab:text-[var(--color-neon-400)]"
                        }`}
                      >
                        {item.label}
                      </span>
                      {/* Diamond indicator for dropdown */}
                      {showDropdown && (
                        <span
                          className={`w-1 h-1 rotate-45 border transition-all duration-200 mt-0.5 ${
                            isOpen
                              ? "bg-[var(--color-neon-400)] border-[var(--color-neon-400)]"
                              : "border-[var(--color-terminal-700)]/50 group-hover/tab:border-[var(--color-neon-400)]/50"
                          }`}
                        />
                      )}
                    </Link>
                  </div>

                  {/* Diamond dropdown */}
                  {isOpen && showDropdown && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 z-40 pt-4"
                    >
                      <div
                        role="menu"
                        className="w-[190px] h-[190px] bg-[var(--color-neon-400)]/50 p-[1.5px] transition-all duration-300 shadow-[0_0_20px_rgba(8,145,178,0.15)] anim-diamond-in"
                        style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                      >
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-4"
                          style={{ 
                            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                            background: "linear-gradient(135deg, var(--color-terminal-800), var(--color-terminal-900))"
                          }}
                        >
                          <div className="flex flex-col gap-1.5 py-4 max-h-[145px] overflow-y-auto w-full items-center justify-center">
                            {item.links.map((l, li) => (
                              <Link
                                key={l.title}
                                href={l.href}
                                role="menuitem"
                                onClick={() => setOpenMenu(null)}
                                style={{ animationDelay: `${120 + li * 70}ms` }}
                                className={`nav-link-in px-2 py-1 text-xs font-mono transition-all duration-200 hover:scale-110 text-center w-full max-w-[120px] ${
                                  pathname === l.href
                                    ? "text-[var(--color-neon-400)] glow-neon font-bold"
                                    : "text-[var(--color-terminal-text)] hover:text-[var(--color-neon-400)]"
                                }`}
                              >
                                <span className="truncate block">
                                  {l.title}
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden relative z-10 pr-4 flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 text-sm font-mono text-[var(--color-terminal-text)]"
              suppressHydrationWarning
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[var(--color-terminal-text)] hover:text-white p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[var(--color-terminal-700)]/30 py-3 pb-4 relative z-50 bg-[var(--color-terminal-900)]/95 backdrop-blur-xl">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link href={item.href}
                    className="px-3 py-2 text-xs font-mono text-[var(--color-terminal-text)] hover:text-[var(--color-neon-400)] rounded hover:bg-white/5"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.links.length > 0 && (
                    <div className="ml-4 flex flex-col">
                      {item.links.map((l) => (
                        <Link key={l.title} href={l.href}
                          className="px-3 py-1.5 text-xs font-mono text-[var(--color-terminal-text)]/60 hover:text-[var(--color-neon-400)] rounded"
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
                <a href="https://github.com/beebus-builds" target="_blank" rel="noopener noreferrer"
                  className="flex-1 px-3 py-1.5 text-xs font-mono text-[var(--color-neon-400)] border border-[var(--color-neon-400)]/30 rounded-lg text-center"
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