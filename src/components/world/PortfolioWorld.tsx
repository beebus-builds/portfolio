"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars, Grid } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import Vehicle, { type VehicleState } from "./Vehicle";
import ChaseCamera from "./ChaseCamera";
import Landmark, { type LandmarkData } from "./Landmark";
import { useDriveInput } from "@/hooks/useDriveInput";
import TouchControls from "./TouchControls";
import WorldHUD from "./WorldHUD";

const LANDMARK_DEFS: { id: string; label: string; sub: string; href: string; color: string; shape: LandmarkData["shape"] }[] = [
  { id: "about", label: "ABOUT", sub: "who i am", href: "/about", color: "#6d5bff", shape: "icosahedron" },
  { id: "projects", label: "PROJECTS", sub: "selected work", href: "/projects", color: "#ffd700", shape: "torusKnot" },
  { id: "skills", label: "SKILLS", sub: "the toolkit", href: "/skills", color: "#54e6d4", shape: "octahedron" },
  { id: "blog", label: "NOTES", sub: "writing", href: "/blog", color: "#ff4af0", shape: "dodecahedron" },
  { id: "education", label: "EDUCATION", sub: "the foundations", href: "/education", color: "#22c55e", shape: "icosahedron" },
  { id: "contact", label: "CONTACT", sub: "say hello", href: "/contact", color: "#ff6b35", shape: "box" },
];

const RADIUS = 20;
const LANDMARKS: LandmarkData[] = LANDMARK_DEFS.map((d, i) => {
  const angle = (i / LANDMARK_DEFS.length) * Math.PI * 2 - Math.PI / 2;
  return { ...d, position: [Math.cos(angle) * RADIUS, 0, Math.sin(angle) * RADIUS] as [number, number, number] };
});

export default function PortfolioWorld() {
  const router = useRouter();
  const vehicleState = useRef<VehicleState>({ position: new THREE.Vector3(0, 0, 8), heading: Math.PI, speed: 0 });
  const [nearby, setNearby] = useState<LandmarkData | null>(null);
  const nearbyRef = useRef<LandmarkData | null>(null);
  const enteringRef = useRef(false);

  const enter = useCallback(() => {
    if (nearbyRef.current && !enteringRef.current) {
      enteringRef.current = true;
      router.push(nearbyRef.current.href);
    }
  }, [router]);

  const input = useDriveInput(enter);

  const handleProximity = useCallback((id: string, near: boolean, data: LandmarkData) => {
    if (near) {
      nearbyRef.current = data;
      setNearby(data);
    } else if (nearbyRef.current?.id === id) {
      nearbyRef.current = null;
      setNearby(null);
    }
  }, []);

  return (
    <div className="world-stage">
      <Canvas shadows camera={{ fov: 55, position: [0, 5.5, 9] }} dpr={[1, 1.75]}>
        <color attach="background" args={["#05040a"]} />
        <fog attach="fog" args={["#05040a", 20, 55]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[12, 18, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <Stars radius={80} depth={40} count={2600} factor={3} fade speed={0.6} />
        <Grid cellColor="#1b1c2b" sectionColor="#3a2f6b" fadeDistance={48} fadeStrength={2} infiniteGrid position={[0, 0.01, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[42, 64]} />
          <meshStandardMaterial color="#07060d" roughness={1} />
        </mesh>
        <Suspense fallback={null}>
          <Vehicle input={input} state={vehicleState} />
          {LANDMARKS.map((l) => (
            <Landmark key={l.id} data={l} vehicleState={vehicleState} onProximity={handleProximity} />
          ))}
        </Suspense>
        <ChaseCamera target={vehicleState} />
      </Canvas>
      <WorldHUD nearby={nearby} onEnter={enter} />
      <TouchControls input={input} onEnter={enter} />
    </div>
  );
}
