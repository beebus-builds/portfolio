"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Props = { discovered: string[]; complete: boolean };

type ArtifactSignal = { id: string; position: [number, number, number]; color: string; chapter: string };

const SIGNALS: ArtifactSignal[] = [
  { id: "portfolio", position: [3.4, 1.3, 14], color: "#ffd700", chapter: "projects" },
  { id: "gyan-sathi", position: [7.1, 1.9, 15.6], color: "#54e6d4", chapter: "projects" },
  { id: "pharma-connect", position: [3.2, 2.9, 17.1], color: "#b8ff4d", chapter: "projects" },
  { id: "alt-fixes", position: [-7.2, 2.2, 21.2], color: "#22c55e", chapter: "skills" },
  { id: "automated-posts", position: [-3.1, 2.7, 22.9], color: "#22c55e", chapter: "skills" },
  { id: "image-optimization", position: [-8.1, 1.8, -0.2], color: "#ff4af0", chapter: "blog" },
];

const CHAPTERS: Record<string, [number, number, number]> = {
  about: [-5.2, 1.1, -27],
  education: [5.2, 1.1, -14],
  blog: [-5.2, 1.1, -1],
  projects: [5.2, 1.1, 14],
  skills: [-5.2, 1.1, 22],
  contact: [5.2, 1.1, 28],
};

function Pulse({ position, color, strength = 1 }: { position: [number, number, number]; color: string; strength?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const wave = (Math.sin(t * 3.2) + 1) / 2;
    ref.current.scale.setScalar(0.7 + wave * 1.5 * strength);
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.08 + (1 - wave) * 0.2 * strength;
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.1, 1.16, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function AwakeningField({ complete }: { complete: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.y = t * 0.025;
    group.current.rotation.x = Math.sin(t * 0.2) * 0.04;
  });
  if (!complete) return null;
  return (
    <group ref={group}>
      {[10, 16, 24, 34].map((radius, index) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 + index * 0.12, 14]}>
          <torusGeometry args={[radius, 0.018 + index * 0.006, 8, 128]} />
          <meshBasicMaterial color={index % 2 ? "#54e6d4" : "#b8ff4d"} transparent opacity={0.12 - index * 0.018} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[0, 4, 14]} color="#b8ff4d" intensity={9} distance={28} />
      <pointLight position={[0, 5, 28]} color="#ff6b35" intensity={7} distance={20} />
    </group>
  );
}

export default function WorldReactivity({ discovered, complete }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const onArtifact = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      setSelectedId(id);
      setPulse((value) => value + 1);
    };
    window.addEventListener("bibash:artifact-selected", onArtifact);
    return () => window.removeEventListener("bibash:artifact-selected", onArtifact);
  }, []);

  const selected = useMemo(() => SIGNALS.find((signal) => signal.id === selectedId) ?? null, [selectedId]);
  const activeSignals = useMemo(() => SIGNALS.filter((signal) => discovered.includes(signal.chapter)), [discovered]);

  return (
    <group key={pulse}>
      {activeSignals.map((signal) => {
        const chapter = CHAPTERS[signal.chapter];
        return (
          <group key={signal.id}>
            <Line points={[signal.position, chapter]} color={signal.color} transparent opacity={selected?.id === signal.id ? 0.72 : 0.16} lineWidth={selected?.id === signal.id ? 1.5 : 0.55} />
            <Pulse position={signal.position} color={signal.color} strength={selected?.id === signal.id ? 1.8 : 0.65} />
          </group>
        );
      })}
      {discovered.map((id) => CHAPTERS[id] ? <Pulse key={`chapter-${id}`} position={CHAPTERS[id]} color={id === "about" ? "#6d5bff" : id === "education" ? "#54e6d4" : id === "blog" ? "#ff4af0" : id === "projects" ? "#ffd700" : id === "skills" ? "#22c55e" : "#ff6b35"} strength={complete ? 1.2 : 0.7} /> : null)}
      <AwakeningField complete={complete} />
    </group>
  );
}
