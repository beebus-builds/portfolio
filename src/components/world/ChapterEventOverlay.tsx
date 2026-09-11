"use client";

import { useEffect, useMemo, useState } from "react";

type Chapter = {
  id: string;
  index: string;
  title: string;
  kicker: string;
  line: string;
  detail: string;
  color: string;
};

const CHAPTERS: Chapter[] = [
  { id: "about", index: "01", title: "THE PERSON", kicker: "ORIGIN SIGNAL", line: "Before the interfaces, there was curiosity.", detail: "Identity is not a static profile. It is the collection of decisions that shaped the work.", color: "#6d5bff" },
  { id: "education", index: "02", title: "THE QUESTIONS", kicker: "CURIOSITY ENGINE", line: "Every useful system starts with a better question.", detail: "Learning became the engine: ask, test, break the assumption, then follow the next signal.", color: "#54e6d4" },
  { id: "blog", index: "03", title: "THE FAILURE", kicker: "FAULT DETECTED", line: "The broken parts are part of the architecture.", detail: "Failed experiments leave behind constraints, patterns and instincts that make the next build stronger.", color: "#ff4af0" },
  { id: "projects", index: "04", title: "THE BUILDING", kicker: "SYSTEM ONLINE", line: "Ideas only become real when something starts working.", detail: "From interfaces to full systems, the work is measured by what can be built, shipped and experienced.", color: "#ffd700" },
  { id: "skills", index: "05", title: "THE TOOLKIT", kicker: "STACK EVOLVING", line: "The tools change. The instinct to build stays.", detail: "React, Next.js, WordPress, Figma, Alpine.js, Three.js and everything learned between them form a living toolkit.", color: "#22c55e" },
  { id: "contact", index: "06", title: "THE UNKNOWN", kicker: "BOUNDARY REACHED", line: "There is no final version of the map.", detail: "The next chapter is intentionally unfinished. That is where new work, new problems and new collaborators enter.", color: "#ff6b35" },
];

export default function ChapterEventOverlay({ discovered }: { discovered: string[] }) {
  const [seen, setSeen] = useState<string[]>([]);
  const [event, setEvent] = useState<Chapter | null>(null);
  const [visible, setVisible] = useState(false);

  const latest = useMemo(() => {
    const candidates = CHAPTERS.filter((chapter) => discovered.includes(chapter.id) && !seen.includes(chapter.id));
    return candidates[candidates.length - 1] ?? null;
  }, [discovered, seen]);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem("bibash-chapter-events");
      if (saved) setSeen(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!latest || event) return;
    setEvent(latest);
    setSeen((current) => {
      const next = [...current, latest.id];
      try { window.sessionStorage.setItem("bibash-chapter-events", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 6200);
    return () => window.clearTimeout(timer);
  }, [latest, event]);

  useEffect(() => {
    if (!visible) {
      const timer = window.setTimeout(() => setEvent(null), 520);
      return () => window.clearTimeout(timer);
    }
  }, [visible]);

  if (!event) return null;

  return (
    <div className={`chapter-event ${visible ? "is-visible" : ""}`} style={{ "--chapter-color": event.color } as React.CSSProperties} role="status" aria-live="polite">
      <div className="chapter-event__scan" />
      <div className="chapter-event__index">CHAPTER {event.index} / MEMORY ACQUIRED</div>
      <div className="chapter-event__kicker">{event.kicker}</div>
      <div className="chapter-event__title">{event.title}</div>
      <div className="chapter-event__line">{event.line}</div>
      <p>{event.detail}</p>
      <div className="chapter-event__footer"><span>STORY.EXE</span><span>NEW SIGNAL RECORDED</span><i /></div>
    </div>
  );
}
