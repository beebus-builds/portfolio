"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/markdown";

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: [0, 1] }
    );
    items.forEach((it) => {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }

  return (
    <nav aria-label="Table of contents" className="text-xs font-mono">
      <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3 flex items-center gap-2">
        <span className="w-1 h-3 bg-neon-400 rounded-full" /> Contents
      </p>
      <ul className="space-y-1 border-l border-white/8">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              onClick={(e) => handleClick(e, it.id)}
              className={`block py-1 pl-3 -ml-px border-l transition-colors ${
                activeId === it.id
                  ? "border-neon-400 text-neon-400"
                  : "border-transparent text-white/40 hover:text-white/70"
              } ${it.level === 3 ? "pl-6 text-[11px]" : ""}`}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
