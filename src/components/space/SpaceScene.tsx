"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SectionId } from "@/lib/profile";
import type { Simulation } from "@/lib/simulation";import ChaseCamera from "./ChaseCamera";
import DescentCamera from "./DescentCamera";
import Nebula from "./Nebula";
import { PlanetSystem } from "./Planet";
import RealSky from "./RealSky";
import Ship from "./Ship";
import Starfield from "./Starfield";
import Sun, { SUN_DIRECTION } from "./Sun";
import WarpStreaks from "./WarpStreaks";
import { SKY_MAP, applySkyEnvironment } from "./realAssets";

type SpaceSceneProps = {
  sim: Simulation;
  active: SectionId | null;
  visited: Set<string>;
  onSelect: (id: SectionId) => void;
  onDock: (id: SectionId) => void;
  onRelease: () => void;
  onTakeover: () => void;
  /** Planet currently being descended onto — camera hands off to the descent. */
  dive?: SectionId | null;
};

/**
 * Image-based lighting from the real Milky Way panorama. Metallic hull panels
 * need something to reflect; without an environment probe every metal surface
 * in the scene collapses into three hard specular dots on black.
 */
function SkyEnvironment() {
  const scene = useThree((state) => state.scene);

  useEffect(() => applySkyEnvironment(scene, SKY_MAP), [scene]);

  return null;
}

/**
 * Keeps the ship lit from the pilot's side, whatever its attitude.
 *
 * A light parented to the hull rotates with it, so half the time the sunlit
 * face points away and the ship collapses into a black silhouette against
 * space — which is exactly when the visitor is least sure it is even there. A
 * directional light uses only `position - target`, so pointing it from the eye
 * at the hull guarantees the hero asset is always readable without touching the
 * global lighting the planets depend on for their terminators.
 */
function ShipFillLight({ sim }: { sim: Simulation }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ camera }) => {
    const l = light.current;
    if (!l) return;
    l.position.copy(camera.position);
    target.position.copy(sim.shipPosition);
    target.updateMatrixWorld();
  });

  return (
    <>
      <primitive object={target} />
      <directionalLight ref={light} target={target} intensity={9} color="#e6efff" />
    </>
  );
}

export default function SpaceScene({
  sim,
  active,
  visited,
  onSelect,
  onDock,
  onRelease,
  onTakeover,
  dive = null,
}: SpaceSceneProps) {
  const sunPosition = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(60), []);
  const sunDirection = useMemo(() => SUN_DIRECTION.toArray(), []);

  // The camera starts already framed on the ship rather than at the origin:
  // the chase rig lerps toward this pose, so an arbitrary start reads as the
  // hull slamming through the lens on first paint.
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [15, 25, -86], fov: 68, near: 0.6, far: 3400 }}
      aria-label="Interactive 3D flight deck — steer the ship, dock with five planets"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      {/* No fog: vacuum does not haze. Distant bodies stay sharp and black. */}
      <color attach="background" args={["#010204"]} />
      <SkyEnvironment />
      <RealSky />
      <ambientLight intensity={0.05} color="#9dbcff" />
      <hemisphereLight args={["#8fb6ff", "#050510", 0.16]} />
      {/* Hard solar key: single source, deep terminator between day and night. */}
      <directionalLight position={sunPosition} intensity={3.6} color="#fff1d8" />
      {/* Cold rim from the opposite side so hulls and limbs separate from black. */}
      <directionalLight position={[-60, 30, -80]} intensity={0.6} color="#4f6cff" />
      <directionalLight position={[40, -20, 60]} intensity={0.22} color="#4f6cff" />

      <Suspense fallback={null}>
        <Nebula sunDirection={sunDirection} />
        <Starfield />
        <Sun />
        <ShipFillLight sim={sim} />
        <PlanetSystem sim={sim} active={active} visited={visited} onSelect={onSelect} />
        <Ship
          sim={sim}
          onDock={onDock}
          onRelease={onRelease}
          onTakeover={onTakeover}
        />
        <WarpStreaks sim={sim} />
        {dive ? <DescentCamera sim={sim} id={dive} /> : <ChaseCamera sim={sim} />}
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
