"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import StoryOverlay from "./StoryOverlay";

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
  const [discovered, setDiscovered] = useState<string[]>([]);
  const nearbyRef = useRef<LandmarkData | null>(null);
  const enteringRef = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("bibash-story-discoveries");
      if (saved) setDiscovered(JSON.parse(saved));
    } catch { /* start fresh if storage is unavailable */ }
  }, []);

  const discover = useCallback((id: string) => {
    setDiscovered((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try { window.localStorage.setItem("bibash-story-discoveries", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const enter = useCallback(() => {
    const target = nearbyRef.current;
    if (target && !enteringRef.current) {
      discover(target.id);
      enteringRef.current = true;
      window.setTimeout(() => router.push(target.href), 260);
    }
  }, [discover, router]);

  const input = useDriveInput(enter);
  const handleProximity = useCallback((id: string, near: boolean, data: LandmarkData) => {
    if (near) {
      nearbyRef.current = data;
      setNearby(data);
      discover(id);
    } else if (nearbyRef.current?.id === id) {
      nearbyRef.current = null;
      setNearby(null);
    }
  }, [discover]);

  const storyProgress = Math.min(4, Math.floor(discovered.length / 1.5));
  const complete = discovered.length >= LANDMARKS.length;

  return (
    <div className="world-stage">
      <Canvas shadows camera={{ fov: 55, position: [0, 5.5, 9] }} dpr={[1, 1.75]}>
        <color attach="background" args={[complete ? "#020604" : "#030308"]} />
        <fog attach="fog" args={[complete ? "#020604" : "#030308", 13, 58]} />
        <ambientLight intensity={complete ? 0.28 : 0.18} />
        <directionalLight position={[-8, 16, 8]} intensity={0.65} castShadow />
        <pointLight position={[0, 4, -27]} color="#6d5bff" intensity={10} distance={14} />
        <pointLight position={[0, 4, -1]} color="#ff4af0" intensity={8} distance={13} />
        <pointLight position={[0, 4, 14]} color="#ffd700" intensity={9} distance={15} />
        <pointLight position={[0, 4, 28]} color="#ff6b35" intensity={complete ? 18 : 10} distance={18} />
        <Stars radius={90} depth={55} count={complete ? 4200 : 2400} factor={2.6} fade speed={complete ? 0.65 : 0.28} />
        <Suspense fallback={null}>
          <StoryEnvironment progress={storyProgress} discovered={discovered} />
          <StoryTraveler input={input} state={traveler} />
          {LANDMARKS.map((landmark) => (
            <Landmark key={landmark.id} data={landmark} vehicleState={traveler} onProximity={handleProximity} />
          ))}
        </Suspense>
        <ChaseCamera target={traveler} />
      </Canvas>
      <WorldHUD nearby={nearby} onEnter={enter} discovered={discovered} />
      <StoryOverlay nearby={nearby} discovered={discovered} onEnter={enter} />
      <div className="story-progress" aria-label={`Story progress ${discovered.length} of ${LANDMARKS.length}`} style={{ position: "absolute", left: 24, right: 24, bottom: 22, display: "flex", alignItems: "center", gap: 14, pointerEvents: "none", zIndex: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 9, letterSpacing: ".12em", color: "rgba(255,255,255,.48)" }}>
        <span>{String(discovered.length).padStart(2, "0")} / 06</span>
        <div style={{ display: "flex", gap: 5, flex: 1, maxWidth: 280 }}>
          {LANDMARKS.map((landmark) => <i key={landmark.id} style={{ display: "block", height: 2, flex: 1, background: discovered.includes(landmark.id) ? landmark.color : "rgba(255,255,255,.14)", boxShadow: discovered.includes(landmark.id) ? `0 0 10px ${landmark.color}` : "none", transition: "all .5s ease" }} />)}
        </div>
        <b style={{ color: complete ? "#b8ff4d" : "rgba(255,255,255,.34)", fontWeight: 500 }}>{complete ? "THE UNKNOWN IS OPEN" : "DISCOVER THE STORY"}</b>
      </div>
      <TouchControls input={input} onEnter={enter} />
    </div>
  );
}
