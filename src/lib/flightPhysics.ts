import * as THREE from "three";
import { getPlanet, planets, type SectionId } from "@/lib/profile";
import { DOCK_RANGE, UNIVERSE_RADIUS, dockPoint, type Simulation } from "@/lib/simulation";

/**
 * Flight model for the interceptor, stepped once per frame. Pure simulation:
 * it reads the pilot (or autopilot) commands, integrates attitude, thrust,
 * gravity, drag and the dock/bounds behaviour, and writes position, attitude
 * and telemetry back into the Simulation. No rendering, no React — the Ship
 * component turns the returned step into mesh transforms and exhaust state.
 */

const MAX_SPEED = 42;
const BOOST_SPEED = 100;
const ACCEL = 34;
const BOOST_ACCEL = 70;
const DRAG = 0.06;
const BOOST_DRAG = 0.04;
/** Where the autopilot stops boosting; the speed limiter below takes over. */
const BOOST_CUTOFF = 90;
/**
 * Closing-speed budget per unit of remaining distance. At 0.55 the ship is
 * doing ~37 u/s at 70 units out and ~6 u/s by the dock sphere, which it cannot
 * pass through in a single frame at any plausible frame rate.
 */
const APPROACH_RATE = 0.55;
/** Floor on approach speed so the final metres still make progress. */
const MIN_DOCK_SPEED = 6;
const TURN = 1.3;
/* Real-world gravity wells: every planet tugs the hull with inverse-square
   falloff. Capped low so the main drive and the autopilot always win. */
const GRAVITY_G = 420;
const GRAVITY_BODY_CAP = 3.5;
const GRAVITY_TOTAL_CAP = 8;

const FORWARD = new THREE.Vector3(0, 0, 1);

/** The axis subset of FlightInput the flight model actually reads. */
export type ShipControls = {
  /** Forward / reverse thrust, -1 to 1. */
  thrust: number;
  yaw: number;
  pitch: number;
  roll: number;
  boost: boolean;
  brake: boolean;
};

/** Side effects the flight model can trigger; owned by the React tree. */
export type FlightEvents = {
  onDock?: (id: SectionId) => void;
  onRelease?: () => void;
  onTakeover?: () => void;
};

/** What the renderer needs from a step to animate the hull and exhaust. */
export type FlightStep = {
  /** Commanded axes after the autopilot had its say. */
  thrust: number;
  yaw: number;
  pitch: number;
  boosting: boolean;
  /** Planet the ship holds station at after this step, if any. */
  docked: SectionId | null;
  /** True while the autopilot flies the atmospheric descent. */
  landing: boolean;
};

/* Scratch vectors. Single-threaded, synchronous: safe to share across calls
   and it keeps the per-frame allocation at zero. */
const euler = new THREE.Euler(0, 0, 0, "YXZ");
const deltaQ = new THREE.Quaternion();
const inverse = new THREE.Quaternion();
const forward = new THREE.Vector3();
const local = new THREE.Vector3();
const desired = new THREE.Vector3();
const dock = new THREE.Vector3();
const gravity = new THREE.Vector3();
const pull = new THREE.Vector3();

/**
 * Advance the ship by one frame. `velocity` is persistent across steps (the
 * component keeps it in a ref); `sim` is mutated in place. Callbacks in
 * `events` fire exactly when the original frame loop would fire them.
 */
