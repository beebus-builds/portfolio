"use client";

import { Float, Sparkles, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Props = { progress: number; discovered: string[] };

const chapters = [
  { z: -28, n: "01", title: "THE BEGINNING", line: "Everyone starts somewhere.", color: "#6d5bff" },
  { z: -14, n: "02", title: "THE QUESTIONS", line: "What if I tried?", color: "#54e6d4" },
  { z: 0, n: "03", title: "THE FAILURE", line: "Not everything worked.", color: "#ff4af0" },
  { z: 14, n: "04", title: "THE BUILDING", line: "So I learned to build better.", color: "#ffd700" },
  { z: 28, n: "05", title: "THE HORIZON", line: "The interesting part is next.", color: "#ff6b35" },
];

function ChapterGate({ z, n, title, line, color, active }: (typeof chapters)[number] & { active: boolean }) {
  const pulse = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (pulse.current) pulse.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.7 + z) * (active ? 0.055 : 0.02));
  });
  return (
    <group position={[0, 0, z]}>
      <mesh ref={pulse} position={[0, 2.2, 0]}>
        <torusGeometry args={[2.05, 0.025, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.75 : 0.18} />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.7, 4.2]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.055 : 0.015} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 4.2, 0]} fontSize={0.19} color={color} anchorX="center" anchorY="middle" letterSpacing={0.12} fillOpacity={active ? 0.9 : 0.35}>
        CHAPTER {n} / {title}
      </Text>
      <Text position={[0, 3.75, 0]} fontSize={0.13} color="#d8d5e5" anchorX="center" anchorY="middle" maxWidth={6} fillOpacity={active ? 0.8 : 0.22}>
        {line}
      </Text>
      <pointLight position={[0, 2.2, 0]} color={color} intensity={active ? 4.5 : 0.5} distance={9} />
    </group>
  );
}

function Ruins({ repaired }: { repaired: boolean }) {
  const blocks = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    x: (i % 2 ? 1 : -1) * (5.2 + (i % 4) * 1.1),
    y: 0.7 + (i % 5) * 0.55,
    z: -5 + i * 0.48,
    r: (i * 0.7) % 0.45,
  })), []);
  return <group>
    {blocks.map((b, i) => <mesh key={i} position={[b.x, b.y, b.z]} rotation={[0, b.r, (i % 3) * 0.08]}>
      <boxGeometry args={[1.1 + (i % 3) * 0.45, b.y * 1.3, 0.8 + (i % 2) * 0.5]} />
      <meshStandardMaterial color={repaired ? "#18182b" : "#12111d"} emissive={repaired ? "#45348a" : "#281d42"} emissiveIntensity={repaired ? 0.9 : 0.45} roughness={0.92} />
    </mesh>)}
    {repaired && <pointLight position={[0, 2, 5]} color="#6d5bff" intensity={6} distance={14} />}
  </group>;
}

function ProjectMonuments({ active }: { active: boolean }) {
  return <group position={[0, 0, 14]}>
    {[-5, 0, 5].map((x, i) => <Float key={i} speed={1.2 + i * 0.25} floatIntensity={0.25}>
      <group position={[x, 1.5 + i * 0.3, 0]}>
        <mesh>
          <octahedronGeometry args={[1.15 + i * 0.25, 0]} />
          <meshStandardMaterial color={i === 1 ? "#ffd700" : "#17152b"} emissive={i === 1 ? "#8a6f00" : "#352a73"} emissiveIntensity={active ? 1.8 : 0.35} metalness={0.55} roughness={0.3} />
        </mesh>
        <mesh scale={1.35}>
          <ringGeometry args={[1, 1.03, 32]} />
          <meshBasicMaterial color="#ffd700" transparent opacity={active ? 0.45 : 0.12} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Float>)}
  </group>;
}

export default function StoryEnvironment({ progress, discovered }: Props) {
  const dust = useMemo(() => {
    const values = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      values[i * 3] = ((i * 47) % 34) - 17;
      values[i * 3 + 1] = ((i * 23) % 10) + 0.4;
      values[i * 3 + 2] = ((i * 71) % 68) - 34;
    }
    return values;
  }, []);
  const horizon = discovered.length >= 5;
  const repaired = discovered.length >= 2;
  return <>
    <Sparkles count={horizon ? 420 : 180} scale={[18, 8, 65]} size={horizon ? 1.8 : 1.3} speed={horizon ? 0.35 : 0.18} color={horizon ? "#b8ff4d" : "#9b91ff"} position={[0, 3, 0]} />
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[dust, 3]} /></bufferGeometry>
      <pointsMaterial size={0.045} color="#ffffff" transparent opacity={horizon ? 0.5 : 0.28} depthWrite={false} />
    </points>
    {chapters.map((chapter, index) => <ChapterGate key={chapter.n} {...chapter} active={progress >= index || discovered.length > index} />)}
    <Ruins repaired={repaired} />
    <ProjectMonuments active={discovered.includes("projects")} />
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[28, 76]} />
      <meshStandardMaterial color="#05050a" roughness={1} metalness={0.05} />
    </mesh>
    <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[horizon ? 0.08 : 0.035, 76]} />
      <meshBasicMaterial color={horizon ? "#b8ff4d" : "#6d5bff"} transparent opacity={horizon ? 0.95 : 0.55} />
    </mesh>
    {horizon && <mesh position={[0, 2.5, 34]} rotation={[0, 0, 0]}>
      <torusGeometry args={[4.5, 0.035, 12, 64]} />
      <meshBasicMaterial color="#b8ff4d" transparent opacity={0.9} />
    </mesh>}
    {[-1, 1].map((side) => <group key={side} position={[side * 10.5, 0, 0]}>
      {Array.from({ length: 16 }, (_, i) => <mesh key={i} position={[0, 0.7 + (i % 4) * 0.55, -31 + i * 4.2]} rotation={[0, (i % 5) * 0.18, 0]}>
        <boxGeometry args={[0.18, 1.2 + (i % 4) * 0.7, 0.18]} />
        <meshStandardMaterial color="#17142b" emissive="#352a73" emissiveIntensity={0.65} />
      </mesh>)}
    </group>)}
  </>;
}
