"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Achievement } from "@/lib/achievements";

export default function AchievementToast({ toast }: { toast: Achievement | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          className="achievement"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 18, x: "-50%", scale: 0.96 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: -10, x: "-50%", scale: 0.97 }}
        >
          <span className="achievement__tag">Achievement unlocked</span>
          <b>{toast.title}</b>
          <p>{toast.detail}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
