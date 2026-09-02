"use client";

import { useEffect, useState } from "react";
import type { LandmarkData } from "./Landmark";

const CHAPTER_COPY: Record<string, { eyebrow: string; title: string; body: string }> = {
  about: { eyebrow: "CHAPTER 01 / THE PERSON", title: "Before the code, there was curiosity.", body: "A person is more than the things they build. This is where the journey starts." },
  education: { eyebrow: "CHAPTER 02 / THE QUESTIONS", title: "Every build begins with a question.", body: "What if? Why? Can I make it work? Curiosity became the first tool." },
  blog: { eyebrow: "CHAPTER 03 / THE FAILURE", title: "Not everything worked.", body: "Broken ideas, late nights, strange bugs. Failure stopped being an ending and became information." },
  projects: { eyebrow: "CHAPTER 04 / THE BUILDING", title: "So I learned to build.", body: "Ideas became interfaces, systems, experiments and places that people could actually use." },
  skills: { eyebrow: "CHAPTER 05 / THE TOOLKIT", title: "Tools are only powerful when you know why to use them.", body: "A growing collection of technologies, patterns and hard-earned lessons." },
  contact: { eyebrow: "CHAPTER 06 / THE UNKNOWN", title: "Everything built so far is behind me.", body: "The interesting part is what comes next." },
};

export default function StoryOverlay({ nearby, discovered, onEnter }: { nearby: LandmarkData | null; discovered: string[]; onEnter: () => void }) {
  const [visible, setVisible] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  useEffect(() => {
    if (!nearby || nearby.id === lastId) return;
    setLastId(nearby.id);
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 5200);
    return () => window.clearTimeout(timer);
  }, [nearby, lastId]);

  if (!nearby || !visible) return null;
  const copy = CHAPTER_COPY[nearby.id];
  if (!copy) return null;

  return (
    <div className="story-overlay" role="dialog" aria-label={copy.title}>
      <div className="story-overlay-line" style={{ background: nearby.color }} />
      <span className="story-overlay-eyebrow">{copy.eyebrow}</span>
      <h2>{copy.title}</h2>
      <p>{copy.body}</p>
      <div className="story-overlay-meta">
        <span>{discovered.length.toString().padStart(2, "0")} / 06 DISCOVERED</span>
        <button onClick={onEnter}>ENTER CHAPTER <i>↵</i></button>
      </div>
    </div>
  );
}
