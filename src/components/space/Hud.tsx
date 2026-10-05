"use client";

import { useEffect, useRef } from "react";
import { CAMERA_MODES, type CameraMode } from "@/lib/flight";
import { flightHelp, planets, profile, type SectionId } from "@/lib/profile";
import type { Simulation } from "@/lib/simulation";

type HudProps = {
  sim: Simulation;
  docked: SectionId | null;
  target: SectionId | null;
  visited: Set<string>;
  onSelect: (id: SectionId) => void;
  cameraMode: CameraMode;
  onCamera: (mode: CameraMode) => void;
  tour: boolean;
  onToggleTour: () => void;
  onContact: () => void;
  medals?: string;
};

/**
 * Readout frame around the viewport. Speed and heading are written straight to
 * the DOM from a rAF loop so flying never re-renders React.
 */
export default function Hud({ sim, docked, target, visited, onSelect, cameraMode, onCamera, tour, onToggleTour, onContact, medals }: HudProps) {
  const speedRef = useRef<HTMLSpanElement>(null);
  const throttleRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLSpanElement>(null);
  const climbRef = useRef<HTMLSpanElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);
  const nearestRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const ratio = Math.min(1, sim.shipSpeed / 100);
      if (speedRef.current) speedRef.current.textContent = String(Math.round(sim.shipSpeed * 12)).padStart(4, "0");
      if (throttleRef.current) throttleRef.current.style.setProperty("--fill", `${Math.round(ratio * 100)}%`);
      if (headingRef.current) {
        const degrees = ((Math.round(sim.heading) % 360) + 360) % 360;
        headingRef.current.textContent = `${String(degrees).padStart(3, "0")}°`;
      }
      if (climbRef.current) {
        const vsi = Math.round(sim.climb * 12);
        climbRef.current.textContent = `${vsi >= 0 ? "+" : "−"}${String(Math.abs(vsi)).padStart(3, "0")}`;
      }
      if (altRef.current) altRef.current.textContent = String(Math.round(sim.shipPosition.y * 12));
      if (nearestRef.current) {
        let best: { label: string; dist: number } | null = null;
        for (const planet of planets) {
          const position = sim.positions.get(planet.id);
          if (!position) continue;
          const dist = position.distanceTo(sim.shipPosition);
          if (!best || dist < best.dist) best = { label: planet.label, dist };
        }
        nearestRef.current.textContent = best ? `${best.label} ${Math.round(best.dist)}u` : "—";
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [sim]);

  return (
    <div className="hud" aria-hidden="false">
      <div className="hud__brand">
        <span className="hud__mark" aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="hud__name">
          <b>{profile.name}</b>
          <small>
            {profile.role} · {profile.coordinates}
          </small>
        </span>
      </div>

      <nav className="hud__nav" aria-label="Planets">
        {planets.map((planet, index) => (
          <button
            key={planet.id}
            type="button"
            onClick={(event) => {
              event.currentTarget.blur();
              onSelect(planet.id);
            }}
            data-active={target === planet.id || docked === planet.id || undefined}
            data-visited={visited.has(planet.id) || undefined}
            style={{ ["--planet" as string]: planet.glowColor }}
          >
            <span>{planet.label}</span>
            <small>{index + 1}</small>
          </button>
        ))}
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget.blur();
            onToggleTour();
          }}
          data-active={tour || undefined}
          title="Guided tour of every world (T)"
        >
          <span>TOUR</span>
          <small>{tour ? "ON" : "OFF"}</small>
        </button>
        <button
          type="button"
          className="hud__cta"
          onClick={(event) => {
            event.currentTarget.blur();
            onContact();
          }}
          title="Fly to the contact world"
        >
          <span>SIGNAL ↗</span>
        </button>
      </nav>

      <div className="hud__cam" role="group" aria-label="Camera angle">
        <span className="hud__cam-label">CAM</span>
        {CAMERA_MODES.map((option) => (
          <button
            key={option}
            type="button"
            onClick={(event) => {
              event.currentTarget.blur();
              onCamera(option);
            }}
            data-active={cameraMode === option || undefined}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="hud__telemetry" aria-hidden="true">
        <div className="hud__speed">
          <span ref={speedRef}>0000</span>
          <small>u/s</small>
        </div>
        <i className="hud__throttle" ref={throttleRef} />
        <div className="hud__readout">
          <span>
            HDG <b ref={headingRef}>000°</b>
          </span>
          <span>
            V/S <b ref={climbRef}>+000</b>
          </span>
          <span>
            ALT <b ref={altRef}>0</b>
          </span>
          <span>
            NEAR <b ref={nearestRef}>—</b>
          </span>
          <span>
            SYS <b>{profile.status.toUpperCase()}</b>
          </span>
          {medals && (
            <span>
              MEDALS <b>{medals}</b>
            </span>
          )}
        </div>
      </div>

      <div className="hud__keys">
        {flightHelp.map((entry) => (
          <span key={entry.keys}>
            <kbd>{entry.keys}</kbd>
            {entry.action}
          </span>
        ))}
      </div>

      <p className="hud__hint">Click a planet to fly there · press Esc to undock</p>
    </div>
  );
}
