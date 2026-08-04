"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const items = [
  { label: "Home", desc: "Landing terminal", href: "/" },
  { label: "Blog", desc: "Writings and posts", href: "/blog" },
  { label: "Write a Post", desc: "Compose new content", href: "/admin/new" },
  { label: "About", desc: "Biography and journey", href: "/about" },
  { label: "Projects", desc: "Things I've built", href: "/projects" },
  { label: "Skills", desc: "Technologies I use", href: "/skills" },
  { label: "Education", desc: "Academic background", href: "/education" },
  { label: "Contact", desc: "Get in touch", href: "/contact" },
  { label: "Commands", desc: "Terminal playground", href: "/commands" },
  { label: "Chess", desc: "Play the terminal", href: "/chess" },
  { label: "Algorithms", desc: "Pathfinding + sorting visualizer", href: "/algorithms" },
  { label: "Fractals", desc: "Mandelbrot explorer", href: "/fractals" },
  { label: "Tools", desc: "Curated tools", href: "/tools" },
  { label: "Guestbook", desc: "Leave a message", href: "/guestbook" },
  { label: "Build Log", desc: "Dev diary", href: "/build-log" },
  { label: "Surprise", desc: "Random project", href: "/random" },
  { label: "Code", desc: "Code snippets", href: "/code" },
  { label: "Nepal", desc: "My country", href: "/nepal" },
  { label: "Namaste", desc: "Nepali welcome", href: "/namaste" },
  { label: "Whoami", desc: "Identity card", href: "/whoami" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("toggle-command-palette", onToggle);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("toggle-command-palette", onToggle);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const filtered = items.filter(
    (i) => i.label.toLowerCase().includes(query.toLowerCase()) || i.desc.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center bg-black/60 backdrop-blur-sm pt-[18vh] px-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "var(--color-terminal-800)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
          <span className="text-neon-400 font-mono text-sm">~/</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
              if (e.key === "Enter" && filtered[active]) go(filtered[active].href);
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(filtered.length - 1, a + 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              }
            }}
            className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-white/20"
            placeholder="Jump to a page… (Esc to close)"
          />
          <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">esc</span>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-sm font-mono text-white/30 text-center">
              No matches for &quot;{query}&quot;
            </p>
          )}
          {filtered.map((item, i) => (
            <button
              key={item.href}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                i === active ? "bg-neon-400/10" : ""
              }`}
            >
              <span className="shape-dot shrink-0" />
              <span className={`text-sm font-mono ${i === active ? "text-neon-400" : "text-white/70"}`}>{item.label}</span>
              <span className="flex-1" />
              <span className="text-[10px] font-mono text-white/25">{item.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
