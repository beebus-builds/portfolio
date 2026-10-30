"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCameraDrag, useFlightInput } from "@/hooks/useFlightInput";
import { CAMERA_MODES, flightInput, type CameraMode } from "@/lib/flight";
import { getPlanet, planets, profile, type SectionId } from "@/lib/profile";
import { achievements, useAchievements } from "@/lib/achievements";
import { createSimulation } from "@/lib/simulation";
import { fleet } from "@/lib/fleetStore";
import Arcade from "./Arcade";
import AchievementsPanel from "./AchievementsPanel";
import AchievementToast from "./AchievementToast";
import CopilotChat from "./CopilotChat";
import Comms from "./Comms";
import TouchControls from "./TouchControls";
import FlatExplorer from "./FlatExplorer";
import Hud from "./Hud";
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

type Mode = "flight" | "flat";

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
  const [mode, setMode] = useState<Mode>("flight");
  const [capable, setCapable] = useState<boolean | null>(null);
  const [target, setTarget] = useState<SectionId | null>(null);
  const [docked, setDocked] = useState<SectionId | null>(null);
  const [visited, setVisited] = useState<Set<string>>(() => new Set<string>());
  const [flatInitial, setFlatInitial] = useState<SectionId>("about");
  const [cameraMode, setCameraMode] = useState<CameraMode>("chase");
  const [world, setWorld] = useState<SectionId | null>(null);
  const [entering, setEntering] = useState<SectionId | null>(null);
  const [tour, setTour] = useState<boolean>(false);
  const [medalsOpen, setMedalsOpen] = useState(false);
  const [arcadeOpen, setArcadeOpen] = useState(false);

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
  const lastSent = useRef<{ visited: string[]; achievements: string[] } | null>(null);
  useEffect(() => {
    if (!progressLoaded.current) return;
    const payload = { visited: [...visited], achievements: [...unlocked] };
    const same =
      lastSent.current &&
      lastSent.current.visited.join(",") === payload.visited.join(",") &&
      lastSent.current.achievements.join(",") === payload.achievements.join(",");
    if (same) return;
    const timer = window.setTimeout(() => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(() => {
        lastSent.current = payload;
      }).catch(() => {
        /* best effort */
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [visited, unlocked]);

  /** Flush progress on unload with sendBeacon so a fast close still saves. */
  useEffect(() => {
    const onPageHide = () => {
      if (!progressLoaded.current) return;
      const payload = JSON.stringify({ visited: [...visited], achievements: [...unlocked] });
      navigator.sendBeacon?.("/api/progress", payload);
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") onPageHide();
    });
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("visibilitychange", onPageHide);
    };
  }, [visited, unlocked]);

  /**
   * There is no landing page — the visitor starts in the cockpit. The only
   * branch is capability: without WebGL (or with reduced motion) there is no
   * ship to fly, so drop straight to the flat explorer carrying the same
   * content rather than showing a briefing screen first.
   */
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ok = !reduced && supportsWebGL();
    setCapable(ok);
    if (!ok) setMode("flat");
  }, []);

  /**
   * "Ignition" is earned the moment the ship is actually flying. With no
   * briefing screen there is no launch button to hang it on, so it fires when
   * capability resolves to a live cockpit.
   */
  const ignitionReported = useRef(false);
  useEffect(() => {
    if (capable !== true || ignitionReported.current) return;
    ignitionReported.current = true;
    report({ type: "launch" });
  }, [capable, report]);

  /**
   * Deep links such as `/?planet=projects` fly straight to that world. With the
   * cockpit live that is just an autopilot course; without WebGL it selects
   * the opening panel instead.
   */
  useEffect(() => {
    if (capable === null) return;
    const requested = new URLSearchParams(window.location.search).get("planet");
    const match = planets.find((planet) => planet.id === requested);
    if (!match) return;
    if (capable) {
      sim.target = match.id;
      setTarget(match.id);
    } else {
      setFlatInitial(match.id);
    }
  }, [capable, sim]);

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
      sim.landing = id;
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
    sim.landing = null;
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
    const next = CAMERA_MODES[(CAMERA_MODES.indexOf(flightInput.cameraMode) + 1) % CAMERA_MODES.length] ?? flightInput.cameraMode;
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
      sim.landing = null;
      sim.docked = null;
      setWorld(entering);
      setEntering(null);
    }, 1650);
    return () => window.clearTimeout(timer);
  }, [entering, sim]);

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
      sim.landing = null;
      handleSelect(id);
    },
    [handleSelect, sim]
  );

  // Tour mode: press T to auto-cycle planets. Ignored while typing in a form
  // field — the contact textarea in particular.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "t") return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      setTour((v) => {
        if (!v) report({ type: "tour" });
        return !v;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [report]);

  // Comms: press X (or the HUD button) for the Cheer Park chat channel.
  const [commsOpen, setCommsOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "x") return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      setCommsOpen((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The fleet store tracks panel visibility to count unread transmissions.
  useEffect(() => {
    fleet.setPanelOpen(commsOpen);
  }, [commsOpen]);

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
    const next = planets.find((planet) => !visited.has(planet.id)) ?? getPlanet("about");
    const timer = window.setTimeout(() => handleTourAdvance(next.id), 2500);
    return () => window.clearTimeout(timer);
  }, [tour, mode, world, entering, visited, sim, handleTourAdvance]);

  useFlightInput({
    active: mode === "flight",
    onUndock: handleUndock,
    onSelectByIndex: handleSelectByIndex,
    onCycleCamera: handleCycleCamera,
  });

  const enterTextMode = useCallback(() => {
    setMode("flat");
  }, []);

  // Never mount the canvas before capability is known — a WebGL-less browser
  // would throw instead of falling back.
  const flying = mode === "flight" && capable === true;

  return (
    <div className="space" data-mode={flying ? "flight" : mode}>
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
              dive={entering}
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
            onShowAchievements={() => setMedalsOpen(true)}
            onPlayArcade={() => setArcadeOpen(true)}
            onTextMode={enterTextMode}
            commsOpen={commsOpen}
            onToggleComms={() => setCommsOpen((v) => !v)}
          />
          <Comms open={commsOpen} onClose={() => setCommsOpen(false)} />
          <AchievementToast toast={toast} />
          <TouchControls />
          <AnimatePresence>
            {medalsOpen && <AchievementsPanel unlocked={unlocked} onClose={() => setMedalsOpen(false)} />}
          </AnimatePresence>
          <AnimatePresence>
            {arcadeOpen && <Arcade onClose={() => setArcadeOpen(false)} />}
          </AnimatePresence>
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

      <CopilotChat />

      <span className="sr-only" aria-hidden="true">
        {profile.name} — {profile.role} based in {profile.location}. Interactive 3D portfolio: five
        planets carry the about, skills, projects, contact and resume sections.
      </span>
    </div>
  );
}
