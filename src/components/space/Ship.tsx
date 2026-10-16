"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { engineState } from "@/lib/engineState";
import { flightInput } from "@/lib/flight";
import { DOCK_RANGE, UNIVERSE_RADIUS, dockPoint, planetById, type Simulation } from "@/lib/simulation";
import { planets, type SectionId } from "@/lib/profile";
import EnginePlume from "./EnginePlume";
import {
  buildAvionics,
  buildCanopy,
  buildCanopyFrame,
  buildChines,
  buildCockpit,
  buildCockpitGlow,
  buildEngines,
  buildFuselage,
  buildGearLeg,
  buildGreebles,
  buildIntakes,
  buildRadiator,
  buildSurfaces,
} from "./shipGeometry";
import { createHullMaps, createHazardTexture, createNozzleTexture, createRadiatorTexture } from "./textures";

const FORWARD = new THREE.Vector3(0, 0, 1);
/* Capital-scale interceptor: the whole airframe runs ~3x, slow majestic turns,
   heavy burn. Scale lives on the outer group so the plume, glare and lights all
   grow with the hull. */
const SHIP_SCALE = 2.8;
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

/* Radiator shoulders. Mounted high on the aft spine and canted outboard so the
   panels clear both the tailplanes and the vertical fin. */
const RADIATOR_MOUNT: [number, number, number] = [0.58, 1.12, -3.45];
const RADIATOR_TILT: [number, number, number] = [0, 0.2, 0.95];
/* Landing gear hinges: nose leg and the two main legs. */
const GEAR_NOSE: [number, number, number] = [0, -0.4, 3.0];
const GEAR_MAIN: [number, number, number] = [1.12, -0.6, -1.95];
const GEAR_LENGTH = 0.62;
const GEAR_STOW = 1.35;

/** Paint batches. Real hulls are sprayed panel by panel, never one colour. */
const HULL_PAINT = ["#cbd3de", "#b8c1ce", "#d9dee5", "#a9b3c1"];

type ShipProps = {
  sim: Simulation;
  onDock: (id: SectionId) => void;
  onRelease: () => void;
  /** Fired when the pilot grabs the sticks and cancels an autopilot course. */
  onTakeover?: () => void;
};

