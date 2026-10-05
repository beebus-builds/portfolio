"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCameraDrag, useFlightInput } from "@/hooks/useFlightInput";
import { CAMERA_MODES, flightInput, type CameraMode } from "@/lib/flight";
import { planets, profile, type SectionId } from "@/lib/profile";
import { achievements, useAchievements } from "@/lib/achievements";
import { createSimulation } from "@/lib/simulation";
import AchievementToast from "./AchievementToast";
import FlatExplorer from "./FlatExplorer";
import Hud from "./Hud";
import IntroOverlay from "./IntroOverlay";
import PlanetWorld, { EntryFlash } from "./PlanetWorld";
import Radar from "./Radar";
import AudioEngine from "./AudioEngine";

const SpaceScene = dynamic(() => import("./SpaceScene"), {
  ssr: false,
  loading: () => (
    <div className="boot" role="status" aria-live="polite">
      <span className="boot__ring" />
      <p>Spinning up the system…</p>
    </div>
  ),
});

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
  const [cameraMode, setCameraMode] = useState<CameraMode>("chase");
  const [world, setWorld] = useState<SectionId | null>(null);
  const [entering, setEntering] = useState<SectionId | null>(null);
  const [tour, setTour] = useState<boolean>(false);

  const sim = useMemo(() => createSimulation(), []);
  const drag = useCameraDrag();
  const { unlocked, toast, report, hydrate } = useAchievements();
  const progressLoaded = useRef(false);

  /** Restore progress from the server (visitor cookie identifies the user). */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.visited)) {
          setVisited(new Set(data.visited.filter((item: unknown) => typeof item === "string")));
        }
        if (Array.isArray(data.achievements)) {
          hydrate(
            data.achievements.filter((item: unknown): item is import("@/lib/achievements").AchievementId =>
              typeof item === "string" && achievements.some((a) => a.id === item)
            )
          );
        }
      })
      .catch(() => {
        /* offline or DB unavailable: progress simply won't persist */
      })
      .finally(() => {
        progressLoaded.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  /** Push progress to the server whenever it changes (after initial load). */
  useEffect(() => {
    if (!progressLoaded.current) return;
    const timer = window.setTimeout(() => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visited: [...visited], achievements: [...unlocked] }),
      }).catch(() => {
        /* best effort */
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [visited, unlocked]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCapable(!reduced && supportsWebGL());
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
      setTour(false);
    },
    [sim]
  );

  /** Pilot grabbed the sticks: drop the course banner and stop any tour. */
  const handleTakeover = useCallback(() => {
    setTarget(null);
    setTour(false);
  }, []);

  /** Tour advance: same flight, but the tour keeps running. */
  const handleTourAdvance = useCallback(
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
      setEntering(id);
    setVisited((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
      report({ type: "dock" });
  }, [sim, report]);

  const handleRelease = useCallback(() => setDocked(null), []);
  const handleUndock = useCallback(() => {
    sim.docked = null;
    sim.target = null;
    setDocked(null);
    setTarget(null);
    setWorld(null);
    setEntering(null);
  }, [sim]);

  const handleSelectByIndex = useCallback(
    (index: number) => {
      const planet = planets[index];
      if (planet) handleSelect(planet.id);
    },
    [handleSelect]
  );

  const handleCamera = useCallback((mode: CameraMode) => {
    flightInput.cameraMode = mode;
    setCameraMode(mode);
  }, []);

  const handleCycleCamera = useCallback(() => {
    const next = CAMERA_MODES[(CAMERA_MODES.indexOf(flightInput.cameraMode) + 1) % CAMERA_MODES.length];
    flightInput.cameraMode = next;
    setCameraMode(next);
  }, []);

  /** All worlds charted? That's a medal. */
  useEffect(() => {
    if (visited.size >= planets.length) report({ type: "visit-all" });
  }, [visited, report]);

  /** Set course for comms? Medal. */
  useEffect(() => {
    if (target === "contact") report({ type: "contact" });
  }, [target, report]);

  /** Sustained boost earns the warpath medal. */
  useEffect(() => {
    if (mode !== "flight") return;
    let held = 0;
    const interval = window.setInterval(() => {
      if (sim.boosting) {
        held += 250;
        if (held >= 3000) report({ type: "boost-hold" });
      } else {
        held = 0;
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [mode, sim, report]);

  /** Atmospheric entry: three-beat flash, then the world takes over. */
  useEffect(() => {
    if (!entering) return;
    const timer = window.setTimeout(() => {
      setWorld(entering);
      setEntering(null);
    }, 1650);
    return () => window.clearTimeout(timer);
  }, [entering]);

  /** While a world is open the flight canvas stays mounted behind it. */
  useEffect(() => {
    if (!world && !entering) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [world, entering]);

  const exitWorld = useCallback(() => {
    setWorld(null);
    handleUndock();
  }, [handleUndock]);

  const jumpWorld = useCallback(
    (id: SectionId) => {
      setWorld(null);
      setEntering(null);
      handleSelect(id);
    },
    [handleSelect]
  );

  // Tour mode: press T to auto-cycle planets
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t") {
        setTour((v) => {
          if (!v) report({ type: "tour" });
          return !v;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [report]);

  // Guided tour: while idle, fly to the next uncharted world. Docking opens
  // each world for reading; closing it resumes the tour. Ends at contact.
  useEffect(() => {
    if (!tour || mode !== "flight" || world || entering) return;
    if (sim.docked || sim.target) return;
    if (visited.size >= planets.length) {
      setTour(false);
      handleTourAdvance("contact");
      return;
    }
    const next = planets.find((planet) => !visited.has(planet.id)) ?? planets[0];
    const timer = window.setTimeout(() => handleTourAdvance(next.id), 2500);
    return () => window.clearTimeout(timer);
  }, [tour, mode, world, entering, visited, sim, handleTourAdvance]);

  useFlightInput({
    active: mode === "flight",
    onUndock: handleUndock,
    onSelectByIndex: handleSelectByIndex,
    onCycleCamera: handleCycleCamera,
  });

  const launch = useCallback(
    (destination?: SectionId) => {
      const course = destination ?? pendingPlanet;
      report({ type: "launch" });
      if (!capable) {
        setFlatInitial(course ?? "about");
        setMode("flat");
      } else {
        setMode("flight");
        if (course) {
          sim.target = course;
          sim.docked = null;
          setTarget(course);
        }
      }
      setPendingPlanet(null);
    },
    [capable, pendingPlanet, sim, report]
  );

  const enterTextMode = useCallback(() => {
    setFlatInitial(pendingPlanet ?? "about");
    setMode("flat");
    setPendingPlanet(null);
  }, [pendingPlanet]);

  const flying = mode === "flight";

  return (
    <div className="space" data-mode={mode}>
      {mode === "intro" && capable && (
        <div className="space__cinematic" aria-hidden="true">
          <SpaceScene
            sim={sim}
            cinematic
            active={null}
            visited={visited}
            onSelect={() => {}}
            onDock={() => {}}
            onRelease={() => {}}
            onTakeover={() => {}}
          />
        </div>
      )}
      <AnimatePresence>
        {mode === "intro" && (
          <IntroOverlay key="intro" onLaunch={launch} onTextMode={enterTextMode} visitedCount={visited.size} />
        )}
      </AnimatePresence>

      {flying && (
        <>
          <div className={`space__viewport ${sim.boosting ? "space__viewport--shake" : ""}`} {...drag}>
            <SpaceScene
              sim={sim}
              active={target ?? docked}
              visited={visited}
              onSelect={handleSelect}
              onDock={handleDock}
              onRelease={handleRelease}
              onTakeover={handleTakeover}
            />
          </div>
          <div className="space__vignette" aria-hidden="true" />
          <Radar sim={sim} target={target} docked={docked} />
          <AudioEngine sim={sim} />
          <Hud
            sim={sim}
            docked={docked}
            target={target}
            visited={visited}
            onSelect={handleSelect}
            cameraMode={cameraMode}
            onCamera={handleCamera}
            tour={tour}
            onToggleTour={() => {
              setTour((value) => {
                if (!value) report({ type: "tour" });
                return !value;
              });
            }}
            onContact={() => handleSelect("contact")}
            medals={`${unlocked.size}/${achievements.length}`}
          />
          <AchievementToast toast={toast} />
          <AnimatePresence>
            {target && (
              <motion.p
                className="space__approach"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                Autopilot engaged · flying to{" "}
                <b>{planets.find((planet) => planet.id === target)?.label}</b>
                {tour ? ` · tour ${visited.size}/${planets.length} · T to stop` : " · any key to take over"}
              </motion.p>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {entering && <EntryFlash key={`enter-${entering}`} id={entering} />}
          </AnimatePresence>
          <AnimatePresence>
            {world && <PlanetWorld key={`world-${world}`} id={world} onExit={exitWorld} onJump={jumpWorld} />}
          </AnimatePresence>
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
