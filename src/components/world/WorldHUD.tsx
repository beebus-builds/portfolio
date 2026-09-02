"use client";

import type { LandmarkData } from "./Landmark";

export default function WorldHUD({
  nearby,
  onEnter,
}: {
  nearby: LandmarkData | null;
  onEnter: () => void;
}) {
  return (
    <div className="world-hud">
      <div className="world-hud-top">
        <span className="world-hud-kicker">BIBASH POUDEL — WORLD.EXE</span>
        <h1>
          Drive around.
          <br />
          Pick a door.
        </h1>
        <p className="world-hud-hint">WASD / arrow keys to drive · E to enter · touch controls on mobile</p>
      </div>
      {nearby && (
        <div className="world-hud-prompt" style={{ "--pc": nearby.color } as React.CSSProperties}>
          <span>{nearby.sub}</span>
          <strong>{nearby.label}</strong>
          <button onClick={onEnter}>Press E — Enter ↵</button>
        </div>
      )}
    </div>
  );
}
