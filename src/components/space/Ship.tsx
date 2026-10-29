"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { engineState } from "@/lib/engineState";
import { flightInput } from "@/lib/flight";
import { stepShipFlight } from "@/lib/flightPhysics";
import type { Simulation } from "@/lib/simulation";
import type { SectionId } from "@/lib/profile";
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

/* Capital-scale interceptor: the whole airframe runs ~3x, slow majestic turns,
   heavy burn. Scale lives on the outer group so the plume, glare and lights all
   grow with the hull. */
const SHIP_SCALE = 2.8;

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
  const gearDeploy = useRef(0);  /* Airframe. Built once: geometry, PBR materials and the procedural maps that
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

  useFrame((state, rawDelta) => {
    // Same ceiling the flight model uses, so a long hitch can't fling the
    // visual easing (bank, gear, exhaust) either.
    const delta = Math.min(rawDelta, 0.05);
    const body = group.current;
    if (!body) return;

    // The whole flight model — autopilot, gravity, drag, docking — lives in
    // lib/flightPhysics. Here we only apply what it reports to the meshes.
    const step = stepShipFlight(sim, velocity.current, flightInput, delta, {
      onDock,
      onRelease,
      onTakeover,
    });
    const { docked } = step;

    body.position.copy(sim.shipPosition);
    body.quaternion.copy(sim.shipQuaternion);

    if (hull.current) {
      const bankTarget = THREE.MathUtils.clamp(-step.yaw * 0.55, -0.65, 0.65);
      hull.current.rotation.z += (bankTarget - hull.current.rotation.z) * Math.min(1, delta * 5);
      const pitchTarget = THREE.MathUtils.clamp(-step.pitch * 0.2, -0.35, 0.35);
      hull.current.rotation.x += (pitchTarget - hull.current.rotation.x) * Math.min(1, delta * 5);
    }

    // Publish the burn for the exhaust shaders: throttle from thrust command
    // and airspeed, so a coasting hull still shows a faint working plume.
    const wanted = Math.min(1.4, Math.abs(step.thrust) + sim.shipSpeed / 40) * (docked || step.landing ? 0 : 1);
    engineState.throttle += (wanted - engineState.throttle) * Math.min(1, delta * (wanted > engineState.throttle ? 9 : 2.2));
    engineState.boost += ((step.boosting ? 1 : 0) - engineState.boost) * Math.min(1, delta * 5);

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