export function stepShipFlight(
  sim: Simulation,
  velocity: THREE.Vector3,
  controls: ShipControls,
  rawDelta: number,
  events: FlightEvents = {}
): FlightStep {
  const delta = Math.min(rawDelta, 0.05);

  const manual =
    controls.thrust !== 0 || controls.yaw !== 0 || controls.pitch !== 0 || controls.roll !== 0 || controls.brake;

  if (manual && !sim.landing) {
    if (sim.docked) {
      sim.docked = null;
      events.onRelease?.();
    }
    if (sim.target) {
      sim.target = null;
      events.onTakeover?.();
    }
  }

  let thrust = controls.thrust;
  let yaw = controls.yaw;
  let pitch = controls.pitch;
  let roll = controls.roll;
  let boosting = controls.boost;

  // During atmospheric descent the autopilot flies; ignore inputs.
  if (sim.landing) {
    thrust = 0;
    yaw = 0;
    pitch = 0;
    roll = 0;
    boosting = false;
    velocity.multiplyScalar(0);
  }
  const docked = sim.landing ? null : sim.docked;

  if (!sim.landing && docked) {
    thrust = 0;
    yaw = 0;
    pitch = 0;
    roll = 0;
    boosting = false;
  } else if (sim.target) {
    const target = sim.target;
    const def = getPlanet(target);
    const position = sim.positions.get(target);
    if (position) {
      dockPoint(def, position, sim.shipPosition, dock);
      desired.copy(dock).sub(sim.shipPosition);
      const distance = desired.length();
      if (distance < DOCK_RANGE) {
        sim.docked = target;
        sim.target = null;
        if (sim.docked) events.onDock?.(sim.docked);
      } else {
        desired.normalize();
        local.copy(desired).applyQuaternion(inverse.copy(sim.shipQuaternion).invert());
        const yawError = Math.atan2(local.x, local.z);
        const pitchError = Math.asin(THREE.MathUtils.clamp(local.y, -1, 1));
        const aligned = Math.abs(yawError) < 0.22 && Math.abs(pitchError) < 0.22;
        yaw = THREE.MathUtils.clamp(yawError * 2, -1, 1);
        pitch = THREE.MathUtils.clamp(pitchError * 2, -1, 1);
        roll = 0;
        boosting = aligned && distance > BOOST_CUTOFF;
        thrust = aligned ? 1 : 0.45;
        // Approach speed limit. Drag has a ~25s time constant, so a 100 u/s
        // run cannot be bled off by easing off the throttle: the ship would
        // blow straight through the 7-unit dock sphere, turn around and
        // oscillate. Cap the closing speed by the room that actually remains
        // instead, so arrival is always slower than the dock radius can miss.
        const closing = THREE.MathUtils.clamp((distance - DOCK_RANGE) * APPROACH_RATE, MIN_DOCK_SPEED, MAX_SPEED);
        if (velocity.length() > closing) velocity.setLength(closing);
      }
    }
  }

  euler.set(-pitch * TURN * delta, yaw * TURN * delta, roll * TURN * 1.3 * delta, "YXZ");
  deltaQ.setFromEuler(euler);
  sim.shipQuaternion.multiply(deltaQ).normalize();

  forward.copy(FORWARD).applyQuaternion(sim.shipQuaternion);
  const speedCap = boosting ? BOOST_SPEED : MAX_SPEED;

  if (thrust !== 0) {
    velocity.addScaledVector(forward, thrust * (boosting ? BOOST_ACCEL : ACCEL) * delta);
  }
  if (controls.brake) {
    // Retro-thrusters: burn directly against the velocity vector.
    velocity.addScaledVector(velocity, -4.5 * delta);
  }

  // Gravity wells: every planet pulls with inverse-square falloff.
  gravity.set(0, 0, 0);
  if (!docked) {
    for (const def of planets) {
      const planetPos = sim.positions.get(def.id);
      if (!planetPos) continue;
      pull.copy(planetPos).sub(sim.shipPosition);
      const distSq = Math.max(pull.lengthSq(), (def.radius * 3) ** 2);
      const strength = Math.min((GRAVITY_G * def.radius) / distSq, GRAVITY_BODY_CAP);
      gravity.addScaledVector(pull.normalize(), strength);
    }
    if (gravity.length() > GRAVITY_TOTAL_CAP) gravity.setLength(GRAVITY_TOTAL_CAP);
    velocity.addScaledVector(gravity, delta);
  }

  // Near-vacuum: the hull keeps gliding until something burns against it.
  const drag = controls.brake ? 6 : boosting ? BOOST_DRAG : DRAG;
  velocity.multiplyScalar(Math.exp(-drag * delta));
  if (velocity.length() > speedCap) velocity.setLength(speedCap);

  sim.shipPosition.addScaledVector(velocity, delta);

  if (docked) {
    const def = getPlanet(docked);
    const position = sim.positions.get(docked);
    if (position) {
      dockPoint(def, position, sim.shipPosition, dock);
      sim.shipPosition.lerp(dock, 1 - Math.exp(-2.4 * delta));
      velocity.multiplyScalar(Math.exp(-6 * delta));
    }
  }

  if (sim.shipPosition.length() > UNIVERSE_RADIUS) {
    sim.shipPosition.setLength(UNIVERSE_RADIUS);
    velocity.multiplyScalar(0.4);
  }

  sim.shipSpeed = velocity.length();
  sim.climb = velocity.y;
  sim.boosting = boosting;
  sim.heading = (Math.atan2(forward.x, forward.z) * 180) / Math.PI;

  return {
    thrust,
    yaw,
    pitch,
    boosting,
    // Post-dock state: a planet captured this frame counts immediately, so the
    // renderer never paints one more burning plume frame after arrival.
    docked: sim.landing ? null : sim.docked,
    landing: Boolean(sim.landing),
  };
}
