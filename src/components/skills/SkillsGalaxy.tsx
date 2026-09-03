"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface GalaxyProps {
  active: number;
  onSelect: (i: number) => void;
}

const GROUPS = [
  { name: "Frontend", color: "#4af0ff", orbit: 2.2, size: 0.42, skills: 6 },
  { name: "Backend", color: "#ffd700", orbit: 3.4, size: 0.5, skills: 5 },
  { name: "Tools", color: "#ff4af0", orbit: 4.6, size: 0.38, skills: 6 },
];

function Planet({
  group,
  index,
  active,
  onSelect,
  t0,
}: {
  group: (typeof GROUPS)[number];
  index: number;
  active: boolean;
  onSelect: () => void;
  t0: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const moons = useMemo(
    () =>
      Array.from({ length: group.skills }, (_, i) => ({
        a: (i / group.skills) * Math.PI * 2,
        r: 0.75 + (i % 2) * 0.18,
        s: 0.5 + ((i * 37) % 40) / 100,
      })),
    [group.skills]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.35 + t0;
    const x = Math.cos(t) * group.orbit;
    const z = Math.sin(t) * group.orbit;
    mesh.current?.position.set(x, Math.sin(t * 1.6) * 0.25, z);
    mesh.current?.rotation.set(t * 0.4, t * 0.7, 0);
    // face label outward automatically via Html
  });

  return (
    <group>
      {/* orbit ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[group.orbit - 0.015, group.orbit + 0.015, 96]} />
        <meshBasicMaterial color={group.color} transparent opacity={active ? 0.55 : 0.18} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh
        ref={mesh}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[group.size, 32, 32]} />
        <meshStandardMaterial
          color={group.color}
          emissive={group.color}
          emissiveIntensity={active ? 1.1 : 0.45}
          roughness={0.25}
          metalness={0.6}
        />
        {/* moons = individual skills */}
        {moons.map((m, i) => (
          <mesh key={i} position={[Math.cos(m.a) * m.r, Math.sin(m.a * 1.3) * 0.3, Math.sin(m.a) * m.r]}>
            <sphereGeometry args={[0.09 * m.s + 0.05, 12, 12]} />
            <meshBasicMaterial color={group.color} transparent opacity={0.9} />
          </mesh>
        ))}
        <Html center distanceFactor={9} style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontFamily: "ui-monospace,monospace",
              fontSize: 11,
              letterSpacing: ".08em",
              color: active ? group.color : "rgba(255,255,255,.65)",
              background: "rgba(5,5,12,.72)",
              border: `1px solid ${group.color}${active ? "" : "44"}`,
              padding: "4px 10px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              boxShadow: active ? `0 0 18px ${group.color}66` : "none",
              transform: "translateY(-34px)",
            }}
          >
            {group.name}
          </div>
        </Html>
        {active && (
          <mesh scale={1.35}>
            <sphereGeometry args={[group.size, 24, 24]} />
            <meshBasicMaterial color={group.color} wireframe transparent opacity={0.3} />
          </mesh>
        )}
      </mesh>
    </group>
  );
}

function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ref.current?.rotation.set(t * 0.2, t * 0.3, 0);
    const s = 0.55 + Math.sin(t * 2) * 0.05;
    ref.current?.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.7, 1]} />
      <meshStandardMaterial color="#b8ff4d" emissive="#b8ff4d" emissiveIntensity={0.9} wireframe />
    </mesh>
  );
}

export default function SkillsGalaxy({ active, onSelect }: GalaxyProps) {
  const [auto, setAuto] = useState(true);
  return (
    <div
      className="term-window overflow-hidden mb-8"
      onPointerEnter={() => setAuto(false)}
      onPointerLeave={() => setAuto(true)}
    >
      <div className="term-titlebar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-path">~/skills-galaxy — drag to spin · click planet to filter</span>
      </div>
      <div style={{ height: 340, background: "radial-gradient(ellipse at 50% 120%, #101a2e 0%, #05050c 60%)" }}>
        <Canvas camera={{ position: [0, 4.2, 8.5], fov: 50 }} dpr={[1, 1.75]}>
          <ambientLight intensity={0.5} />
          <pointLight position={[0, 0, 0]} intensity={12} color="#b8ff4d" distance={12} />
          <pointLight position={[6, 4, -4]} intensity={20} color="#4af0ff" distance={20} />
          <Suspense fallback={null}>
            <Core />
            {GROUPS.map((g, i) => (
              <Planet key={g.name} group={g} index={i} t0={i * 2.1} active={active === i} onSelect={() => onSelect(i)} />
            ))}
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={auto} autoRotateSpeed={0.9} maxPolarAngle={Math.PI / 2.4} minPolarAngle={Math.PI / 4.5} />
        </Canvas>
      </div>
    </div>
  );
}
