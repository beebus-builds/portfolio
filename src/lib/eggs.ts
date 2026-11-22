/**
 * Easter eggs: secret key sequences typed anywhere on the homepage.
 * Pure and framework-free so the matching is easy to test.
 */

export type Egg = "party" | "hire" | "coffee" | "lights";

const KONAMI = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];

/** Each sequence is a list of `KeyboardEvent.key` values, lowercased. */
export const EGGS: Record<Egg, string[]> = {
  party: KONAMI,
  hire: [..."sudo hire bibash"],
  coffee: [..."coffee"],
  lights: [..."lights"],
};

const LONGEST = Math.max(...Object.values(EGGS).map((keys) => keys.length));

/**
 * Feed it every keypress; it returns the egg whose sequence was just
 * completed, or null. Keeps only as much history as the longest sequence.
 */
export function createEggMatcher() {
  let history: string[] = [];
  return (key: string): Egg | null => {
    history = [...history, key.toLowerCase()].slice(-LONGEST);
    for (const [egg, keys] of Object.entries(EGGS) as [Egg, string[]][]) {
      if (history.length < keys.length) continue;
      const tail = history.slice(-keys.length);
      if (tail.every((k, i) => k === keys[i])) {
        history = [];
        return egg;
      }
    }
    return null;
  };
}
