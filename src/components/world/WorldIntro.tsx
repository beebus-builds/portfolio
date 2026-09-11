"use client";

import { useEffect, useState } from "react";

const INTRO_KEY = "bibash-world-intro-seen-v2";

export default function WorldIntro({ onLaunch }: { onLaunch: () => void }) {
  const [open, setOpen] = useState(true);
  const [boot, setBoot] = useState(0);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(INTRO_KEY) === "1") setOpen(false);
    } catch { /* ignore storage failures */ }

    const timer = window.setInterval(() => setBoot((value) => Math.min(100, value + 4)), 45);
    return () => window.clearInterval(timer);
  }, []);

  if (!open) return null;

  const launch = () => {
    try { window.localStorage.setItem(INTRO_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    onLaunch();
  };

  return (
    <div className="world-intro" role="dialog" aria-modal="true" aria-label="The Journey introduction">
      <div className="world-intro-noise" />
      <div className="world-intro-grid" />
      <div className="world-intro-scanline" />
      <div className="world-intro-top">
        <span>BP / JOURNEY OS</span>
        <span>BUILD 02.026</span>
        <span>NEPAL // 27.7172° N</span>
      </div>

      <main className="world-intro-main">
        <div className="world-intro-index">INTERACTIVE PORTFOLIO / 001</div>
        <h1><span>THE</span><strong>JOURNEY</strong></h1>
        <p className="world-intro-lead">This is not a portfolio you scroll through.<br />It is a world you move through.</p>

        <div className="world-intro-system">
          <div>
            <span>MISSION</span>
            <b>TRACE THE BUILDER</b>
          </div>
          <div>
            <span>INPUT</span>
            <b>WASD / ARROWS / TOUCH</b>
          </div>
          <div>
            <span>OBJECTIVE</span>
            <b>DISCOVER 06 CHAPTERS</b>
          </div>
        </div>

        <button className="world-intro-launch" onClick={launch} disabled={boot < 100}>
          <span>{boot < 100 ? `INITIALIZING ${boot}%` : "ENTER THE JOURNEY"}</span>
          <i>↗</i>
        </button>
        <p className="world-intro-hint">Your progress and hidden discoveries are saved locally.</p>
      </main>

      <div className="world-intro-corner world-intro-corner-a">SYSTEM ONLINE<br />RENDER / WEBGL<br />STORY ENGINE / READY</div>
      <div className="world-intro-corner world-intro-corner-b">01 — PERSON<br />02 — QUESTIONS<br />03 — FAILURE<br />04 — BUILDING<br />05 — TOOLKIT<br />06 — UNKNOWN</div>
    </div>
  );
}
