"use client";

import { motion } from "framer-motion";
import { flightHelp, planets, profile } from "@/lib/profile";

type IntroOverlayProps = {
  onLaunch: () => void;
  onTextMode: () => void;
};

export default function IntroOverlay({ onLaunch, onTextMode }: IntroOverlayProps) {
  return (
    <motion.div
      className="intro"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      <div className="intro__stars" aria-hidden="true" />
      <motion.div
        className="intro__content"
        initial={{ y: 26, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="intro__eyebrow">
          <i /> {profile.callSign} · {profile.coordinates} · {profile.timezone}
        </p>
        <p className="intro__presents">BP-07 Studios presents</p>
        <h1>
          You are the <em>ship</em>.
        </h1>
        <p className="intro__lede">{profile.intro}</p>

        <div className="intro__planets">
          {planets.map((planet, index) => (
            <span key={planet.id} style={{ ["--planet" as string]: planet.glowColor }}>
              <i />
              {planet.label}
              <small>{planet.title}</small>
              <b>{index + 1}</b>
            </span>
          ))}
        </div>

        <div className="intro__actions">
          <button type="button" onClick={onLaunch}>
            Begin flight <span aria-hidden="true">↗</span>
          </button>
          <button type="button" className="intro__secondary" onClick={onTextMode}>
            Read as a document
          </button>
        </div>

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
