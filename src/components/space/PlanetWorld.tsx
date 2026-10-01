"use client";

import { motion } from "framer-motion";
import { getPlanet, planets, type SectionId } from "@/lib/profile";
import SectionContent from "./SectionContent";

/** Atmospheric entry: a bloom of planet light that swallows the screen. */
export function EntryFlash({ id }: { id: SectionId }) {
  const planet = getPlanet(id);
  return (
    <motion.div
      className="flash"
      style={{ ["--planet" as string]: planet.glowColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        className="flash__burst"
        initial={{ scale: 0.15, opacity: 0.5 }}
        animate={{ scale: 2.8, opacity: 1 }}
        transition={{ duration: 1.0, ease: "easeIn" }}
      />
      <motion.span
        className="flash__label"
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        animate={{ opacity: 1, letterSpacing: "0.3em" }}
        transition={{ duration: 0.8 }}
      >
        Entering {planet.label}
      </motion.span>
    </motion.div>
  );
}

type PlanetWorldProps = {
  id: SectionId;
  onExit: () => void;
  onJump: (id: SectionId) => void;
};

/**
 * The new world: flying into a planet lands here instead of a side panel.
 * Same content, full takeover, themed sky per planet.
 */
export default function PlanetWorld({ id, onExit, onJump }: PlanetWorldProps) {
  const planet = getPlanet(id);
  return (
    <motion.div
      className="world"
      style={{ ["--planet" as string]: planet.glowColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="world__hero"
        style={{
          background: `radial-gradient(90% 90% at 50% 110%, ${planet.color}55, transparent 65%), radial-gradient(60% 50% at 50% 0%, ${planet.glowColor}33, transparent 70%)`,
        }}
      >
        <button type="button" className="world__back" onClick={onExit}>
          ← Return to flight
        </button>
        <span className="world__kicker">{planet.kicker}</span>
        <h2>{planet.label}</h2>
        <p className="world__sub">
          {planet.title} · {planet.readout}
        </p>
        <p className="world__blurb">{planet.blurb}</p>
      </div>

      <div className="world__body">
        <SectionContent id={planet.id} />
      </div>

      <nav className="world__jump" aria-label="Fly to another world">
        <span>Next world</span>
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
                {item.label} →
              </button>
            ))}
        </div>
      </nav>
    </motion.div>
  );
}
