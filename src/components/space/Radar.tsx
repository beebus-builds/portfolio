"use client";

import { useEffect, useRef } from "react";
import { planets, type SectionId } from "@/lib/profile";
import { orbitPosition, type Simulation } from "@/lib/simulation";

type RadarProps = {
  sim: Simulation;
  target?: SectionId | null;
  docked?: SectionId | null;
};

/** Max orbit radius in profile.ts is 360 — radar range covers it with margin. */
const RADAR_RANGE = 420;

function clamp01(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

export default function Radar({ sim, target, docked }: RadarProps) {
  const blips = useRef(new Map<string, HTMLDivElement>());

  // Live positions via rAF: sim mutates every frame without React re-renders,
  // so write blip positions straight to the DOM like Hud does.
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      for (const def of planets) {
        const el = blips.current.get(def.id);
        if (!el) continue;
        const pos = sim.positions.get(def.id) ?? orbitPosition(def, sim.time);
        const dx = pos.x - sim.shipPosition.x;
        const dz = pos.z - sim.shipPosition.z;
        const nx = clamp01(dx / RADAR_RANGE);
        const nz = clamp01(dz / RADAR_RANGE);
        el.style.left = `${((nx + 1) / 2) * 100}%`;
        el.style.top = `${((nz + 1) / 2) * 100}%`;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [sim]);

  return (
    <div className="radar">
      <div className="radar__ring" />
      <div className="radar__ring radar__ring--2" />
      <div className="radar__tick" />
      <div className="radar__tick radar__tick--v" />
      <div className="radar__scan" />
      {planets.map((p) => (
        <div
          key={p.id}
          ref={(el) => {
            if (el) blips.current.set(p.id, el);
            else blips.current.delete(p.id);
          }}
          className={`radar__blip ${p.id === target || p.id === docked ? "radar__blip--active" : ""}`}
          style={{ left: "50%", top: "50%" }}
          title={`${p.label} ${p.id === target || p.id === docked ? "(active)" : ""}`}
        />
      ))}
      <label className="radar__tag">RADAR</label>
    </div>
  );
}
