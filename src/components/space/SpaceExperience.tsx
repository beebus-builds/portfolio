"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCameraDrag, useFlightInput } from "@/hooks/useFlightInput";
import { planets, profile, type SectionId } from "@/lib/profile";
import { createSimulation } from "@/lib/simulation";
import DockingPanel from "./DockingPanel";
import FlatExplorer from "./FlatExplorer";
import Hud from "./Hud";
import IntroOverlay from "./IntroOverlay";

const SpaceScene = dynamic(() => import("./SpaceScene"), {
  ssr: false,
  loading: () => (
    <div className="boot" role="status" aria-live="polite">
      <span className="boot__ring" />
      <p>Spinning up the system…</p>
    </div>
  ),
});

const VISITED_KEY = "bp07-visited-planets-v1";

type Mode = "intro" | "flight" | "flat";

function supportsWebGL() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function SpaceExperience() {
  const [mode, setMode] = useState<Mode>("intro");
  const [capable, setCapable] = useState<boolean | null>(null);
  const [target, setTarget] = useState<SectionId | null>(null);
  const [docked, setDocked] = useState<SectionId | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set<string>());
  const [pendingPlanet, setPendingPlanet] = useState<SectionId | null>(null);
  const [flatInitial, setFlatInitial] = useState<SectionId>("about");

  const sim = useMemo(() => createSimulation(), []);
  const drag = useCameraDrag();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCapable(!reduced && supportsWebGL());
    try {
      const saved = window.localStorage.getItem(VISITED_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVisited(new Set(parsed.filter((item): item is string => typeof item === "string")));
        }
      }
    } catch {
      setVisited(new Set<string>());
    }
  }, []);

  /** Deep links such as /?planet=projects fly straight to that world. */
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("planet");
    if (!requested) return;
    const match = planets.find((planet) => planet.id === requested);
    if (match) {
      setMode("intro");
      setPendingPlanet(match.id);
    }
  }, []);

  const handleSelect = useCallback(
    (id: SectionId) => {
      sim.docked = null;
      sim.target = id;
      setTarget(id);
      setDocked(null);
    },
    [sim]
  );

  const handleDock = useCallback(
    (id: SectionId) => {
      sim.docked = id;
      sim.target = null;
      setDocked(id);
      setTarget(null);
    setVisited((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      try {
        window.localStorage.setItem(VISITED_KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable: progress simply will not persist */
      }
      return next;
    });
  }, [sim]);

  const handleRelease = useCallback(() => setDocked(null), []);
  const handleUndock = useCallback(() => {
    sim.docked = null;
    sim.target = null;
    setDocked(null);
    setTarget(null);
  }, [sim]);

  const handleSelectByIndex = useCallback(
    (index: number) => {
      const planet = planets[index];
      if (planet) handleSelect(planet.id);
    },
    [handleSelect]
  );

  useFlightInput({ active: mode === "flight", onUndock: handleUndock, onSelectByIndex: handleSelectByIndex });

  const launch = useCallback(() => {
    if (!capable) {
      setFlatInitial(pendingPlanet ?? "about");
      setMode("flat");
    } else {
      setMode("flight");
      if (pendingPlanet) {
        sim.target = pendingPlanet;
        sim.docked = null;
        setTarget(pendingPlanet);
      }
    }
    setPendingPlanet(null);
  }, [capable, pendingPlanet, sim]);

  const enterTextMode = useCallback(() => {
    setFlatInitial(pendingPlanet ?? "about");
    setMode("flat");
    setPendingPlanet(null);
  }, [pendingPlanet]);

  const flying = mode === "flight";

  return (
    <div className="space" data-mode={mode}>
      <AnimatePresence>
        {mode === "intro" && <IntroOverlay key="intro" onLaunch={launch} onTextMode={enterTextMode} />}
      </AnimatePresence>

      {flying && (
        <>
          <div className="space__viewport" {...drag}>
            <SpaceScene
              sim={sim}
              active={target ?? docked}
              visited={visited}
              onSelect={handleSelect}
              onDock={handleDock}
              onRelease={handleRelease}
            />
          </div>
          <div className="space__vignette" aria-hidden="true" />
          <Hud sim={sim} docked={docked} target={target} visited={visited} onSelect={handleSelect} />
          <AnimatePresence>
            {target && (
              <motion.p
                className="space__approach"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                Autopilot engaged · flying to{" "}
                <b>{planets.find((planet) => planet.id === target)?.label}</b> · any key to take over
              </motion.p>
            )}
          </AnimatePresence>
          <DockingPanel id={docked} onClose={handleUndock} onSelect={handleSelect} />
        </>
      )}

      {mode === "flat" && (
        <div className="space__flat">
          <FlatExplorer key={flatInitial} initial={flatInitial} />
          {capable !== false && (
            <button type="button" className="space__return" onClick={() => setMode("flight")}>
              Return to flight
            </button>
          )}
        </div>
      )}

      <span className="sr-only" aria-hidden="true">
        {profile.name} — {profile.role} based in {profile.location}. Interactive 3D portfolio: five
        planets carry the about, skills, projects, contact and resume sections.
      </span>
    </div>
  );
}
