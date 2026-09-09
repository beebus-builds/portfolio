"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type SecretMemoryData = { id: string; position: [number, number, number]; title: string; text: string };

export const SECRET_MEMORIES: SecretMemoryData[] = [
  { id: "origin", position: [-7, 1.1, -20], title: "ORIGIN", text: "Every serious build starts as a strange idea." },
  { id: "debug", position: [7, 1.1, -7], title: "DEBUG", text: "The bug was not the end. It was the map." },
  { id: "ship", position: [-7, 1.1, 8], title: "SHIP", text: "A finished imperfect thing beats a perfect thing never shipped." },
  { id: "signal", position: [7, 1.1, 19], title: "SIGNAL", text: "Keep the useful parts. Delete the noise." },
  { id: "unknown", position: [-3, 1.1, 31], title: "UNKNOWN", text: "The best work usually begins before you know how to build it." },
];

export default function SecretMemory({ memory, collected, onCollect }: { memory: SecretMemoryData; collected: boolean; onCollect: (id: string) => void }) {
  const group = useRef<THREE.Group>(null);
  const nearRef = useRef(false);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (nearRef.current && (event.key === "Enter" || event.key.toLowerCase() === "e")) onCollect(memory.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [memory.id, onCollect]);

  useFrame(({ clock, camera }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.rotation.y += 0.012;
    group.current.position.y = memory.position[1] + Math.sin(t * 2 + memory.position[2]) * 0.16;
    const nextNear = camera.position.distanceTo(group.current.position) < 2.6;
    if (nextNear !== nearRef.current) {
      nearRef.current = nextNear;
      setNear(nextNear);
    }
  });

  if (collected) return null;

  return (
    <group ref={group} position={memory.position}>
      <mesh>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color="#b8ff4d" emissive="#b8ff4d" emissiveIntensity={2.2} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.58, 0.62, 24]} />
        <meshBasicMaterial color="#b8ff4d" transparent opacity={0.28} side={THREE.DoubleSide} />
      </mesh>
      {near && <>
        <Text position={[0, 0.9, 0]} fontSize={0.09} color="#b8ff4d" anchorX="center">MEMORY // {memory.title}</Text>
        <Text position={[0, 0.65, 0]} fontSize={0.065} color="#ffffff" anchorX="center" maxWidth={3} textAlign="center">PRESS E TO RECOVER</Text>
      </>}
      <pointLight color="#b8ff4d" intensity={near ? 3 : 0.8} distance={3} />
    </group>
  );
}
