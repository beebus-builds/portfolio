"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { flightHelp, planets, profile, type SectionId } from "@/lib/profile";

type IntroOverlayProps = {
  onLaunch: (destination?: SectionId) => void;
  onTextMode: () => void;
  visitedCount?: number;
};

const SYSTEMS = ["Guidance", "Propulsion", "Comms"] as const;

const rise = {
  hidden: { y: 26, opacity: 0 },
  show: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/**
 * Pre-flight briefing: systems check, pick-a-destination course plotter,
 * then launch. Choosing a world flies straight at it; launching with
 * nothing plotted means free flight.
 */
export default function IntroOverlay({ onLaunch, onTextMode, visitedCount = 0 }: IntroOverlayProps) {
  const [destination, setDestination] = useState<SectionId | null>(null);

  const launch = useCallback(() => onLaunch(destination ?? undefined), [destination, onLaunch]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      if (event.key === "Enter" && target?.tagName !== "BUTTON") launch();
      // Number keys mirror the flight view: 1–5 plots that world's course.
      const index = ["1", "2", "3", "4", "5"].indexOf(event.key);
      if (index >= 0 && planets[index]) {
        event.preventDefault();
        setDestination(planets[index].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [launch]);

  const target = planets.find((planet) => planet.id === destination);

  return (
    <motion.div
      className="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      <div className="intro__halo" aria-hidden="true" />
      <motion.div
        className="intro__content"
        initial={{ y: 26, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="intro__eyebrow">
          <i /> {profile.status} · {profile.callSign} · {profile.timezone}
        </p>
        <h1>
          Bibash <em>Poudel</em>
        </h1>
        <p className="intro__role">
          {profile.role} · {profile.location}
        </p>
        <p className="intro__lede">{profile.intro}</p>

        <motion.div className="intro__systems" variants={rise} initial="hidden" animate="show" custom={1} aria-label="Pre-flight systems check">
          {SYSTEMS.map((system) => (
            <span key={system} className="intro__sys">
              <i aria-hidden="true" />
              {system} · nominal
            </span>
          ))}
          <span className="intro__sys intro__sys--charted">
            Worlds charted · {visitedCount}/{planets.length}
          </span>
        </motion.div>

        <motion.fieldset
          className="intro__course"
          variants={rise}
          initial="hidden"
          animate="show"
          custom={2}
        >
          <legend>
            Plot a course <small>— pick a world, or launch free</small>
          </legend>
          <div className="intro__planets" role="group" aria-label="Destination worlds">
            {planets.map((planet, index) => {
              const active = destination === planet.id;
              return (
                <button
                  key={planet.id}
                  type="button"
                  className="intro__planet"
                  data-active={active || undefined}
                  aria-pressed={active}
                  style={{ ["--planet" as string]: planet.glowColor }}
                  onClick={() => setDestination(active ? null : planet.id)}
                >
                  <i aria-hidden="true" />
                  <span className="intro__planet-main">
                    <b>{planet.label}</b>
                    <small>{planet.title}</small>
                  </span>
                  <span className="intro__planet-key">{index + 1}</span>
                </button>
              );
            })}
          </div>
          <p className="intro__course-note" aria-live="polite">
            {target
              ? `Locked on ${target.label} — ${target.title} · autopilot will fly you in`
              : "No course plotted — you will launch into free flight"}
          </p>
        </motion.fieldset>

        <motion.div className="intro__actions" variants={rise} initial="hidden" animate="show" custom={3}>
          <button type="button" className="intro__launch" onClick={launch} autoFocus>
            {target ? `Fly to ${target.label}` : "Begin flight"} <span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="intro__secondary" onClick={onTextMode}>
            Read as a document
          </button>
        </motion.div>

        <ul className="intro__keys">
          {flightHelp.map((entry) => (
            <li key={entry.keys}>
              <kbd>{entry.keys}</kbd>
              {entry.action}
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}
