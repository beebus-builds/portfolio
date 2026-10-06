"use client";

import { AnimatePresence, motion } from "framer-motion";
import { achievements, type AchievementId } from "@/lib/achievements";

export default function AchievementsPanel({
  unlocked,
  onClose,
}: {
  unlocked: Set<AchievementId>;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="medals"
        role="dialog"
        aria-label="Achievements"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
      >
        <motion.div
          className="medals__card"
          initial={{ scale: 0.97 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.22, 0.9, 0.28, 1] }}
        >
          <header>
            <b>MEDALS · {unlocked.size}/{achievements.length}</b>
            <button type="button" onClick={onClose} aria-label="Close achievements">
              ✕
            </button>
          </header>
          <ul>
            {achievements.map((achievement) => {
              const got = unlocked.has(achievement.id);
              return (
                <li key={achievement.id} data-unlocked={got || undefined}>
                  <span aria-hidden="true">{got ? "★" : "☆"}</span>
                  <div>
                    <b>{achievement.title}</b>
                    <small>{achievement.detail}</small>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}