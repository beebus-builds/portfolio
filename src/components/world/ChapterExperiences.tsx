"use client";

import { Float, Sparkles, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

type Props = { discovered: string[]; complete: boolean };

function Orbit({ color, active, radius = 2 }: { color: string; active: boolean; radius?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * (active ? 0.35 : 0.12);
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.4) * 0.15;
  });
  return <group ref={ref}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[radius, 0.018, 8, 64]} /><meshBasicMaterial color={color} transparent opacity={active ? 0.55 : 0.12} /></mesh>
    {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a * 1.4) * 0.3, Math.sin(a) * radius]}><sphereGeometry args={[active ? 0.075 : 0.035, 8, 8]} /><meshBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.2} /></mesh>; })}
  </group>;
}

function IdentityExperience({ active }: { active: boolean }) {
  const nodes = useMemo(() => [
    [-1.8, 1.7, 0], [0, 2.8, 0], [1.8, 1.7, 0], [-1.2, 0.2, 0], [1.2, 0.2, 0], [0, 1.1, 0],
  ] as [number, number, number][], []);
  return <group position={[-5.2, 0, -27]}>
    <Orbit color="#6d5bff" active={active} radius={2.4} />
    {nodes.map((p, i) => <mesh key={i} position={p}><icosahedronGeometry args={[active ? 0.2 : 0.11, 0]} /><meshStandardMaterial color="#6d5bff" emissive="#6d5bff" emissiveIntensity={active ? 3 : 0.4} toneMapped={false} /></mesh>)}
    {active && <Text position={[0, 4.1, 0]} fontSize={0.16} color="#9c8fff" anchorX="center" letterSpacing={0.08}>IDENTITY / RECONSTRUCTED</Text>}
  </group>;
}

function QuestionExperience({ active }: { active: boolean }) {
  const refs = useRef<THREE.Group[]>([]);
  useFrame(({ clock }) => refs.current.forEach((g, i) => { if (g) g.position.y = 1.5 + Math.sin(clock.elapsedTime * 1.3 + i) * (active ? 0.35 : 0.08); }));
  return <group position={[5.2, 0, -14]}>
    {refs.current.length === 0 ? null : null}
    {['WHY?', 'HOW?', 'WHAT IF?', 'CAN I?'].map((q, i) => <group key={q} ref={(el) => { if (el) refs.current[i] = el; }} position={[(i - 1.5) * 1.6, 1.5, Math.sin(i) * 0.8]}><mesh><octahedronGeometry args={[0.34, 0]} /><meshBasicMaterial color="#54e6d4" transparent opacity={active ? 0.75 : 0.16} /></mesh><Text position={[0, 0.7, 0]} fontSize={0.13} color="#54e6d4" anchorX="center" fillOpacity={active ? 0.9 : 0.2}>{q}</Text></group>)}
    {active && <Sparkles count={70} scale={[7, 4, 4]} size={1.4} speed={0.8} color="#54e6d4" />}
  </group>;
}

function FailureExperience({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.z = active ? Math.sin(clock.elapsedTime * 2.2) * 0.04 : 0; });
  return <group ref={ref} position={[-5.2, 0, -1]}>
    {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[(i - 3) * 0.85, 1.1 + (i % 2) * 0.25, Math.sin(i) * 0.45]} rotation={[0, 0, active ? (i % 2 ? 0.22 : -0.22) : 0]}><boxGeometry args={[0.7, 0.18, 0.8]} /><meshStandardMaterial color="#ff4af0" emissive="#ff4af0" emissiveIntensity={active ? 2 : 0.25} /></mesh>)}
    <Text position={[0, 2.8, 0]} fontSize={0.15} color="#ff4af0" anchorX="center" fillOpacity={active ? 0.85 : 0.18}>ERROR → INSIGHT → RETRY</Text>
  </group>;
}

function BuildExperience({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.18; });
  return <group ref={ref} position={[5.2, 1.7, 14]}>
    {[0, 1, 2].map((i) => <mesh key={i} position={[(i - 1) * 1.45, Math.sin(i) * 0.7, 0]}><torusKnotGeometry args={[0.55, 0.13, 64, 10]} /><meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={active ? 1.8 : 0.25} metalness={0.7} roughness={0.25} /></mesh>)}
    <Text position={[0, 2.4, 0]} rotation={[0, -0.2, 0]} fontSize={0.15} color="#ffd700" anchorX="center" fillOpacity={active ? 0.9 : 0.2}>SYSTEMS / INTERFACES / EXPERIMENTS</Text>
  </group>;
}

function ToolkitExperience({ active }: { active: boolean }) {
  const skills = ['REACT', 'NEXT', 'WP', 'FIGMA', 'ALPINE', 'THREE'];
  return <group position={[-5.2, 1.8, 22]}>
    {skills.map((skill, i) => { const a = (i / skills.length) * Math.PI * 2; return <Float key={skill} speed={1 + i * 0.08} floatIntensity={active ? 0.45 : 0.12}><group position={[Math.cos(a) * 2.1, Math.sin(a * 2) * 0.45, Math.sin(a) * 2.1]}><mesh><sphereGeometry args={[0.18, 12, 12]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={active ? 2 : 0.2} /></mesh><Text position={[0, 0.42, 0]} fontSize={0.11} color="#79f99d" anchorX="center" fillOpacity={active ? 0.8 : 0.15}>{skill}</Text></group></Float>; })}
    <Orbit color="#22c55e" active={active} radius={2.5} />
  </group>;
}

function UnknownExperience({ active, complete }: { active: boolean; complete: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.elapsedTime * (complete ? 0.45 : 0.12); });
  return <group ref={ref} position={[5.2, 2.3, 28]}>
    <mesh><octahedronGeometry args={[1.1, 1]} /><meshBasicMaterial color="#ff6b35" wireframe transparent opacity={active || complete ? 0.8 : 0.16} /></mesh>
    <mesh scale={1.7}><octahedronGeometry args={[1.1, 1]} /><meshBasicMaterial color="#ff6b35" wireframe transparent opacity={complete ? 0.18 : 0.04} /></mesh>
    <Text position={[0, 2.1, 0]} fontSize={0.16} color="#ff6b35" anchorX="center" fillOpacity={active || complete ? 0.9 : 0.18}>{complete ? 'UNKNOWN / OPEN' : 'UNKNOWN / LOCKED'}</Text>
    {complete && <Sparkles count={100} scale={[6, 5, 6]} size={1.7} speed={0.7} color="#ff6b35" />}
  </group>;
}

export default function ChapterExperiences({ discovered, complete }: Props) {
  const active = (id: string) => discovered.includes(id);
  return <group>
    <IdentityExperience active={active('about')} />
    <QuestionExperience active={active('education')} />
    <FailureExperience active={active('blog')} />
    <BuildExperience active={active('projects')} />
    <ToolkitExperience active={active('skills')} />
    <UnknownExperience active={active('contact')} complete={complete} />
    {complete && <Text position={[0, 5.4, 34]} fontSize={0.2} color="#b8ff4d" anchorX="center" letterSpacing={0.12}>JOURNEY COMPLETE / CONTINUE BEYOND THE MAP</Text>}
  </group>;
}
