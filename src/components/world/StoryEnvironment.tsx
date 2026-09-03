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
  useFrame(({ clock }) => pulse.current?.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.7 + z) * (active ? 0.055 : 0.02)));
  return <group position={[0, 0, z]}>
    <mesh ref={pulse} position={[0, 2.2, 0]}><torusGeometry args={[2.05, 0.025, 8, 64]} /><meshBasicMaterial color={color} transparent opacity={active ? 0.75 : 0.18} /></mesh>
    <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3.7, 4.2]} /><meshBasicMaterial color={color} transparent opacity={active ? 0.055 : 0.015} side={THREE.DoubleSide} depthWrite={false} /></mesh>
    {/* Volumetric-feel light beam + ground pool */}
    <mesh position={[0, 4.5, 0]}><cylinderGeometry args={[0.09, 0.35, 9, 12, 1, true]} /><meshBasicMaterial color={color} transparent opacity={active ? 0.16 : 0.05} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[2.5, 32]} /><meshBasicMaterial color={color} transparent opacity={active ? 0.14 : 0.04} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    <Text position={[0, 4.2, 0]} fontSize={0.19} color={color} anchorX="center" anchorY="middle" letterSpacing={0.12} fillOpacity={active ? 0.9 : 0.35}>CHAPTER {n} / {title}</Text>
    <Text position={[0, 3.75, 0]} fontSize={0.13} color="#d8d5e5" anchorX="center" anchorY="middle" maxWidth={6} fillOpacity={active ? 0.8 : 0.22}>{line}</Text>
    <pointLight position={[0, 2.2, 0]} color={color} intensity={active ? 4.5 : 0.5} distance={9} />
  </group>;
}

function Ruins({ repaired }: { repaired: boolean }) {
  const blocks = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ x: (i % 2 ? 1 : -1) * (5.2 + (i % 4) * 1.1), y: 0.7 + (i % 5) * 0.55, z: -5 + i * 0.48, r: (i * 0.7) % 0.45 })), []);
  return <group>
    {blocks.map((b, i) => <mesh key={i} position={[b.x, b.y, b.z]} rotation={[0, b.r, (i % 3) * 0.08]} castShadow><boxGeometry args={[1.1 + (i % 3) * 0.45, b.y * 1.3, 0.8 + (i % 2) * 0.5]} /><meshStandardMaterial color={repaired ? "#1d1a33" : "#14121f"} emissive={repaired ? "#45348a" : "#281d42"} emissiveIntensity={repaired ? 0.9 : 0.45} roughness={0.85} flatShading /></mesh>)}
    <mesh position={[0, repaired ? 1.9 : 0.8, -0.3]} rotation={[0, 0, repaired ? 0 : 0.18]}>
      <boxGeometry args={[7.5, 0.16, 0.32]} />
      <meshStandardMaterial color="#2a2345" emissive="#8b4cff" emissiveIntensity={repaired ? 1.6 : 0.25} />
    </mesh>
    {!repaired && <Sparkles count={55} scale={[13, 5, 8]} size={1.6} speed={0.8} color="#ff4af0" position={[0, 2, -1]} />}
    {repaired && <pointLight position={[0, 2, 5]} color="#6d5bff" intensity={6} distance={14} />}
  </group>;
}

