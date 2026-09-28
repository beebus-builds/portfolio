"use client";

import { AnimatePresence, motion } from "framer-motion";
import { getPlanet, type SectionId } from "@/lib/profile";
import SectionContent from "./SectionContent";

type DockingPanelProps = {
  id: SectionId | null;
  onClose: () => void;
  onSelect: (id: SectionId) => void;
};

export default function DockingPanel({ id, onClose, onSelect }: DockingPanelProps) {
  const planet = id ? getPlanet(id) : null;

  return (
    <AnimatePresence>
      {planet && (
        <motion.aside
          className="dock"
          style={{ ["--planet" as string]: planet.glowColor }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          aria-label={`${planet.label} panel`}
        >
          <header className="dock__header">
            <div>
              <span className="dock__kicker">{planet.kicker}</span>
              <h2>{planet.label}</h2>
              <p>{planet.title} · {planet.readout}</p>
            </div>
            <button type="button" className="dock__close" onClick={onClose} aria-label="Undock and close panel">
              ×
            </button>
          </header>

          <div className="dock__body">
            <p className="dock__blurb">{planet.blurb}</p>
            <SectionContent id={planet.id} />
          </div>

          <nav className="dock__jump" aria-label="Jump to another planet">
            {(["about", "skills", "projects", "contact", "resume"] as SectionId[]).map((target) => (
              <button
                key={target}
                type="button"
                onClick={(event) => {
                  event.currentTarget.blur();
                  onSelect(target);
                }}
                data-active={target === planet.id || undefined}
                style={{ ["--planet" as string]: getPlanet(target).glowColor }}
              >
                {getPlanet(target).label}
              </button>
            ))}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