export default function Ship({ sim, onDock, onRelease, onTakeover }: ShipProps) {
  const group = useRef<THREE.Group>(null);
  const hull = useRef<THREE.Group>(null);
  const navLeft = useRef<THREE.Mesh>(null);
  const navRight = useRef<THREE.Mesh>(null);
  const gearNose = useRef<THREE.Group>(null);
  const gearPort = useRef<THREE.Group>(null);
  const gearStarboard = useRef<THREE.Group>(null);

  const velocity = useRef(new THREE.Vector3());
  const gearDeploy = useRef(0);

  /* Airframe. Built once: geometry, PBR materials and the procedural maps that
     carry the panel lines, rivets and rivulet grime. */
  const rig = useMemo(() => {
    const hullMaps = createHullMaps(4711, HULL_PAINT);
    const nozzleMap = createNozzleTexture();
    const radiatorMap = createRadiatorTexture();
    const hazardMap = createHazardTexture();

    const geometries = {
      fuselage: buildFuselage(),
      surfaces: buildSurfaces(),
      canopy: buildCanopy(),
      canopyFrame: buildCanopyFrame(),
      chines: buildChines(),
      intakes: buildIntakes(),
      avionics: buildAvionics(),
      engines: buildEngines(),
      greebles: buildGreebles(),
      cockpit: buildCockpit(),
      cockpitGlow: buildCockpitGlow(),
      radiatorStarboard: buildRadiator(1),
      radiatorPort: buildRadiator(-1),
      gear: buildGearLeg(GEAR_LENGTH),
    };

    const materials = {
      /* Painted skin. Metalness stays low: paint is a dielectric, and pushing
         it up in vacuum leaves nothing but three hard speculars to read. */
      hull: new THREE.MeshStandardMaterial({
        map: hullMaps.map,
        normalMap: hullMaps.normalMap,
        roughnessMap: hullMaps.roughnessMap,
        metalness: 0.32,
        roughness: 1,
        envMapIntensity: 1.6,
        // Floor brightness. A real hull in vacuum is almost entirely black at
        // most attitudes, which is authentic and useless as a hero asset — the
        // visitor's first question is "is that thing even there?". This keeps
        // the paint readable without washing out the key light's shading.
        emissive: new THREE.Color("#5f7590"),
        emissiveIntensity: 0.9,
      }),
      /* Bare structure: chines, pylons, avionics, gear. */
      structure: new THREE.MeshStandardMaterial({
        color: "#aab4c4",
        metalness: 0.72,
        roughness: 0.44,
        normalMap: hullMaps.normalMap,
        envMapIntensity: 1.8,
        emissive: new THREE.Color("#39455a"),
        emissiveIntensity: 0.5,
      }),
      /* Primer-grey hardware and plumbing. */
      greeble: new THREE.MeshStandardMaterial({
        color: "#5d6572",
        metalness: 0.55,
        roughness: 0.56,
        envMapIntensity: 1.4,
        emissive: new THREE.Color("#242c36"),
        emissiveIntensity: 0.45,
      }),
      /* Intakes and ducts read almost black in real life; the contrast is what
         makes the flanks look like they have depth. */
      intake: new THREE.MeshStandardMaterial({ color: "#14171d", metalness: 0.45, roughness: 0.62 }),
      nozzle: new THREE.MeshStandardMaterial({
        map: nozzleMap,
        metalness: 0.88,
        roughness: 0.5,
        color: "#ffffff",
        envMapIntensity: 2,
      }),
      /* Radiators read as dark honeycomb panels. No warm emissive: these face
         deep space and stay cold. */
      radiator: new THREE.MeshStandardMaterial({
        map: radiatorMap,
        metalness: 0.7,
        roughness: 0.42,
        color: "#cdd6e2",
        envMapIntensity: 1.5,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: "#0b1a26",
        emissive: "#2f7fa8",
        emissiveIntensity: 0.35,
        metalness: 0.55,
        roughness: 0.06,
        transparent: true,
        opacity: 0.46,
      }),
      interior: new THREE.MeshStandardMaterial({ color: "#22262e", metalness: 0.08, roughness: 0.88 }),
      instrument: new THREE.MeshBasicMaterial({ color: "#5fd8ff", toneMapped: false }),
      hazard: new THREE.MeshStandardMaterial({ map: hazardMap, metalness: 0.3, roughness: 0.62 }),
    };

    // Procedural geometry ships with no bounding volume, so the renderer culls
    // the hull against a stale/zero sphere and the craft vanishes while its
    // emissive trim keeps drawing. Prime the bounds once, and skip culling for
    // the airframe entirely — fifteen meshes cannot cost anything.
    for (const geometry of Object.values(geometries)) {
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
    }

    return {
      geometries,
      materials,
      textures: [hullMaps.map, hullMaps.normalMap, hullMaps.roughnessMap, nozzleMap, radiatorMap, hazardMap],
    };
  }, []);

  useEffect(
    () => () => {
      for (const geometry of Object.values(rig.geometries)) geometry.dispose();
      for (const material of Object.values(rig.materials)) material.dispose();
      for (const texture of rig.textures) texture.dispose();
    },
    [rig]
  );

  const scratch = useMemo(
    () => ({
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
      delta: new THREE.Quaternion(),
      inverse: new THREE.Quaternion(),
      forward: new THREE.Vector3(),
      local: new THREE.Vector3(),
      desired: new THREE.Vector3(),
      dock: new THREE.Vector3(),
      gravity: new THREE.Vector3(),
      pull: new THREE.Vector3(),
    }),
    []
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const body = group.current;
    if (!body) return;

    const manual =
      flightInput.thrust !== 0 ||
      flightInput.yaw !== 0 ||
      flightInput.pitch !== 0 ||
      flightInput.roll !== 0 ||
      flightInput.brake;

    if (manual && !sim.landing) {
      if (sim.docked) {
        sim.docked = null;
        onRelease();
      }
      if (sim.target) {
        sim.target = null;
        onTakeover?.();
      }
    }

    let thrust = flightInput.thrust;
    let yaw = flightInput.yaw;
    let pitch = flightInput.pitch;
    let roll = flightInput.roll;
    let boosting = flightInput.boost;

    // During atmospheric descent the autopilot flies; ignore inputs.
    if (sim.landing) {
      thrust = 0;
      yaw = 0;
      pitch = 0;
      roll = 0;
      boosting = false;
      velocity.current.multiplyScalar(0);
    }
    const docked = sim.landing ? null : sim.docked;

    if (!sim.landing && docked) {
      thrust = 0;
      yaw = 0;
      pitch = 0;
      roll = 0;
      boosting = false;
    } else if (sim.target) {
      const def = planetById(sim.target);
      const position = sim.positions.get(sim.target);
      if (position) {
        dockPoint(def, position, sim.shipPosition, scratch.dock);
        scratch.desired.copy(scratch.dock).sub(sim.shipPosition);
        const distance = scratch.desired.length();
        if (distance < DOCK_RANGE) {
          sim.docked = sim.target;
          sim.target = null;
          if (sim.docked) onDock(sim.docked);
        } else {
          scratch.desired.normalize();
          scratch.local.copy(scratch.desired).applyQuaternion(scratch.inverse.copy(sim.shipQuaternion).invert());
          const yawError = Math.atan2(scratch.local.x, scratch.local.z);
          const pitchError = Math.asin(THREE.MathUtils.clamp(scratch.local.y, -1, 1));
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
          const closing = THREE.MathUtils.clamp(
            (distance - DOCK_RANGE) * APPROACH_RATE,
            MIN_DOCK_SPEED,
            MAX_SPEED
          );
          if (velocity.current.length() > closing) velocity.current.setLength(closing);
        }
      }
    }

    scratch.euler.set(-pitch * TURN * delta, yaw * TURN * delta, roll * TURN * 1.3 * delta, "YXZ");
    scratch.delta.setFromEuler(scratch.euler);
    sim.shipQuaternion.multiply(scratch.delta).normalize();

    scratch.forward.copy(FORWARD).applyQuaternion(sim.shipQuaternion);
    const speedCap = boosting ? BOOST_SPEED : MAX_SPEED;

    if (thrust !== 0) {
      velocity.current.addScaledVector(scratch.forward, thrust * (boosting ? BOOST_ACCEL : ACCEL) * delta);
    }
    if (flightInput.brake) {
      // Retro-thrusters: burn directly against the velocity vector.
      velocity.current.addScaledVector(velocity.current, -4.5 * delta);
    }

    // Gravity wells: every planet pulls with inverse-square falloff.
    scratch.gravity.set(0, 0, 0);
    if (!docked) {
      for (const def of planets) {
        const planetPos = sim.positions.get(def.id);
        if (!planetPos) continue;
        scratch.pull.copy(planetPos).sub(sim.shipPosition);
        const distSq = Math.max(scratch.pull.lengthSq(), (def.radius * 3) ** 2);
        const strength = Math.min((GRAVITY_G * def.radius) / distSq, GRAVITY_BODY_CAP);
        scratch.gravity.addScaledVector(scratch.pull.normalize(), strength);
      }
      if (scratch.gravity.length() > GRAVITY_TOTAL_CAP) scratch.gravity.setLength(GRAVITY_TOTAL_CAP);
      velocity.current.addScaledVector(scratch.gravity, delta);
    }

    // Near-vacuum: the hull keeps gliding until something burns against it.
    const drag = flightInput.brake ? 6 : boosting ? BOOST_DRAG : DRAG;
    velocity.current.multiplyScalar(Math.exp(-drag * delta));
    if (velocity.current.length() > speedCap) velocity.current.setLength(speedCap);

    sim.shipPosition.addScaledVector(velocity.current, delta);

    if (docked) {
      const def = planetById(docked);
      const position = sim.positions.get(docked);
      if (position) {
        dockPoint(def, position, sim.shipPosition, scratch.dock);
        sim.shipPosition.lerp(scratch.dock, 1 - Math.exp(-2.4 * delta));
        velocity.current.multiplyScalar(Math.exp(-6 * delta));
      }
    }

    if (sim.shipPosition.length() > UNIVERSE_RADIUS) {
      sim.shipPosition.setLength(UNIVERSE_RADIUS);
      velocity.current.multiplyScalar(0.4);
    }

    body.position.copy(sim.shipPosition);
    body.quaternion.copy(sim.shipQuaternion);
    sim.shipSpeed = velocity.current.length();
    sim.climb = velocity.current.y;
    sim.boosting = boosting;
    sim.heading = (Math.atan2(scratch.forward.x, scratch.forward.z) * 180) / Math.PI;

    if (hull.current) {
      const bankTarget = THREE.MathUtils.clamp(-yaw * 0.55, -0.65, 0.65);
      hull.current.rotation.z += (bankTarget - hull.current.rotation.z) * Math.min(1, delta * 5);
      const pitchTarget = THREE.MathUtils.clamp(-pitch * 0.2, -0.35, 0.35);
      hull.current.rotation.x += (pitchTarget - hull.current.rotation.x) * Math.min(1, delta * 5);
    }

    // Publish the burn for the exhaust shaders: throttle from thrust command
    // and airspeed, so a coasting hull still shows a faint working plume.
    const wanted = Math.min(1.4, Math.abs(thrust) + sim.shipSpeed / 40) * (docked || sim.landing ? 0 : 1);
    engineState.throttle += (wanted - engineState.throttle) * Math.min(1, delta * (wanted > engineState.throttle ? 9 : 2.2));
    engineState.boost += ((boosting ? 1 : 0) - engineState.boost) * Math.min(1, delta * 5);

    // Landing gear drops for atmospheric entry, then folds away on the way up.
    gearDeploy.current += ((sim.landing ? 1 : 0) - gearDeploy.current) * Math.min(1, delta * 2.4);
    const stow = (1 - gearDeploy.current) * GEAR_STOW;
    for (const [ref, side] of [
      [gearNose, 0],
      [gearPort, -1],
      [gearStarboard, 1],
    ] as const) {
      const leg = ref.current;
      if (!leg) continue;
      leg.rotation.x = stow;
      leg.rotation.z = side * 0.15 * gearDeploy.current;
    }

    // Wingtip strobes: port red, starboard green, alternating blink.
    const blink = Math.sin(state.clock.elapsedTime * 5) > 0;
    for (const [ref, on] of [[navLeft, blink], [navRight, !blink]] as const) {
      const mesh = ref.current;
      if (mesh) (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 2.6 : 0.15;
    }
  }, -1);

  const { geometries, materials } = rig;

  return (
    <group ref={group} scale={SHIP_SCALE}>
      <group ref={hull}>
        {/* --- airframe --- */}
        <mesh geometry={geometries.fuselage} material={materials.hull} frustumCulled={false} />
        <mesh geometry={geometries.surfaces} material={materials.hull} frustumCulled={false} />
        <mesh geometry={geometries.canopyFrame} material={materials.hull} frustumCulled={false} />
        <mesh geometry={geometries.chines} material={materials.structure} frustumCulled={false} />
        <mesh geometry={geometries.greebles} material={materials.greeble} frustumCulled={false} />
        <mesh geometry={geometries.avionics} material={materials.structure} frustumCulled={false} />
        <mesh geometry={geometries.intakes} material={materials.intake} frustumCulled={false} />
        <mesh geometry={geometries.engines} material={materials.nozzle} frustumCulled={false} />

        {/* --- cockpit --- */}
        <mesh geometry={geometries.cockpit} material={materials.interior} />
        <mesh geometry={geometries.cockpitGlow} material={materials.instrument} />
        <mesh geometry={geometries.canopy} material={materials.glass} renderOrder={2} />

        {/* --- deployable radiators --- */}
        <group position={RADIATOR_MOUNT} rotation={RADIATOR_TILT}>
          <mesh geometry={geometries.radiatorStarboard} material={materials.radiator} />
        </group>
        <group
          position={[-RADIATOR_MOUNT[0], RADIATOR_MOUNT[1], RADIATOR_MOUNT[2]]}
          rotation={[RADIATOR_TILT[0], -RADIATOR_TILT[1], -RADIATOR_TILT[2]]}
        >
          <mesh geometry={geometries.radiatorPort} material={materials.radiator} />
        </group>

        {/* --- landing gear --- */}
        <group ref={gearNose} position={GEAR_NOSE}>
          <mesh geometry={geometries.gear} material={materials.structure} />
        </group>
        <group ref={gearPort} position={[-GEAR_MAIN[0], GEAR_MAIN[1], GEAR_MAIN[2]]}>
          <mesh geometry={geometries.gear} material={materials.structure} />
        </group>
        <group ref={gearStarboard} position={GEAR_MAIN}>
          <mesh geometry={geometries.gear} material={materials.structure} />
        </group>

        {/* --- markings and lights --- */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.42, -0.56, 1.5]}
            rotation={[Math.PI / 2 + 0.22, 0, side * 0.18]}
            material={materials.hazard}
          >
            <planeGeometry args={[0.52, 0.2]} />
          </mesh>
        ))}
        <mesh ref={navLeft} position={[-4.6, 0.8, -1.4]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#330000" emissive="#ff3b30" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh ref={navRight} position={[4.6, 0.8, -1.4]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#002b12" emissive="#35e065" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* Position light on the tail and a nose probe lamp. */}
        <mesh position={[0, 1.72, -3.7]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 5.3]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#002b12" emissive="#35e065" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </group>

      {/* Form light: a low kicker from below-aft so the belly and the chines still
          catch something when the camera is high. The main fill is
          ShipFillLight, which is anchored to the camera instead of the hull. */}
      <directionalLight position={[-14, -18, -30]} intensity={0.7} color="#7f9dc4" />

      <EnginePlume />
    </group>
  );
}