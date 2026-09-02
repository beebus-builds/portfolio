"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Grid, Float, Html } from "@react-three/drei";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import Vehicle, { type VehicleState } from "./Vehicle";
import ChaseCamera from "./ChaseCamera";
import Landmark, { type LandmarkData } from "./Landmark";
import { useDriveInput } from "@/hooks/useDriveInput";
import TouchControls from "./TouchControls";
import WorldHUD from "./WorldHUD";
import StoryTraveler from "./StoryTraveler";

const LANDMARK_DEFS: { id: string; label: string; sub: string; href: string; color: string; shape: LandmarkData["shape"] }[] = [
  { id: "about", label: "ABOUT", sub: "the person behind the work", href: "/about", color: "#6d5bff", shape: "icosahedron" },
  { id: "projects", label: "PROJECTS", sub: "things built along the way", href: "/projects", color: "#ffd700", shape: "torusKnot" },
  { id: "skills", label: "SKILLS", sub: "tools collected on the journey", href: "/skills", color: "#54e6d4", shape: "octahedron" },
  { id: "blog", label: "NOTES", sub: "thoughts from the road", href: "/blog", color: "#ff4af0", shape: "dodecahedron" },
  { id: "education", label: "EDUCATION", sub: "where the foundations began", href: "/education", color: "#22c55e", shape: "icosahedron" },
  { id: "contact", label: "CONTACT", sub: "the next chapter starts here", href: "/contact", color: "#ff6b35", shape: "box" },
];

const LANDMARKS: LandmarkData[] = [
  { ...LANDMARK_DEFS[0], position: [-7, 0, -21] },
  { ...LANDMARK_DEFS[1], position: [7, 0, -12] },
  { ...LANDMARK_DEFS[2], position: [-7, 0, -3] },
  { ...LANDMARK_DEFS[3], position: [7, 0, 6] },
  { ...LANDMARK_DEFS[4], position: [-7, 0, 15] },
  { ...LANDMARK_DEFS[5], position: [7, 0, 25] },
];

function StoryWorld() {
  const t = useRef(0);
  const particles = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    t.current += delta;
    if (particles.current) {
      particles.current.rotation.y += delta * 0.012;
      particles.current.rotation.z = Math.sin(t.current * 0.12) * 0.02;
    }
  });

  const dust = new Float32Array(420 * 3);
  for (let i = 0; i < 420; i++) {
    dust[i * 3] = ((i * 37) % 160) - 80;
    dust[i * 3 + 1] = ((i * 17) % 28) - 2;
    dust[i * 3 + 2] = ((i * 61) % 100) - 50;
  }

  return (
    <>
      <Stars radius={100} depth={60} count={3000} factor={3} fade speed={0.35} />
      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.055} color="#8f82ff" transparent opacity={0.38} depthWrite={false} />
      </points>
      <Grid cellColor="#171829" sectionColor="#45377b" fadeDistance={70} fadeStrength={1.8} infiniteGrid position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 72]} />
        <meshStandardMaterial color="#06060b" roughness={1} />
      </mesh>
      <mesh position={[0, 0.03, -16]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 58]} />
        <meshBasicMaterial color="#6d5bff" transparent opacity={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 12, 0, 0]}>
          {[...Array(9)].map((_, i) => (
            <Float key={i} speed={0.8 + i * 0.08} floatIntensity={0.25}>
              <mesh position={[0, 1.4 + (i % 3) * 1.5, -30 + i * 7]}>
                <boxGeometry args={[0.22, 2 + (i % 3), 0.22]} />
                <meshStandardMaterial color="#17142b" emissive="#352a73" emissiveIntensity={0.8} />
              </mesh>
            </Float>
          ))}
        </group>
      ))}
      <Html position={[0, 4.8, -29]} center distanceFactor={9}>
        <div className="world-story-title">CHAPTER 01<br /><span>THE BEGINNING</span></div>
      </Html>
      <Html position={[0, 4.8, 2]} center distanceFactor={9}>
        <div className="world-story-title">CHAPTER 02<br /><span>THE BUILDING</span></div>
      </Html>
      <Html position={[0, 4.8, 31]} center distanceFactor={9}>
        <div className="world-story-title">CHAPTER 03<br /><span>WHAT'S NEXT</span></div>
      </Html>
    </>
  );
}

export default function PortfolioWorld() {
  const router = useRouter();
  const vehicleState = useRef<VehicleState>({ position: new THREE.Vector3(0, 0, 26), heading: Math.PI, speed: 0 });
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
        <color attach="background" args={["#05040a"]} />
        <fog attach="fog" args={["#05040a", 16, 62]} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[-8, 16, 8]} intensity={0.75} castShadow />
        <pointLight position={[0, 5, -24]} color="#6d5bff" intensity={10} distance={18} />
        <pointLight position={[0, 5, 2]} color="#54e6d4" intensity={7} distance={16} />
        <pointLight position={[0, 5, 28]} color="#ff6b35" intensity={9} distance={18} />
        <StoryWorld />
        <Suspense fallback={null}>
          <StoryTraveler input={input} state={vehicleState} />
          {LANDMARKS.map((l) => <Landmark key={l.id} data={l} vehicleState={vehicleState} onProximity={handleProximity} />)}
        </Suspense>
        <ChaseCamera target={vehicleState} />
      </Canvas>
      <WorldHUD nearby={nearby} onEnter={enter} />
      <TouchControls input={input} onEnter={enter} />
    </div>
  );
}
