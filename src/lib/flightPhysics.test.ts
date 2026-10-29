import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { createSimulation, dockPoint, type Simulation } from "@/lib/simulation";
import { getPlanet } from "@/lib/profile";
import { stepShipFlight, type ShipControls } from "@/lib/flightPhysics";

const ID = "about";
const DT = 1 / 60;

/** Identity attitude looks down +Z, matching FORWARD in the flight model. */
const IDENTITY = new THREE.Quaternion();

function facing(direction: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
}

function setup(targetDistance?: number): { sim: Simulation; velocity: THREE.Vector3; def: ReturnType<typeof getPlanet> } {
  const sim = createSimulation();
  const def = getPlanet(ID);
  const planetPos = new THREE.Vector3(400, 0, 0);
  sim.positions.set(ID, planetPos);
  if (targetDistance !== undefined) {
    // Park the ship exactly behind the planet's dock point along +X so the
    // approach geometry is trivially deterministic.
    const point = dockPoint(def, planetPos, new THREE.Vector3(400 + targetDistance, 0, 0));
    sim.shipPosition.copy(point).add(new THREE.Vector3(targetDistance, 0, 0));
  }
  return { sim, velocity: new THREE.Vector3(), def };
}

const IDLE: ShipControls = { thrust: 0, yaw: 0, pitch: 0, roll: 0, boost: false, brake: false };

