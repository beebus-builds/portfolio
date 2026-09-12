"use client";

import { Line, Text } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = { discovered: string[]; complete: boolean };
type Signal = { id: string; title: string; color: string; position: [number, number, number]; chapter: string };

const SIGNALS: Signal[] = [
  { id: "portfolio", title: "PORTFOLIO / STORY.EXE", color: "#ffd700", position: [3.4, 1.3, 14], chapter: "projects" },
  { id: "gyan-sathi", title: "GYAN SATHI", color: "#54e6d4", position: [7.1, 1.9, 15.6], chapter: "projects" },
  { id: "pharma-connect", title: "PHARMA CONNECT", color: "#b8ff4d", position: [3.2, 2.9, 17.1], chapter: "projects" },
  { id: "alt-fixes", title: "ALT-FIXES", color: "#22c55e", position: [-7.2, 2.2, 21.2], chapter: "skills" },
  { id: "automated-posts", title: "AUTOMATED POSTS", color: "#22c55e", position: [-3.1, 2.7, 22.9], chapter: "skills" },
  { id: "image-optimization", title: "IMAGE OPTIMIZATION", color: "#ff4af0", position: [-8.1, 1.8, -0.2], chapter: "blog" },
];

const CHAPTERS: Record<string, [number, number, number]> = {
  about: [-5.2, 1.1, -27], education: [5.2, 1.1, -14], blog: [-5.2, 1.1, -1], projects: [5.2, 1.1, 14], skills: [-5.2, 1.1, 22], contact: [5.2, 1.1, 28],
};

function SignalPulse({ position, color, active }: { position: [number, number, number]; color: string; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const wave = (Math.sin(clock.elapsedTime * 4) + 1) / 2;
    ref.current.scale.setScalar(active ? 0.7 + wave * 2.8 : 0.7 + wave * 0.5);
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = active ? 0.08 + (1 - wave) * 0.32 : 0.04 + (1 - wave) * 0.08;
  });
  return <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.9, 0.96, 48]} /><meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} /></mesh>;
}

function CompletionWave({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current || !active) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = t * 0.12;
    group.current.position.y = Math.sin(t * 0.7) * 0.12;
  });
  if (!active) return null;
  return <group ref={group} position={[0, 0.2, 14]}>
    {[3, 7, 12, 18, 26].map((radius, i) => <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.025 + i * 0.008, 8, 128]} /><meshBasicMaterial color={i % 2 ? "#54e6d4" : "#b8ff4d"} transparent opacity={0.38 - i * 0.06} depthWrite={false} toneMapped={false} /></mesh>)}
    <pointLight position={[0, 5, 0]} color="#b8ff4d" intensity={18} distance={34} />
    <pointLight position={[0, 3, 14]} color="#54e6d4" intensity={10} distance={20} />
    <Text position={[0, 5.8, 0]} fontSize={0.24} color="#b8ff4d" anchorX="center" letterSpacing={0.18}>WORLD STATE / AWAKENED</Text>
  </group>;
}

export default function WorldMemoryReactor({ discovered, complete }: Props) {
  const [selected, setSelected] = useState<Signal | null>(null);
  const [pulseKey, setPulseKey] = useState(0);
  const [lastChapter, setLastChapter] = useState<string | null>(null);
  const selectedUntil = useRef(0);

  useEffect(() => {
    const onArtifact = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      const signal = SIGNALS.find((item) => item.id === id);
      if (!signal) return;
      setSelected(signal);
      setPulseKey((value) => value + 1);
      selectedUntil.current = performance.now() + 5000;
    };
    window.addEventListener("bibash:artifact-selected", onArtifact);
    return () => window.removeEventListener("bibash:artifact-selected", onArtifact);
  }, []);

  useEffect(() => {
    const latest = discovered[discovered.length - 1];
    if (latest && latest !== lastChapter) {
      setLastChapter(latest);
      setPulseKey((value) => value + 1);
    }
  }, [discovered, lastChapter]);

  const selectedChapter = selected ? CHAPTERS[selected.chapter] : null;
  const signalActive = selected !== null && performance.now() < selectedUntil.current;

  return <group key={pulseKey}>
    {SIGNALS.filter((signal) => discovered.includes(signal.chapter)).map((signal) => {
      const chapter = CHAPTERS[signal.chapter];
      const active = signalActive && selected?.id === signal.id;
      return <group key={signal.id}>
        <SignalPulse position={signal.position} color={signal.color} active={active} />
        <Line points={[signal.position, chapter]} color={signal.color} transparent opacity={active ? 0.9 : 0.1} lineWidth={active ? 2 : 0.4} />
        {active && <><mesh position={signal.position}><sphereGeometry args={[0.18, 16, 16]} /><meshBasicMaterial color={signal.color} toneMapped={false} /></mesh><Text position={[signal.position[0], signal.position[1] + 0.7, signal.position[2]]} fontSize={0.13} color={signal.color} anchorX="center" letterSpacing={0.08}>{signal.title}</Text></>}
      </group>;
    })}
    {selectedChapter && signalActive && <pointLight position={selectedChapter} color={selected?.color} intensity={8} distance={12} />}
    <CompletionWave active={complete} />
  </group>;
}