function QuestionForest({ active }: { active: boolean }) {
  return <group position={[0, 0, -14]}>
    {[-6, -3, 0, 3, 6].map((x, i) => <group key={i} position={[x, 0, (i % 2) * 1.5 - 0.5]}>
      <mesh position={[0, 0.8, 0]} castShadow><cylinderGeometry args={[0.14, 0.24, 1.6, 7]} /><meshStandardMaterial color="#2a1c14" roughness={0.9} /></mesh>
      <mesh position={[0, 2.2, 0]} castShadow><coneGeometry args={[1.0, 1.9, 8]} /><meshStandardMaterial color="#0e3a34" roughness={0.8} flatShading /></mesh>
      <mesh position={[0, 3.3, 0]} castShadow><coneGeometry args={[0.62, 1.3, 8]} /><meshStandardMaterial color="#155a50" emissive="#54e6d4" emissiveIntensity={active ? 1.1 : 0.25} roughness={0.7} flatShading /></mesh>
      <mesh position={[0, 4.15, 0]}><octahedronGeometry args={[0.16, 0]} /><meshStandardMaterial color="#54e6d4" emissive="#54e6d4" emissiveIntensity={active ? 2.2 : 0.4} toneMapped={false} flatShading /></mesh>
      {active && <Text position={[0, 4.7, 0]} fontSize={0.18} color="#54e6d4" anchorX="center">{["WHY?", "WHAT IF?", "HOW?", "CAN I?", "TRY."][i]}</Text>}
    </group>)}
  </group>;
}

function FailureBridge({ rebuilt }: { rebuilt: boolean }) {
  const fragments = useMemo(() => Array.from({ length: 11 }, (_, i) => i), []);
  return <group position={[0, 0, 3]}>
    {fragments.map((i) => {
      const x = -5 + i;
      const y = rebuilt ? 1.05 : 0.35 + (i % 3) * 0.8;
      return <mesh key={i} position={[x, y, 0]} rotation={[0, rebuilt ? 0 : (i % 2 ? 0.22 : -0.28), rebuilt ? 0 : (i % 3) * 0.15]} castShadow>
        <boxGeometry args={[0.82, 0.22, 1.15]} />
        <meshStandardMaterial color={rebuilt ? "#32243d" : "#211326"} emissive="#ff4af0" emissiveIntensity={rebuilt ? 0.8 : 1.8} roughness={0.6} flatShading />
      </mesh>;
    })}
    <Text position={[0, 3.2, 0]} fontSize={0.15} color="#ff4af0" anchorX="center" fillOpacity={rebuilt ? 0.2 : 0.8}>{rebuilt ? "THE PATH CONTINUES" : "SYSTEM ERROR / KEEP GOING"}</Text>
  </group>;
}

function MemoryRoom({ active }: { active: boolean }) {
  return <group position={[-5.2, 0, 22]}>
    <mesh position={[0, 1.8, 0]}><boxGeometry args={[4.8, 0.14, 2.2]} /><meshStandardMaterial color="#1a1820" roughness={0.7} /></mesh>
    <mesh position={[0, 2.7, -0.7]}><boxGeometry args={[2.4, 1.4, 0.12]} /><meshStandardMaterial color="#090a0f" emissive="#244a48" emissiveIntensity={active ? 1.5 : 0.15} /></mesh>
    <mesh position={[0, 2.7, -0.6]}><planeGeometry args={[1.95, 0.95]} /><meshBasicMaterial color="#54e6d4" transparent opacity={active ? 0.12 : 0.025} /></mesh>
    <mesh position={[1.4, 1.98, 0.25]}><cylinderGeometry args={[0.28, 0.22, 0.45, 12]} /><meshStandardMaterial color="#342c35" /></mesh>
    <mesh position={[1.4, 2.25, 0.25]}><torusGeometry args={[0.24, 0.055, 8, 24]} /><meshBasicMaterial color="#ff6b35" /></mesh>
    <Text position={[0, 1.25, 1.15]} fontSize={0.12} color="#54e6d4" anchorX="center" fillOpacity={active ? 0.75 : 0.18}>3:17 AM — STILL DEBUGGING.</Text>
    <pointLight position={[0, 2.5, -0.3]} color="#54e6d4" intensity={active ? 3.5 : 0.35} distance={7} />
  </group>;
}

