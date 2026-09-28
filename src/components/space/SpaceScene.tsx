"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Suspense, useMemo } from "react";
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
};

export default function SpaceScene({ sim, active, visited, onSelect, onDock, onRelease }: SpaceSceneProps) {
  const sunPosition = useMemo(() => SUN_DIRECTION.clone().multiplyScalar(60), []);
  const sunDirection = useMemo(() => SUN_DIRECTION.toArray(), []);

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 8, 48], fov: 68, near: 0.6, far: 3400 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <color attach="background" args={["#04050c"]} />
      <ambientLight intensity={0.16} color="#9dbcff" />
      <hemisphereLight args={["#8fb6ff", "#0a0a16", 0.35]} />
      <directionalLight position={sunPosition} intensity={3.1} color="#fff1d8" />
      <directionalLight position={[40, -20, 60]} intensity={0.35} color="#4f6cff" />

      <Suspense fallback={null}>
        <Nebula sunDirection={sunDirection} />
        <Starfield />
        <Sun />
        <PlanetSystem sim={sim} active={active} visited={visited} onSelect={onSelect} />
        <WarpStreaks sim={sim} />
        <Ship sim={sim} onDock={onDock} onRelease={onRelease} />
        <ChaseCamera sim={sim} />
        <AdaptiveDpr pixelated={false} />
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
