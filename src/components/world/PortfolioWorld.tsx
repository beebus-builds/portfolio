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
import BibashBot from "./BibashBot";
import WorldBibashBot from "./WorldBibashBot";
import SecretConsole from "./SecretConsole";
import SecretMemory, { SECRET_MEMORIES } from "./SecretMemory";
import FinalPortal from "./FinalPortal";
import { SkyDome, GroundGrid, Fireflies, PineGrove, Rocks, GrassTufts } from "./Scenery";

const LANDMARKS: LandmarkData[] = [
  { id: "about", label: "THE PERSON", sub: "the person behind the work", href: "/about", color: "#6d5bff", shape: "icosahedron", position: [-5.2, 0, -27] },
  { id: "education", label: "THE QUESTIONS", sub: "where curiosity became a foundation", href: "/education", color: "#54e6d4", shape: "octahedron", position: [5.2, 0, -14] },
  { id: "blog", label: "THE FAILURE", sub: "notes from things that did not work", href: "/blog", color: "#ff4af0", shape: "dodecahedron", position: [-5.2, 0, -1] },
  { id: "projects", label: "THE BUILDING", sub: "things made along the way", href: "/projects", color: "#ffd700", shape: "torusKnot", position: [5.2, 0, 14] },
  { id: "skills", label: "THE TOOLKIT", sub: "tools collected through the journey", href: "/skills", color: "#22c55e", shape: "icosahedron", position: [-5.2, 0, 22] },
  { id: "contact", label: "THE UNKNOWN", sub: "the next chapter starts here", href: "/contact", color: "#ff6b35", shape: "box", position: [5.2, 0, 28] },
];

const SECRET_KEY = "bibash-secret-memories";

export default function PortfolioWorld() {
  const router = useRouter();
  const traveler = useRef<VehicleState>({ position: new THREE.Vector3(0, 0, 30), heading: Math.PI, speed: 0 });
  const [nearby, setNearby] = useState<LandmarkData | null>(null);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [secrets, setSecrets] = useState<string[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const nearbyRef = useRef<LandmarkData | null>(null);
  const enteringRef = useRef(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("bibash-story-discoveries");
      if (saved) setDiscovered(JSON.parse(saved));
      const savedSecrets = window.localStorage.getItem(SECRET_KEY);
      if (savedSecrets) setSecrets(JSON.parse(savedSecrets));
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

  const collectSecret = useCallback((id: string) => {
    setSecrets((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try { window.localStorage.setItem(SECRET_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const enter = useCallback(() => {
    const target = nearbyRef.current;
    if (target && !enteringRef.current) {
      discover(target.id);
      enteringRef.current = true;
      setTransitioning(true);
      window.setTimeout(() => router.push(target.href), 760);
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

  const storyProgress = Math.min(LANDMARKS.length, discovered.length);
  const complete = discovered.length >= LANDMARKS.length;
  const secretProgress = `${secrets.length}/${SECRET_MEMORIES.length} SHARDS`;

  return (
    <div className="world-stage">
      <Canvas shadows camera={{ fov: 55, position: [0, 5.5, 9] }} dpr={[1, 1.75]}>
        <color attach="background" args={["#050512"]} />
        <fog attach="fog" args={["#070716", 14, 62]} />
        <hemisphereLight args={["#5a6cff", "#0b0b14", 0.55]} />
        <ambientLight intensity={0.22} />
        <directionalLight position={[9, 17, 7]} intensity={1.15} color="#cfe4ff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-22} shadow-camera-right={22} shadow-camera-top={24} shadow-camera-bottom={-44} shadow-camera-far={70} shadow-bias={-0.0004} />
        <directionalLight position={[-7, 9, -30]} intensity={0.8} color="#6d5bff" />
        <directionalLight position={[0, 6, 34]} intensity={0.35} color="#ff6b35" />
        <pointLight position={[0, 4, -27]} color="#6d5bff" intensity={10} distance={14} />
        <pointLight position={[0, 4, -1]} color="#ff4af0" intensity={8} distance={13} />
        <pointLight position={[0, 4, 14]} color="#ffd700" intensity={9} distance={15} />
        <pointLight position={[0, 4, 28]} color="#ff6b35" intensity={complete ? 18 : 10} distance={18} />
        <Stars radius={90} depth={55} count={complete ? 4200 : 2400} factor={2.6} fade speed={complete ? 0.65 : 0.28} />
        <Suspense fallback={null}>
          <SkyDome />
          <GroundGrid />
          <PineGrove />
          <Rocks />
          <GrassTufts />
          <Fireflies />
          <StoryEnvironment progress={storyProgress} discovered={discovered} />
          <StoryTraveler input={input} state={traveler} />
          <WorldBibashBot state={traveler} discovered={discovered} complete={complete} />
          {LANDMARKS.map((landmark) => <Landmark key={landmark.id} data={landmark} vehicleState={traveler} onProximity={handleProximity} />)}
          {SECRET_MEMORIES.map((memory) => <SecretMemory key={memory.id} memory={memory} collected={secrets.includes(memory.id)} onCollect={collectSecret} />)}
          <FinalPortal unlocked={complete} />
        </Suspense>
        <ChaseCamera target={traveler} />
      </Canvas>
      <WorldHUD nearby={nearby} onEnter={enter} discovered={discovered} />
      <StoryOverlay nearby={nearby} discovered={discovered} onEnter={enter} />
      <BibashBot discovered={discovered} complete={complete} />
      <SecretConsole discovered={discovered} />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 40, pointerEvents: transitioning ? "auto" : "none", background: "#050512", opacity: transitioning ? 1 : 0, transition: "opacity .7s cubic-bezier(.2,.75,.2,1)" }} />
      {transitioning && <div aria-live="polite" style={{ position: "absolute", inset: 0, zIndex: 41, display: "grid", placeItems: "center", pointerEvents: "none", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: nearby?.color ?? "#b8ff4d", textAlign: "center" }}><div><div style={{ fontSize: 9, letterSpacing: ".28em", opacity: .7 }}>ENTERING CHAPTER</div><div style={{ marginTop: 12, fontSize: "clamp(28px,6vw,64px)", fontWeight: 700, letterSpacing: "-.06em" }}>{nearby?.label}</div><div style={{ marginTop: 10, fontSize: 10, letterSpacing: ".12em", color: "rgba(255,255,255,.55)" }}>STORY.EXE / TRANSITION</div></div></div>}
      <div aria-hidden="true" style={{ position: "absolute", right: 24, bottom: 48, zIndex: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 8, letterSpacing: ".14em", color: secrets.length ? "#b8ff4d" : "rgba(255,255,255,.2)" }}>{secretProgress}</div>
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