function ProjectMonuments({ active }: { active: boolean }) {
  return <group position={[0, 0, 14]}>
    {[-5, 0, 5].map((x, i) => <Float key={i} speed={1.2 + i * 0.25} floatIntensity={0.25}><group position={[x, 1.5 + i * 0.3, 0]}>
      <mesh castShadow><octahedronGeometry args={[1.15 + i * 0.25, 0]} /><meshStandardMaterial color={i === 1 ? "#3a2f08" : "#1a1733"} emissive={i === 1 ? "#8a6f00" : "#352a73"} emissiveIntensity={active ? 1.8 : 0.35} metalness={0.35} roughness={0.35} flatShading /></mesh>
      <mesh scale={0.45}><octahedronGeometry args={[1.15 + i * 0.25, 0]} /><meshBasicMaterial color={i === 1 ? "#ffe873" : "#8f7bff"} toneMapped={false} transparent opacity={active ? 0.85 : 0.25} /></mesh>
      <mesh scale={1.35}><ringGeometry args={[1, 1.03, 32]} /><meshBasicMaterial color="#ffd700" transparent opacity={active ? 0.45 : 0.12} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      <mesh position={[0, -2.1, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[1.7, 24]} /><meshBasicMaterial color="#ffd700" transparent opacity={active ? 0.12 : 0.03} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
      {active && <Text position={[0, -1.65, 0]} fontSize={0.12} color="#ffd700" anchorX="center">{["SYSTEMS", "INTERFACES", "EXPERIMENTS"][i]}</Text>}
    </group></Float>)}
  </group>;
}

export default function StoryEnvironment({ progress, discovered }: Props) {
  const dust = useMemo(() => { const values = new Float32Array(260 * 3); for (let i = 0; i < 260; i++) { values[i * 3] = ((i * 47) % 34) - 17; values[i * 3 + 1] = ((i * 23) % 10) + 0.4; values[i * 3 + 2] = ((i * 71) % 68) - 34; } return values; }, []);
  const horizon = discovered.length >= 5;
  const repaired = discovered.length >= 2;
  const questions = discovered.includes("education");
  const failure = discovered.includes("blog");
  const building = discovered.includes("projects");
  const person = discovered.includes("skills");
  return <>
    <Sparkles count={horizon ? 420 : 180} scale={[18, 8, 65]} size={horizon ? 1.8 : 1.3} speed={horizon ? 0.35 : 0.18} color={horizon ? "#b8ff4d" : "#9b91ff"} position={[0, 3, 0]} />
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[dust, 3]} /></bufferGeometry><pointsMaterial size={0.045} color="#ffffff" transparent opacity={horizon ? 0.5 : 0.28} depthWrite={false} /></points>
    {chapters.map((chapter, index) => <ChapterGate key={chapter.n} {...chapter} active={progress >= index || discovered.length > index} />)}
    <QuestionForest active={questions} />
    <Ruins repaired={repaired} />
    <FailureBridge rebuilt={failure} />
    <ProjectMonuments active={building} />
    <MemoryRoom active={person} />
    {horizon && <><mesh position={[0, 2.5, 34]}><torusGeometry args={[4.5, 0.035, 12, 64]} /><meshBasicMaterial color="#b8ff4d" transparent opacity={0.9} /></mesh><mesh position={[0, 2.5, 34]}><torusGeometry args={[4.5, 0.35, 12, 64]} /><meshBasicMaterial color="#b8ff4d" transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh><pointLight position={[0, 4, 34]} color="#b8ff4d" intensity={12} distance={18} /></>}
    {[-1, 1].map((side) => <group key={side} position={[side * 10.5, 0, 0]}>{Array.from({ length: 16 }, (_, i) => <mesh key={i} position={[0, 0.7 + (i % 4) * 0.55, -31 + i * 4.2]} rotation={[0, (i % 5) * 0.18, 0]} castShadow><boxGeometry args={[0.18, 1.2 + (i % 4) * 0.7, 0.18]} /><meshStandardMaterial color="#1c1832" emissive="#4535b8" emissiveIntensity={0.85} roughness={0.6} flatShading /></mesh>)}</group>)}
  </>;
}
