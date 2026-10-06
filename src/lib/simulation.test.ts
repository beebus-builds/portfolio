import { describe, expect, it } from "vitest";
import { createSimulation, dockPoint, orbitPosition, planetById } from "@/lib/simulation";
import { planets } from "@/lib/profile";
import * as THREE from "three";

describe("simulation math", () => {
  it("moves planets along their orbit over time", () => {
    const def = planets[0];
    const a = orbitPosition(def, 0);
    const b = orbitPosition(def, 10);
    expect(a.distanceTo(b)).toBeGreaterThan(0.01);
  });

  it("keeps planets at roughly their orbit radius", () => {
    for (const def of planets) {
      const p = orbitPosition(def, 42);
      const horizontal = Math.hypot(p.x, p.z);
      expect(horizontal).toBeGreaterThan(def.orbitRadius * 0.5);
      expect(horizontal).toBeLessThanOrEqual(def.orbitRadius * 1.01);
    }
  });

  it("docks at a comfortable distance from the planet", () => {
    const def = planets[0];
    const planet = new THREE.Vector3(0, 0, 0);
    const ship = new THREE.Vector3(1, 0, 0);
    const point = dockPoint(def, planet, ship);
    const distance = point.distanceTo(planet);
    expect(distance).toBeCloseTo(def.radius * 2.5 + 12, 3);
  });

  it("resolves every planet by id and rejects unknown ones", () => {
    for (const def of planets) expect(planetById(def.id)).toBe(def);
    expect(() => planetById("pluto" as never)).toThrow();
  });

  it("starts with sane defaults", () => {
    const sim = createSimulation();
    expect(sim.shipSpeed).toBe(0);
    expect(sim.docked).toBeNull();
    expect(sim.positions.size).toBe(0);
  });
});
