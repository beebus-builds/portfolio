"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SectionId } from "@/lib/profile";
import type { Simulation } from "@/lib/simulation";import ChaseCamera from "./ChaseCamera";
import Nebula from "./Nebula";
import { PlanetSystem } from "./Planet";
import Ship from "./Ship";
import Starfield from "./Starfield";
import Sun, { SUN_DIRECTION } from "./Sun";
import WarpStreaks from "./WarpStreaks";

type SpaceSceneProps = {
  sim: Simulation;
  active: SectionId | null;
  visited: Set<string>;
  onSelect: (id: SectionId) => void;
  onDock: (id: SectionId) => void;
  onRelease: () => void;
  onTakeover: () => void;
  /** Homepage mode: slow orbital establishing shot, no ship or chase cam. */
  cinematic?: boolean;
};

/** Slow orbital establishing shot for the homepage: circles the system. */
function CinematicCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.03;
    const radius = 330;
    camera.position.set(Math.cos(t) * radius, 72 + Math.sin(t * 0.6) * 26, Math.sin(t) * radius);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SpaceScene({
  sim,
  active,
  visited,
  onSelect,
  onDock,
  onRelease,
  cinematic = false,
  onTakeover,
}: SpaceSceneProps) {
  const sunPosition = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(60), []);
  const sunDirection = useMemo(() => SUN_DIRECTION.toArray(), []);

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 8, 48], fov: 68, near: 0.6, far: 3400 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      {/* No fog: vacuum does not haze. Distant bodies stay sharp and black. */}
      <color attach="background" args={["#010204"]} />
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
        <PlanetSystem sim={sim} active={active} visited={visited} onSelect={onSelect} />
        {!cinematic && (
          <>
            <WarpStreaks sim={sim} />
            <Ship sim={sim} onDock={onDock} onRelease={onRelease} onTakeover={onTakeover} />
            <ChaseCamera sim={sim} />
          </>
        )}
        {cinematic && <CinematicCamera />}
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
