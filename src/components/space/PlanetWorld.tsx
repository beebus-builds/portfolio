"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { getPlanet, planets, type SectionId } from "@/lib/profile";
import SectionContent from "./SectionContent";

/**
 * Atmospheric entry, in three beats:
 * 1) white-hot bloom, 2) planet-colour wash with a progress bar,
 * 3) handoff to the world overlay. Timed to the 1650ms timer in
 * SpaceExperience — keep them in sync.
 */
export function EntryFlash({ id }: { id: SectionId }) {
  const planet = getPlanet(id);
  return (
    <motion.div
      className="flash"
      style={{ ["--planet" as string]: planet.glowColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-live="polite"
      aria-label={`Entering ${planet.label}`}
    >
      <motion.span
        className="flash__burst"
        initial={{ scale: 0.1, opacity: 0 }}
        animate={{ scale: [0.1, 1.1, 2.9], opacity: [0, 1, 1] }}
        transition={{ duration: 1.5, times: [0, 0.35, 1], ease: "easeIn" }}
      />
      <motion.span
        className="flash__ring"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.4], opacity: [0.8, 0] }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <span className="flash__streaks" aria-hidden="true" />
      <div className="flash__copy">
        <motion.span
          className="flash__kicker"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          Atmospheric entry · {planet.kicker}
        </motion.span>
        <motion.span
          className="flash__label"
          initial={{ opacity: 0, letterSpacing: "0.6em" }}
          animate={{ opacity: 1, letterSpacing: "0.28em" }}
          transition={{ duration: 0.9, delay: 0.2 }}
        >
          Entering {planet.label}
        </motion.span>
        <motion.span
          className="flash__sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          {planet.title} · {planet.readout}
        </motion.span>
        <span className="flash__track" aria-hidden="true">
          <motion.span
            className="flash__progress"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.45, ease: "easeInOut" }}
          />
        </span>
      </div>
    </motion.div>
  );
}

type PlanetWorldProps = {
  id: SectionId;
  onExit: () => void;
  onJump: (id: SectionId) => void;
};

const heroChild = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 + i * 0.07, ease: "easeOut" as const },
  }),
};

/**
 * A landed world: sticky wayfinding bar, systematic hero with waypoints,
 * one readable column of content, and a jump rail to the next world.
 * Behaves like a dialog: focuses its heading, Esc returns to flight.
 */
export default function PlanetWorld({ id, onExit, onJump }: PlanetWorldProps) {
  const planet = getPlanet(id);
  const index = planets.findIndex((item) => item.id === id);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  return (
    <motion.div
      ref={scrollRef}
      className="world"
      style={{ ["--planet" as string]: planet.glowColor }}
      initial={{ opacity: 0, y: 48, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 32, scale: 0.99, transition: { duration: 0.3, ease: "easeIn" } }}
      transition={{ duration: 0.55, ease: [0.22, 0.9, 0.28, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label={`${planet.label} world`}
    >
      <div
        className="world__sky"
        aria-hidden="true"
        style={{
          background: `radial-gradient(90% 90% at 50% 115%, ${planet.color}66, transparent 65%), radial-gradient(60% 50% at 50% -5%, ${planet.glowColor}40, transparent 70%)`,
        }}
      />

      <div className="world__bar">
        <button type="button" className="world__back" onClick={onExit}>
          <span aria-hidden="true">←</span> Flight
        </button>
        <span className="world__crumb">
          Flight <i>/</i> Worlds <i>/</i> <b>{planet.label}</b>
        </span>
        <span className="world__count">
          {String(index + 1).padStart(2, "0")} / {String(planets.length).padStart(2, "0")}
        </span>
      </div>

      <header className="world__hero">
        <motion.span custom={0} variants={heroChild} initial="hidden" animate="show" className="world__kicker">
          <i className="world__sigil" aria-hidden="true" />
          {planet.kicker}
        </motion.span>
        <motion.h2
          ref={headingRef}
          tabIndex={-1}
          custom={1}
          variants={heroChild}
          initial="hidden"
          animate="show"
          className="world__title"
        >
          {planet.label}
        </motion.h2>
        <motion.p custom={2} variants={heroChild} initial="hidden" animate="show" className="world__sub">
          {planet.title} · {planet.readout}
        </motion.p>
        <motion.p custom={3} variants={heroChild} initial="hidden" animate="show" className="world__blurb">
          {planet.blurb}
        </motion.p>
        <motion.dl custom={4} variants={heroChild} initial="hidden" animate="show" className="world__meta">
          <div>
            <dt>Section</dt>
            <dd>
              {String(index + 1).padStart(2, "0")} — {planet.title}
            </dd>
          </div>
          <div>
            <dt>Moons</dt>
            <dd>{planet.moons}</dd>
          </div>
          <div>
            <dt>Orbit</dt>
            <dd>{planet.orbitRadius} u</dd>
          </div>
        </motion.dl>
        <motion.p custom={5} variants={heroChild} initial="hidden" animate="show" className="world__hint">
          Scroll to read · <kbd>Esc</kbd> returns to flight
        </motion.p>
      </header>

      <div className="world__body">
        <SectionContent id={planet.id} />
      </div>

      <nav className="world__jump" aria-label="Fly to another world">
        <span>Keep exploring</span>
        <div>
          {planets
            .filter((item) => item.id !== planet.id)
            .map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onJump(item.id)}
                style={{ ["--planet" as string]: item.glowColor }}
              >
                <b>{item.label}</b>
                <small>{item.title}</small>
                <span aria-hidden="true">→</span>
              </button>
            ))}
        </div>
      </nav>
    </motion.div>
  );
}