describe("stepShipFlight", () => {
  it("accelerates along the nose under thrust", () => {
    const { sim, velocity } = setup();
    sim.shipQuaternion.copy(IDENTITY);
    const start = sim.shipPosition.clone();

    const step = stepShipFlight(sim, velocity, { ...IDLE, thrust: 1 }, DT);

    expect(step.thrust).toBe(1);
    expect(sim.shipPosition.z).toBeGreaterThan(start.z);
    expect(sim.shipSpeed).toBeGreaterThan(0);
    // Identity attitude: +Z forward, so heading stays on the +Z axis.
    expect(sim.heading).toBeCloseTo(0, 5);
  });

  it("caps speed at MAX_SPEED and BOOST_SPEED", () => {
    const { sim, velocity } = setup();
    sim.shipQuaternion.copy(IDENTITY);

    for (let i = 0; i < 300; i += 1) stepShipFlight(sim, velocity, { ...IDLE, thrust: 1 }, DT);
    expect(sim.shipSpeed).toBeLessThanOrEqual(42 + 1e-9);

    velocity.set(0, 0, 0);
    sim.shipPosition.set(0, 0, 0);
    for (let i = 0; i < 300; i += 1) stepShipFlight(sim, velocity, { ...IDLE, thrust: 1, boost: true }, DT);
    expect(sim.shipSpeed).toBeLessThanOrEqual(100 + 1e-9);
    expect(sim.shipSpeed).toBeGreaterThan(50);
    expect(sim.boosting).toBe(true);
  });

  it("pulls the ship toward nearby planets via gravity", () => {
    const { sim, velocity } = setup();
    sim.shipPosition.set(0, 20, 0);
    const before = velocity.clone();

    stepShipFlight(sim, velocity, IDLE, DT);

    // The about-planet sits at +X; the hull must gain velocity along that axis
    // even with no thrust commanded.
    expect(velocity.x).toBeGreaterThan(before.x);
    expect(velocity.x).toBeGreaterThan(0);
    expect(sim.climb).toBeCloseTo(velocity.y, 5);
  });

  it("steers the autopilot toward the targeted planet", () => {
    const { sim, velocity } = setup(120);
    sim.target = ID;
    // Point the nose 90 degrees off the approach axis.
    sim.shipQuaternion.copy(facing(new THREE.Vector3(0, 0, 1)));

    const step = stepShipFlight(sim, velocity, IDLE, DT);

    // Autopilot took the sticks: a commanded yaw towards -X and some thrust.
    expect(step.yaw).not.toBe(0);
    expect(step.thrust).toBeGreaterThan(0);
    expect(step.docked).toBeNull();
  });

  it("limits approach speed by remaining distance", () => {
    const { sim, velocity } = setup(70);
    sim.target = ID;
    const planetPos = sim.positions.get(ID);
    if (!planetPos) throw new Error("planet position missing");
    // Aligned straight at the planet, already closing at 60 u/s.
    sim.shipQuaternion.copy(facing(planetPos.clone().sub(sim.shipPosition)));
    velocity.copy(planetPos).sub(sim.shipPosition).normalize().multiplyScalar(60);

    stepShipFlight(sim, velocity, IDLE, DT);

    // The closing budget for 70 units out is (70-7)*0.55 = 34.65 u/s: the
    // limiter must have bled the 60 u/s approach back to roughly that.
    expect(velocity.length()).toBeGreaterThan(30);
    expect(velocity.length()).toBeLessThan(40);
  });

  it("docks inside the dock sphere and fires onDock", () => {
    const { sim, velocity } = setup();
    const def = getPlanet(ID);
    const planetPos = sim.positions.get(ID);
    if (!planetPos) throw new Error("planet position missing");
    const point = dockPoint(def, planetPos, sim.shipPosition);
    sim.shipPosition.copy(point);
    sim.target = ID;
    const onDock = vi.fn();

    const step = stepShipFlight(sim, velocity, IDLE, DT, { onDock });

    expect(sim.docked).toBe(ID);
    expect(sim.target).toBeNull();
    expect(step.docked).toBe(ID);
    expect(onDock).toHaveBeenCalledWith(ID);
    // Docked ships hold station: their velocity bleeds away.
    expect(sim.shipSpeed).toBeLessThan(1);
  });

  it("releases the dock on manual input", () => {
    const { sim, velocity } = setup();
    sim.docked = ID;
    const onRelease = vi.fn();

    stepShipFlight(sim, velocity, { ...IDLE, thrust: 1 }, DT, { onRelease });

    expect(sim.docked).toBeNull();
    expect(onRelease).toHaveBeenCalledOnce();
  });

  it("cancels the autopilot target on manual input", () => {
    const { sim, velocity } = setup(120);
    sim.target = ID;
    const onTakeover = vi.fn();

    stepShipFlight(sim, velocity, { ...IDLE, yaw: 0.5 }, DT, { onTakeover });

    expect(sim.target).toBeNull();
    expect(onTakeover).toHaveBeenCalledOnce();
  });

  it("flies the landing itself: inputs ignored, velocity bled", () => {
    const { sim, velocity } = setup();
    sim.landing = ID;
    sim.docked = ID;
    velocity.set(30, 0, 0);

    const step = stepShipFlight(sim, velocity, { thrust: 1, yaw: 1, pitch: 1, roll: 1, boost: true, brake: false }, DT);

    expect(step.landing).toBe(true);
    expect(step.thrust).toBe(0);
    expect(step.yaw).toBe(0);
    expect(step.boosting).toBe(false);
    // Inputs are zeroed but the descent still feels gravity.
    expect(velocity.length()).toBeLessThan(1);
  });

  it("clamps the ship inside the universe and damps the overshoot", () => {
    const { sim, velocity } = setup();
    sim.shipPosition.set(790, 0, 0);
    velocity.set(100, 0, 0);

    stepShipFlight(sim, velocity, IDLE, DT);

    expect(sim.shipPosition.length()).toBeLessThanOrEqual(780);
    expect(velocity.length()).toBeLessThan(100);
  });

  it("never simulates more than 50 ms per step", () => {
    const { sim, velocity } = setup();
    sim.shipQuaternion.copy(IDENTITY);
    const start = sim.shipPosition.clone();

    stepShipFlight(sim, velocity, { ...IDLE, thrust: 1 }, 1);

    // One second of unclamped thrust at 34 u/s would move 34 units; a 50 ms
    // step with drag moves ~1.7.
    expect(sim.shipPosition.distanceTo(start)).toBeLessThan(3);
  });
});
