/**
 * Pure game logic for the city builder on the landing page.
 *
 * The state is deliberately small and serializable so it can live in
 * localStorage with no backend. Every function returns a new state; the React
 * layer only renders it and forwards player actions. Nothing here touches the
 * DOM, the network or the old flight simulation.
 */

export const GRID_W = 12;
export const GRID_H = 8;
export const GRID_SIZE = GRID_W * GRID_H;
export const START_CREDITS = 320;
export const START_HAPPINESS = 62;

export type BuildingKey =
  | "home"
  | "farm"
  | "workshop"
  | "park"
  | "cafe"
  | "studio"
  | "library"
  | "landmark";

export type DistrictId = "about" | "skills" | "projects" | "services" | "experience" | "resume" | "stats" | "contact";

export type Tile =
  | { kind: "road" }
  | { kind: "hall" }
  | { kind: "district"; id: DistrictId }
  | { kind: "building"; key: BuildingKey };

export type Building = {
  name: string;
  icon: string;
  cost: number;
  income: number;
  happiness: number;
  population: number;
  xp: number;
  level: number;
  blurb: string;
};

export const BUILDINGS: Record<BuildingKey, Building> = {
  home: { name: "Cottage", icon: "⌂", cost: 50, income: 7, happiness: 0, population: 4, xp: 8, level: 1, blurb: "A place for new residents. Steady tax income." },
  farm: { name: "Market Garden", icon: "✿", cost: 75, income: 13, happiness: 1, population: 0, xp: 10, level: 1, blurb: "Feeds the town and pays the bills." },
  park: { name: "City Park", icon: "♣", cost: 90, income: 0, happiness: 9, population: 0, xp: 12, level: 1, blurb: "Happy citizens, no direct income." },
  workshop: { name: "Workshop", icon: "⚒", cost: 145, income: 27, happiness: -2, population: 2, xp: 18, level: 2, blurb: "Where the useful things get made." },
  cafe: { name: "Café", icon: "☕", cost: 160, income: 32, happiness: 5, population: 1, xp: 20, level: 2, blurb: "Coffee, conversation and decent revenue." },
  studio: { name: "Design Studio", icon: "✎", cost: 230, income: 45, happiness: 3, population: 2, xp: 26, level: 3, blurb: "Interfaces with intent, on the payroll." },
  library: { name: "Library", icon: "▤", cost: 260, income: 18, happiness: 7, population: 0, xp: 28, level: 3, blurb: "Knowledge, quiet and a reading room." },
  landmark: { name: "Landmark", icon: "★", cost: 480, income: 88, happiness: 6, population: 0, xp: 45, level: 4, blurb: "A shipped project the whole city can see." },
};

export const BUILDING_ORDER: BuildingKey[] = [
  "home",
  "farm",
  "park",
  "workshop",
  "cafe",
  "studio",
  "library",
  "landmark",
];

export const DISTRICTS: { id: DistrictId; label: string; icon: string; level: number; blurb: string }[] = [
  { id: "about", label: "Town Hall", icon: "i", level: 1, blurb: "Who runs this place" },
  { id: "skills", label: "Academy", icon: "✦", level: 1, blurb: "Everything in the toolbox" },
  { id: "projects", label: "Landmarks", icon: "★", level: 2, blurb: "Things that shipped" },
  { id: "services", label: "Exchange", icon: "¤", level: 2, blurb: "What I can build for you" },
  { id: "experience", label: "Museum", icon: "⌛", level: 3, blurb: "The road here" },
  { id: "resume", label: "Archive", icon: "▤", level: 3, blurb: "The printed record" },
  { id: "stats", label: "Observatory", icon: "◎", level: 4, blurb: "Live city telemetry" },
  { id: "contact", label: "Radio Tower", icon: "✉", level: 4, blurb: "Open a channel" },
];

export type CityState = {
  credits: number;
  happiness: number;
  population: number;
  xp: number;
  cycle: number;
  tiles: (Tile | null)[];
  visited: DistrictId[];
};

/** Roads form a simple street pattern; fixed so saves stay valid. */
function isRoad(x: number, y: number): boolean {
  return x === 3 || x === 8 || y === 2 || y === 5;
}

const DISTRICT_SLOTS: { x: number; y: number; id: DistrictId }[] = [
  { x: 0, y: 0, id: "about" },
  { x: 6, y: 0, id: "skills" },
  { x: 10, y: 0, id: "projects" },
  { x: 1, y: 3, id: "services" },
  { x: 6, y: 3, id: "experience" },
  { x: 10, y: 3, id: "resume" },
  { x: 1, y: 6, id: "stats" },
  { x: 10, y: 6, id: "contact" },
];

export function tileIndex(x: number, y: number): number {
  return y * GRID_W + x;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
}

export function levelFor(xp: number): number {
  return Math.max(1, Math.min(5, 1 + Math.floor(xp / 60)));
}

