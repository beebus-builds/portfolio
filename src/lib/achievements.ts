"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  achievements,
  unlocksFor,
  type Achievement,
  type AchievementEvent,
  type AchievementId,
} from "./medals";

export { achievements, unlocksFor };
export type { Achievement, AchievementEvent, AchievementId };

/**
 * Tracks unlocked achievements and surfaces the most recent unlock as a
 * toast. Persistence is handled by the caller (server-backed progress).
 * Events are idempotent: re-reporting an unlocked achievement does nothing.
 */
export function useAchievements() {
  const [unlocked, setUnlocked] = useState<Set<AchievementId>>(new Set());
  const [toast, setToast] = useState<Achievement | null>(null);
  const queue = useRef<Achievement[]>([]);
  const timer = useRef<number | null>(null);

  /** Merge server-loaded unlocks into state without firing toasts. */
  const hydrate = useCallback((ids: AchievementId[]) => {
    setUnlocked((current) => new Set([...current, ...ids]));
  }, []);

  const drain = useCallback(() => {
    setToast((current) => {
      if (current) return current;
      const next = queue.current.shift() ?? null;
      if (next) {
        timer.current = window.setTimeout(() => {
          setToast(null);
          timer.current = window.setTimeout(drain, 250);
        }, 3600);
      }
      return next;
    });
  }, []);

  const report = useCallback(
    (event: AchievementEvent) => {
      const ids = unlocksFor(event);
      setUnlocked((current) => {
        const fresh = ids.filter((id) => !current.has(id));
        if (fresh.length === 0) return current;
        const next = new Set(current);
        for (const id of fresh) {
          next.add(id);
          const achievement = achievements.find((item) => item.id === id);
          if (achievement) queue.current.push(achievement);
        }
        window.setTimeout(drain, 0);
        return next;
      });
    },
    [drain]
  );

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return { unlocked, toast, report, hydrate };
}
