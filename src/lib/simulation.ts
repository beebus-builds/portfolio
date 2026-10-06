import * as THREE from "three";
import { planets, type PlanetDef, type SectionId } from "@/lib/profile";

/** Live world positions, refreshed once per frame before the ship is simulated. */
export type Simulation = {
  time: number;
  positions: Map<SectionId, THREE.Vector3>;
  spins: Map<SectionId, THREE.Vector3>;
  shipPosition: THREE.Vector3;
  shipQuaternion: THREE.Quaternion;
  shipSpeed: number;
  /** Vertical speed in world units/s: proves climbs and dives on the HUD. */
  climb: number;
  /** Compass heading in degrees. */
  heading: number;
  boosting: boolean;
  docked: SectionId | null;
  target: SectionId | null;
  /** Planet currently being descended onto (atmospheric entry). */
  landing: SectionId | null;
};

export function createSimulation(): Simulation {
  return {
    time: 0,
    positions: new Map(),
    spins: new Map(),
    shipPosition: new THREE.Vector3(),
    shipQuaternion: new THREE.Quaternion(),
    shipSpeed: 0,
    climb: 0,
    heading: 0,
    boosting: false,
    docked: null,
    target: null,
    landing: null,
  };
}

/** Where a planet sits at time `t`, including its inclined orbit. */
export function orbitPosition(def: PlanetDef, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const angle = def.orbitPhase + t * def.orbitSpeed;
  const x = Math.cos(angle) * def.orbitRadius;
  const z = Math.sin(angle) * def.orbitRadius;
  const tilt = new THREE.Euler(def.orbitTilt, 0, def.orbitTilt * 0.6);
  out.set(x, 0, z).applyEuler(tilt);
  out.y += Math.sin(t * def.orbitSpeed * 2 + def.orbitPhase) * def.orbitRadius * 0.05;
  return out;
}

export function planetSpin(def: PlanetDef, t: number): THREE.Euler {
  return new THREE.Euler(def.axialTilt, t * def.spinSpeed, 0);
}

/** The point a ship holds station at: a comfortable distance off the planet. */
export function dockPoint(
  def: PlanetDef,
  planetPosition: THREE.Vector3,
  shipPosition: THREE.Vector3,
  out = new THREE.Vector3()
): THREE.Vector3 {
  out.copy(shipPosition).sub(planetPosition);
  if (out.lengthSq() < 0.0001) out.set(0, 0.4, 1);
  out.normalize();
  return out.multiplyScalar(def.radius * 2.5 + 12).add(planetPosition);
}

export const DOCK_RANGE = 7;
export const UNIVERSE_RADIUS = 780;

export function planetById(id: SectionId): PlanetDef {
  const found = planets.find((planet) => planet.id === id);
  if (!found) throw new Error(`Unknown planet: ${id}`);
  return found;
}
