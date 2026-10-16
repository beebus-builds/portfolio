/**
 * Medal definitions, kept free of any client-only directive so server
 * components can read the titles. The stateful half lives in ./achievements.
 */

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

export function unlocksFor(event: AchievementEvent): AchievementId[] {
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
