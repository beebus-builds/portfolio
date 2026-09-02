"use client";

import { Float, Sparkles, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const chapters = [
  { z: -28, n: "01", title: "THE BEGINNING", line: "Everyone starts somewhere.", color: "#6d5bff" },
  { z: -14, n: "02", title: "THE QUESTIONS", line: "What if I tried?", color: "#54e6d4" },
  { z: 0, n: "03", title: "THE FAILURE", line: "Not everything worked.", color: "#ff4af0" },
  { z: 14, n: "04", title: "THE BUILDING", line: "So I learned to build better.", color: "#ffd700" },
  { z: 28, n: "05", title: "THE HORIZON", line: "The interesting part is next.", color: "#ff6b35" },
];

function ChapterGate({ z, n, title, line, color }: (typeof chapters)[number]) {
  const pulse = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pulse.current) pulse.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.7 + z) * 0.035);
  });
  return (
    <group position={[0, 0, z]}>
      <mesh ref={pulse} position={[0, 2.2, 0]}>
        <torusGeometry args={[2.05, 0.025, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.7, 4.2]} />
        <meshBasicMaterial color={color} transparent opacity={0.035} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 4.2, 0]} fontSize={0.19} color={color} anchorX="center" anchorY="middle" letterSpacing={0.12}>
        CHAPTER {n} / {title}
      </Text>
      <Text position={[0, 3.75, 0]} fontSize={0.13} color="#d8d5e5" anchorX="center" anchorY="middle" maxWidth={6}>
        {line}
      </Text>
      <pointLight position={[0, 2.2, 0]} color={color} intensity={3.5} distance={8} />
    </group>
  );
}

function Ruins() {
  const blocks = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (5.2 + (i % 4) * 1.1),
    y: 0.7 + (i % 5) * 0.55,
    z: -5 + i * 0.48,
    r: (i * 0.7) % 0.45,
  })), []);
  return <group>
    {blocks.map((b, i) => <mesh key={i} position={[b.x, b.y, b.z]} rotation={[0, b.r, (i % 3) * 0.08]}>
      <boxGeometry args={[1.1 + (i % 3) * 0.45, b.y * 1.3, 0.8 + (i % 2) * 0.5]} />
      <meshStandardMaterial color="#12111d" emissive="#281d42" emissiveIntensity={0.45} roughness={0.92} />
    </mesh>)}
  </group>;
}

function ProjectMonuments() {
  return <group position={[0, 0, 14]}>
    {[-5, 0, 5].map((x, i) => <Float key={i} speed={1.2 + i * 0.25} floatIntensity={0.25}>
      <group position={[x, 1.5 + i * 0.3, 0]}>
        <mesh>
          <octahedronGeometry args={[1.15 + i * 0.25, 0]} />
          <meshStandardMaterial color={i === 1 ? "#ffd700" : "#17152b"} emissive={i === 1 ? "#8a6f00" : "#352a73"} emissiveIntensity={1.1} metalness={0.55} roughness={0.3} />
        </mesh>
        <mesh scale={1.35}>
          <ringGeometry args={[1, 1.03, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Float>)}
  </group>;
}

export default function StoryEnvironment() {
  return <>
    <Sparkles count={180} scale={[18, 8, 65]} size={1.3} speed={0.18} color="#9b91ff" position={[0, 3, 0]} />
    {chapters.map((chapter) => <ChapterGate key={chapter.n} {...chapter} />)}
    <Ruins />
    <ProjectMonuments />
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[28, 70]} />
      <meshStandardMaterial color="#05050a" roughness={1} metalness={0.05} />
    </mesh>
    <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.035, 70]} />
      <meshBasicMaterial color="#6d5bff" transparent opacity={0.55} />
    </mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 10.5, 0, 0]}>
      {Array.from({ length: 16 }, (_, i) => <mesh key={i} position={[0, 0.7 + (i % 4) * 0.55, -31 + i * 4.2]} rotation={[0, (i % 5) * 0.18, 0]}>
        <boxGeometry args={[0.18, 1.2 + (i % 4) * 0.7, 0.18]} />
        <meshStandardMaterial color="#17142b" emissive="#352a73" emissiveIntensity={0.65} />
      </mesh>)}
    </group>)}
  </>;
}
