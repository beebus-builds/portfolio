"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AchievementId =
  | "ignition"
  | "first-dock"
  | "cartographer"
  | "tourist"
  | "warpath"
  | "open-channel";

export interface Achievement {
  id: AchievementId;
  title: string;
  detail: string;
}

export const achievements: Achievement[] = [
  { id: "ignition", title: "Ignition", detail: "Took the sticks for the first time." },
  { id: "first-dock", title: "First Docking", detail: "Brought the ship in alongside a planet." },
  { id: "cartographer", title: "Cartographer", detail: "Visited every planet in the system." },
  { id: "tourist", title: "Grand Tour", detail: "Ran the guided tour of the system." },
  { id: "warpath", title: "Warpath", detail: "Held full boost for three seconds." },
  { id: "open-channel", title: "Open Channel", detail: "Set course for the contact world." },
];

export type AchievementEvent =
  | { type: "launch" }
  | { type: "dock" }
  | { type: "visit-all" }
  | { type: "tour" }
  | { type: "boost-hold" }
  | { type: "contact" };

function unlocksFor(event: AchievementEvent): AchievementId[] {
  switch (event.type) {
    case "launch":
      return ["ignition"];
    case "dock":
      return ["first-dock"];
    case "visit-all":
      return ["cartographer"];
    case "tour":
      return ["tourist"];
    case "boost-hold":
      return ["warpath"];
    case "contact":
      return ["open-channel"];
  }
}

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
