"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import type { VehicleState } from "./Vehicle";
import ChaseCamera from "./ChaseCamera";
import Landmark, { type LandmarkData } from "./Landmark";
import { useDriveInput } from "@/hooks/useDriveInput";
import TouchControls from "./TouchControls";
import WorldHUD from "./WorldHUD";
import StoryTraveler from "./StoryTraveler";
import StoryEnvironment from "./StoryEnvironment";

const LANDMARKS: LandmarkData[] = [
  { id: "about", label: "THE PERSON", sub: "the person behind the work", href: "/about", color: "#6d5bff", shape: "icosahedron", position: [-5.2, 0, -27] },
  { id: "education", label: "THE QUESTIONS", sub: "where curiosity became a foundation", href: "/education", color: "#54e6d4", shape: "octahedron", position: [5.2, 0, -14] },
  { id: "blog", label: "THE FAILURE", sub: "notes from things that did not work", href: "/blog", color: "#ff4af0", shape: "dodecahedron", position: [-5.2, 0, -1] },
  { id: "projects", label: "THE BUILDING", sub: "things made along the way", href: "/projects", color: "#ffd700", shape: "torusKnot", position: [5.2, 0, 14] },
  { id: "skills", label: "THE TOOLKIT", sub: "tools collected through the journey", href: "/skills", color: "#22c55e", shape: "icosahedron", position: [-5.2, 0, 22] },
  { id: "contact", label: "THE UNKNOWN", sub: "the next chapter starts here", href: "/contact", color: "#ff6b35", shape: "box", position: [5.2, 0, 28] },
];

export default function PortfolioWorld() {
  const router = useRouter();
  const traveler = useRef<VehicleState>({ position: new THREE.Vector3(0, 0, 30), heading: Math.PI, speed: 0 });
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
    if (near) { nearbyRef.current = data; setNearby(data); }
    else if (nearbyRef.current?.id === id) { nearbyRef.current = null; setNearby(null); }
  }, []);

  return (
    <div className="world-stage">
      <Canvas shadows camera={{ fov: 55, position: [0, 5.5, 9] }} dpr={[1, 1.75]}>
        <color attach="background" args={["#030308"]} />
        <fog attach="fog" args={["#030308", 13, 58]} />
        <ambientLight intensity={0.18} />
        <directionalLight position={[-8, 16, 8]} intensity={0.65} castShadow />
        <pointLight position={[0, 4, -27]} color="#6d5bff" intensity={10} distance={14} />
        <pointLight position={[0, 4, -1]} color="#ff4af0" intensity={8} distance={13} />
        <pointLight position={[0, 4, 14]} color="#ffd700" intensity={9} distance={15} />
        <pointLight position={[0, 4, 28]} color="#ff6b35" intensity={10} distance={14} />
        <Stars radius={90} depth={55} count={2400} factor={2.6} fade speed={0.28} />
        <Suspense fallback={null}>
          <StoryEnvironment />
          <StoryTraveler input={input} state={traveler} />
          {LANDMARKS.map((landmark) => (
            <Landmark key={landmark.id} data={landmark} vehicleState={traveler} onProximity={handleProximity} />
          ))}
        </Suspense>
        <ChaseCamera target={traveler} />
      </Canvas>
      <WorldHUD nearby={nearby} onEnter={enter} />
      <TouchControls input={input} onEnter={enter} />
    </div>
  );
}