export function createInitialState(): CityState {
  const tiles: (Tile | null)[] = Array.from({ length: GRID_SIZE }, (_, index) => {
    const x = index % GRID_W;
    const y = Math.floor(index / GRID_W);
    if (x === 5 && y === 3) return { kind: "hall" };
    const slot = DISTRICT_SLOTS.find((entry) => entry.x === x && entry.y === y);
    if (slot) return { kind: "district", id: slot.id };
    if (isRoad(x, y)) return { kind: "road" };
    return null;
  });
  return {
    credits: START_CREDITS,
    happiness: START_HAPPINESS,
    population: 0,
    xp: 0,
    cycle: 0,
    tiles,
    visited: [],
  };
}

export type BuildResult = "ok" | "occupied" | "locked" | "poor" | "invalid";

/** Why a building cannot go on a tile — also used to grey out the palette. */
export function checkPlacement(state: CityState, key: BuildingKey, x: number, y: number): BuildResult {
  const def = BUILDINGS[key];
  if (!def || !inBounds(x, y)) return "invalid";
  if (state.tiles[tileIndex(x, y)] !== null) return "occupied";
  if (def.level > levelFor(state.xp)) return "locked";
  if (state.credits < def.cost) return "poor";
  return "ok";
}

export function placeBuilding(state: CityState, key: BuildingKey, x: number, y: number): CityState {
  if (checkPlacement(state, key, x, y) !== "ok") return state;
  const tiles = state.tiles.slice();
  tiles[tileIndex(x, y)] = { kind: "building", key };
  return {
    ...state,
    credits: state.credits - BUILDINGS[key].cost,
    xp: state.xp + BUILDINGS[key].xp,
    tiles,
  };
}

export function countBuildings(state: CityState): Record<BuildingKey, number> {
  const counts = Object.fromEntries(BUILDING_ORDER.map((key) => [key, 0])) as Record<BuildingKey, number>;
  for (const tile of state.tiles) {
    if (tile?.kind === "building") counts[tile.key] += 1;
  }
  return counts;
}

/** One simulation cycle: collect revenue, drift mood, adjust population. */
export function advanceCycle(state: CityState): CityState {
  const counts = countBuildings(state);
  const gross = BUILDING_ORDER.reduce((sum, key) => sum + counts[key] * BUILDINGS[key].income, 0);
  const multiplier = 0.55 + (state.happiness / 100) * 0.65;
  const income = Math.round(gross * multiplier);

  const targetHappiness = Math.max(
    0,
    Math.min(100, 55 + BUILDING_ORDER.reduce((sum, key) => sum + counts[key] * BUILDINGS[key].happiness, 0))
  );
  const happiness = clampToward(state.happiness, targetHappiness, 2);

  const capacity = BUILDING_ORDER.reduce((sum, key) => sum + counts[key] * BUILDINGS[key].population, 0);
  const population = happiness < 40
    ? clampToward(state.population, 0, 2)
    : clampToward(state.population, capacity, 2);

  return { ...state, credits: state.credits + income, happiness, population, cycle: state.cycle + 1 };
}

function clampToward(current: number, target: number, step: number): number {
  if (current < target) return Math.min(target, current + step);
  if (current > target) return Math.max(target, current - step);
  return current;
}

export function isUnlocked(state: CityState, district: DistrictId): boolean {
  const def = DISTRICTS.find((entry) => entry.id === district);
  return !!def && def.level <= levelFor(state.xp);
}

export function markVisited(state: CityState, district: DistrictId): CityState {
  if (state.visited.includes(district)) return state;
  return { ...state, visited: [...state.visited, district] };
}

export type CityGoal = { id: string; label: string; done: boolean; progress: string };

export function goalsFor(state: CityState): CityGoal[] {
  const counts = countBuildings(state);
  const homes = counts.home;
  const buildings = BUILDING_ORDER.reduce((sum, key) => sum + counts[key], 0);
  return [
    { id: "homes", label: "Welcome the first residents", done: homes >= 3, progress: `${Math.min(homes, 3)}/3 cottages` },
    { id: "business", label: "Open a business", done: counts.workshop + counts.cafe + counts.studio >= 1, progress: "1 workplace" },
    { id: "green", label: "Make the city a nicer place", done: counts.park >= 2, progress: `${Math.min(counts.park, 2)}/2 parks` },
    { id: "builder", label: "Become a master builder", done: buildings >= 12, progress: `${Math.min(buildings, 12)}/12 buildings` },
    { id: "landmark", label: "Ship a landmark project", done: counts.landmark >= 1, progress: "1 landmark" },
    { id: "tour", label: "Explore every district", done: state.visited.length === DISTRICTS.length, progress: `${state.visited.length}/${DISTRICTS.length} districts` },
  ];
}

/** Saves are versioned; an unknown shape is discarded rather than trusted. */
export function serialize(state: CityState): string {
  return JSON.stringify({ version: 1, state });
}

export function deserialize(raw: string | null): CityState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version?: number; state?: CityState };
    if (parsed.version !== 1 || !parsed.state) return null;
    const state = parsed.state;
    if (!Array.isArray(state.tiles) || state.tiles.length !== GRID_SIZE) return null;
    if (!Array.isArray(state.visited) || typeof state.credits !== "number") return null;
    return state;
  } catch {
    return null;
  }
}
