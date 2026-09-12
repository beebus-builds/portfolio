"use client";

import { Text, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { VehicleState } from "./Vehicle";

type Props = { state: { current: VehicleState }; discovered: string[]; complete: boolean };
type Chapter = { id: string; label: string; color: string; position: [number, number, number]; approach: string; found: string; guide: string };
type Artifact = { id: string; title: string; color: string; position: [number, number, number] };

const CHAPTERS: Chapter[] = [
  { id: "about", label: "THE PERSON", color: "#6d5bff", position: [-5.2, 0, -27], approach: "THERE'S SOMETHING HERE ABOUT THE PERSON BEHIND THE CODE.", found: "YOU FOUND THE BEGINNING. NOW KEEP MOVING.", guide: "HEAD TOWARD THE QUESTIONS." },
  { id: "education", label: "THE QUESTIONS", color: "#54e6d4", position: [5.2, 0, -14], approach: "QUESTIONS ARE SHOWING UP. THAT'S USUALLY A GOOD SIGN.", found: "CURIOSITY BECAME A FOUNDATION HERE.", guide: "THE FAILURE CHAPTER IS AHEAD." },
  { id: "blog", label: "THE FAILURE", color: "#ff4af0", position: [-5.2, 0, -1], approach: "DON'T TURN AROUND. THIS PART IS SUPPOSED TO BE BROKEN.", found: "YOU FOUND THE FAILURES. THEY TAUGHT MORE THAN THE WINS.", guide: "KEEP GOING. BUILDING IS NEXT." },
  { id: "projects", label: "THE BUILDING", color: "#ffd700", position: [5.2, 0, 14], approach: "THE BUILDINGS AHEAD AREN'T JUST DECORATION.", found: "THIS IS WHERE IDEAS BECAME SYSTEMS.", guide: "THE TOOLKIT IS THE NEXT MEMORY." },
  { id: "skills", label: "THE TOOLKIT", color: "#22c55e", position: [-5.2, 0, 22], approach: "TOOLS COLLECTED. NOW SEE WHAT THEY CAN DO TOGETHER.", found: "A TOOLKIT IS ONLY AS GOOD AS THE PROBLEM IT SOLVES.", guide: "ONE LAST CHAPTER. THE UNKNOWN." },
  { id: "contact", label: "THE UNKNOWN", color: "#ff6b35", position: [5.2, 0, 28], approach: "THE SIGNAL IS GETTING STRONGER.", found: "YOU MADE IT TO THE UNKNOWN.", guide: "THERE'S NOTHING LEFT TO UNLOCK. BUILD SOMETHING." },
];

const ARTIFACTS: Artifact[] = [
  { id: "portfolio", title: "PORTFOLIO / STORY.EXE", color: "#ffd700", position: [3.4, 1.3, 14] },
  { id: "gyan-sathi", title: "GYAN SATHI", color: "#54e6d4", position: [7.1, 1.9, 15.6] },
  { id: "pharma-connect", title: "PHARMA CONNECT", color: "#b8ff4d", position: [3.2, 2.9, 17.1] },
  { id: "alt-fixes", title: "ALT-FIXES", color: "#22c55e", position: [-7.2, 2.2, 21.2] },
  { id: "automated-posts", title: "AUTOMATED POSTS", color: "#22c55e", position: [-3.1, 2.7, 22.9] },
  { id: "image-optimization", title: "IMAGE OPTIMIZATION", color: "#ff4af0", position: [-8.1, 1.8, -0.2] },
];

const FALLBACK = { label: "THE JOURNEY", color: "#b8ff4d", approach: "KEEP EXPLORING.", found: "MEMORY RECORDED.", guide: "FOLLOW THE LIGHT." };

export default function WorldBibashBot({ state, discovered, complete }: Props) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const texture = useTexture("/Bibash%20Bot.png");
  const message = useRef(FALLBACK.approach);
  const mode = useRef<"follow" | "orbit" | "guide" | "signal">("follow");
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const signalUntil = useRef(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onArtifact = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      const artifact = ARTIFACTS.find((item) => item.id === detail?.id);
      if (!artifact) return;
      setSelectedArtifact(artifact);
      signalUntil.current = performance.now() + 4200;
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setSelectedArtifact(null), 4200);
    };
    window.addEventListener("bibash:artifact-selected", onArtifact);
    return () => {
      window.removeEventListener("bibash:artifact-selected", onArtifact);
      if (clearTimer.current) clearTimeout(clearTimer.current);
    };
  }, []);

  const nearest = useMemo(() => {
    const position = state.current.position;
    let best: Chapter | null = null;
    let distance = Infinity;
    for (const chapter of CHAPTERS) {
      const nextDistance = Math.hypot(position.x - chapter.position[0], position.z - chapter.position[2]);
      if (nextDistance < distance) { best = chapter; distance = nextDistance; }
    }
    return { chapter: best, distance };
  }, [state.current.position.x, state.current.position.z]);
  const nextChapter = useMemo(() => CHAPTERS.find((chapter) => !discovered.includes(chapter.id)) ?? CHAPTERS[CHAPTERS.length - 1], [discovered]);
  const activeChapter = nearest.chapter ?? nextChapter;

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const player = state.current.position;
    const heading = state.current.heading;
    const signalActive = selectedArtifact !== null && performance.now() < signalUntil.current;
    const nearChapter = nearest.chapter && nearest.distance < 6.5;
    const chapterFound = nearest.chapter ? discovered.includes(nearest.chapter.id) : false;

    if (signalActive && selectedArtifact) {
      mode.current = "signal";
      message.current = `SIGNAL LOCKED: ${selectedArtifact.title}`;
    } else if (complete) {
      mode.current = "guide";
      message.current = FALLBACK.found;
    } else if (nearChapter) {
      mode.current = "orbit";
      message.current = chapterFound ? nearest.chapter!.found : nearest.chapter!.approach;
    } else {
      mode.current = "follow";
      message.current = nextChapter.guide;
    }

    let target: THREE.Vector3;
    if (mode.current === "signal" && selectedArtifact) {
      const [x, y, z] = selectedArtifact.position;
      const a = t * 1.5;
      target = new THREE.Vector3(x + Math.cos(a) * 1.7, y + 0.9 + Math.sin(t * 4) * 0.22, z + Math.sin(a) * 1.7);
    } else if (mode.current === "orbit" && nearest.chapter) {
      const a = t * 0.65;
      target = new THREE.Vector3(nearest.chapter.position[0] + Math.cos(a) * 2.8, 1.7 + Math.sin(t * 2.1) * 0.16, nearest.chapter.position[2] + Math.sin(a) * 2.8);
    } else if (mode.current === "guide" && !complete) {
      const dx = nextChapter.position[0] - player.x;
      const dz = nextChapter.position[2] - player.z;
      const length = Math.max(1, Math.hypot(dx, dz));
      target = new THREE.Vector3(player.x + (dx / length) * 2.4, 1.75 + Math.sin(t * 2.1) * 0.15, player.z + (dz / length) * 2.4);
    } else {
      target = new THREE.Vector3(player.x - Math.sin(heading) * 1.7 + Math.sin(t * 0.8) * 0.18, 1.65 + Math.sin(t * 2.1) * 0.12, player.z - Math.cos(heading) * 1.7 + Math.cos(t * 1.1) * 0.16);
    }

    group.current.position.lerp(target, 1 - Math.exp(-(mode.current === "signal" ? 8 : 5) * delta));
    group.current.lookAt(player.x, group.current.position.y, player.z);
    group.current.rotation.z = Math.sin(t * (mode.current === "signal" ? 4 : 1.4)) * (mode.current === "signal" ? 0.09 : 0.035);
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(t * (mode.current === "signal" ? 7 : 2.4)) * (mode.current === "signal" ? 0.18 : 0.07));
  });

  const botColor = selectedArtifact?.color ?? activeChapter.color;
  return (
    <group ref={group}>
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
        <ringGeometry args={[0.55, 0.59, 32]} />
        <meshBasicMaterial color={botColor} transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial map={texture} transparent opacity={0.96} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 0.62, 0]} fontSize={0.085} color={botColor} anchorX="center" anchorY="middle" letterSpacing={0.08} outlineWidth={0.008} outlineColor="#050512">BIBASH // BOT</Text>
      <Text position={[0, 0.45, 0]} fontSize={0.065} color="#e9f2e4" anchorX="center" anchorY="middle" maxWidth={2.8} fillOpacity={0.72}>{message.current}</Text>
      <pointLight position={[0, 0, 0]} color={botColor} intensity={mode.current === "signal" ? 5.5 : complete ? 3.5 : mode.current === "orbit" ? 2.8 : 1.8} distance={mode.current === "signal" ? 5 : 3.5} />
    </group>
  );
}
