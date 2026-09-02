"use client";

import { useEffect, useState } from "react";
import type { LandmarkData } from "./Landmark";

export default function WorldHUD({ nearby, onEnter }: { nearby: LandmarkData | null; onEnter: () => void }) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTime((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="world-hud">
      <div className="world-hud-top">
        <div className="world-hud-status"><span className="world-hud-live" /> SYSTEM ONLINE <b>WORLD.EXE</b><span>{String(time).padStart(3, "0")}s</span></div>
        <span className="world-hud-kicker">BIBASH POUDEL / INTERACTIVE PORTFOLIO</span>
        <h1>Drive around.<br /><em>Find the work.</em></h1>
        <p className="world-hud-hint">WASD / ARROWS to drive · E / ENTER to interact · MOVE MOUSE to look</p>
      </div>
      {nearby && (
        <div className="world-hud-prompt" style={{ "--pc": nearby.color } as React.CSSProperties}>
          <span>YOU FOUND</span>
          <strong>{nearby.label}</strong>
          <small>{nearby.sub}</small>
          <button onClick={onEnter}>PRESS E <i>↵</i></button>
        </div>
      )}
      <div className="world-hud-crosshair" aria-hidden="true"><span /><span /></div>
    </div>
  );
}
