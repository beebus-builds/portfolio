"use client";

import { useEffect, useState } from "react";
import type { LandmarkData } from "./Landmark";

export default function WorldHUD({ nearby, onEnter, discovered = [] }: { nearby: LandmarkData | null; onEnter: () => void; discovered?: string[] }) {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTime((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const complete = discovered.length >= 6;

  return (
    <div className="world-hud">
      <div className="world-hud-top">
        <div className="world-hud-status"><span className="world-hud-live" /> JOURNEY ONLINE <b>STORY.EXE</b><span>{String(time).padStart(3, "0")}s</span></div>
        <span className="world-hud-kicker">BIBASH POUDEL / AN INTERACTIVE JOURNEY</span>
        <h1>{complete ? <>The next chapter<br /><em>starts now.</em></> : <>Everyone starts<br /><em>somewhere.</em></>}</h1>
        <p className="world-hud-hint">WASD / ARROWS to explore · E / ENTER to discover · MOVE MOUSE to look</p>
      </div>
      {nearby && (
        <div className="world-hud-prompt" style={{ "--pc": nearby.color } as React.CSSProperties}>
          <span>{discovered.includes(nearby.id) ? "CHAPTER FOUND" : "YOU DISCOVERED"}</span>
          <strong>{nearby.label}</strong>
          <small>{nearby.sub}</small>
          <button onClick={onEnter}>{complete ? "ENTER THE UNKNOWN" : "ENTER STORY"} <i>↵</i></button>
        </div>
      )}
      <div className="world-hud-crosshair" aria-hidden="true"><span /><span /></div>
    </div>
  );
}
