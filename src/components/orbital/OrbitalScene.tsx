"use client";

import { Float, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { projects } from "@/lib/projects";

type OrbitalSceneProps = {
  engaged: boolean;
  discoveredCount: number;
  discovered: string[];
  selectedMission: string | null;
  onSelectMission: (slug: string) => void;
};

type SolarWingProps = {
  position: [number, number, number];
  rotation: [number, number, number];
};

function SolarWing({ position, rotation }: SolarWingProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[3.8, 0.08, 1.45]} />
        <meshStandardMaterial
          color="#152c4b"
          emissive="#0c5274"
          emissiveIntensity={0.7}
          metalness={0.74}
          roughness={0.28}
        />
      </mesh>
      {[-1.5, -0.75, 0, 0.75, 1.5].map((x) => (
        <mesh key={x} position={[x, 0.06, 0]}>
          <boxGeometry args={[0.018, 0.025, 1.34]} />
          <meshBasicMaterial color="#63d8ff" transparent opacity={0.55} />
        </mesh>
      ))}
      {[-0.45, 0.45].map((z) => (
        <mesh key={z} position={[0, 0.07, z]}>
          <boxGeometry args={[3.66, 0.02, 0.018]} />
          <meshBasicMaterial color="#63d8ff" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function Station({ engaged, discoveredCount, selectedMission }: Pick<OrbitalSceneProps, "engaged" | "discoveredCount" | "selectedMission">) {
  const station = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, delta) => {
    if (station.current) {
      station.current.rotation.y += delta * (engaged ? 0.2 : 0.075);
      station.current.position.y = Math.sin(clock.elapsedTime * 0.45) * 0.08;
    }
    if (ring.current) {
      ring.current.rotation.z += delta * (engaged ? 0.38 : 0.16);
    }
    if (beacon.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.16;
      beacon.current.scale.setScalar(pulse);
    }
  });

  const signalColor = selectedMission ? "#d8fbff" : "#67e8f9";
  const signalStrength = Math.min(1.8, 0.7 + discoveredCount * 0.16);

  return (
    <group ref={station} position={[1.4, 0.15, 0]} scale={1.08}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.88, 1.05, 2.8, 32]} />
        <meshStandardMaterial
          color="#536173"
          metalness={0.9}
          roughness={0.2}
          emissive="#14283b"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 0, 1.02]}>
        <circleGeometry args={[0.68, 48]} />
        <meshBasicMaterial color="#06131d" />
      </mesh>
      <mesh position={[0, 0, 1.04]}>
        <ringGeometry args={[0.47, 0.52, 32]} />
        <meshBasicMaterial color={signalColor} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 1.08]}>
        <circleGeometry args={[0.27, 32]} />
        <meshBasicMaterial color={signalColor} transparent opacity={0.16} toneMapped={false} />
      </mesh>
      {[-0.56, -0.18, 0.2, 0.58].map((x) => (
        <mesh key={x} position={[x, 1.43, 0]}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial color={signalColor} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.035, 10, 96]} />
        <meshBasicMaterial color="#65dff5" transparent opacity={0.72} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0.3, 0]}>
        <torusGeometry args={[1.82, 0.018, 8, 96]} />
        <meshBasicMaterial color="#8d7dff" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <SolarWing position={[-2.65, 0.06, 0]} rotation={[0, 0, 0.08]} />
      <SolarWing position={[2.65, 0.06, 0]} rotation={[0, 0, -0.08]} />
      <mesh position={[0, 1.82, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.15, 12]} />
        <meshStandardMaterial color="#8b99a9" metalness={0.88} roughness={0.24} />
      </mesh>
      <mesh position={[0, 2.44, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.48, 0.24, 24]} />
        <meshStandardMaterial color="#aebbc8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh ref={beacon} position={[0, 2.72, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshBasicMaterial color={signalColor} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 1.5]} color={signalColor} intensity={signalStrength * 3.6} distance={5} />
      <pointLight position={[0, 2.6, 0]} color="#a78bfa" intensity={engaged ? 3 : 1.5} distance={6} />
    </group>
  );
}

function Planet() {
  return (
    <group position={[4.5, -2.4, -4.5]}>
      <mesh castShadow rotation={[0.15, 0.45, 0.1]}>
        <sphereGeometry args={[2.15, 48, 48]} />
        <meshStandardMaterial
          color="#162c43"
          emissive="#0a2337"
          emissiveIntensity={0.42}
          metalness={0.14}
          roughness={0.68}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0.2]}>
        <torusGeometry args={[2.75, 0.018, 8, 96]} />
        <meshBasicMaterial color="#6edaf0" transparent opacity={0.32} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, -0.25]}>
        <torusGeometry args={[3.15, 0.012, 8, 96]} />
        <meshBasicMaterial color="#8d7dff" transparent opacity={0.22} toneMapped={false} />
      </mesh>
    </group>
  );
}

type MissionHotspotProps = {
  slug: string;
  title: string;
  color: string;
  position: [number, number, number];
  active: boolean;
  onSelect: () => void;
};

const HOTSPOT_POSITIONS: [number, number, number][] = [
  [-2.45, 2.55, 0.9],
  [0.15, 3.15, 0.1],
  [3.15, 1.45, -0.3],
  [-1.05, -1.95, 1.25],
  [2.25, -1.65, -0.75],
  [4.25, 2.1, 1.1],
];

function MissionHotspot({ slug, title, color, position, active, onSelect }: MissionHotspotProps) {
  const pulse = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!pulse.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 2.2 + position[0]) * (active ? 0.12 : 0.06);
    pulse.current.scale.setScalar(scale);
  });

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect();
  };

  return (
    <Float speed={1.1} floatIntensity={0.28} rotationIntensity={0.18}>
      <group position={position}>
        <mesh onClick={select} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = "auto"; }} name={title} userData={{ slug }}>
          <sphereGeometry args={[active ? 0.13 : 0.095, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 3.8 : 1.8} metalness={0.35} roughness={0.2} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[active ? 0.25 : 0.2, active ? 0.265 : 0.215, 24]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.8 : 0.3} toneMapped={false} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <ringGeometry args={[active ? 0.31 : 0.25, active ? 0.322 : 0.262, 24]} />
          <meshBasicMaterial color={active ? "#eefaff" : color} transparent opacity={active ? 0.56 : 0.12} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <boxGeometry args={[0.025, 0.22, 0.025]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.7 : 0.2} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <boxGeometry args={[0.12, 0.018, 0.018]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.65 : 0.16} />
        </mesh>
      </group>
    </Float>
  );
}

function MissionHotspots({ discovered, selectedMission, onSelectMission }: Pick<OrbitalSceneProps, "discovered" | "selectedMission" | "onSelectMission">) {
  return (
    <group>
      {projects.map((project, index) => (
        <MissionHotspot
          key={project.slug}
          slug={project.slug}
          title={project.title}
          color={project.color}
          position={HOTSPOT_POSITIONS[index]}
          active={selectedMission === project.slug || discovered.includes(project.slug)}
          onSelect={() => onSelectMission(project.slug)}
        />
      ))}
    </group>
  );
}

function DataShards() {
  const shards = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        x: -4.4 + ((index * 1.73) % 8.6),
        y: -2.1 + ((index * 1.19) % 4.2),
        z: -1.8 + ((index * 0.83) % 4.5),
        size: 0.06 + (index % 4) * 0.025,
        color: index % 3 === 0 ? "#8d7dff" : "#67e8f9",
      })),
    [],
  );

  return (
    <group>
      {shards.map((shard, index) => (
        <group key={index} position={[shard.x, shard.y, shard.z]}>
          <mesh rotation={[index * 0.31, index * 0.17, index * 0.11]}>
            <octahedronGeometry args={[shard.size, 0]} />
            <meshStandardMaterial
              color={shard.color}
              emissive={shard.color}
              emissiveIntensity={1.6}
              metalness={0.2}
              roughness={0.22}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[shard.size * 1.8, shard.size * 1.84, 20]} />
            <meshBasicMaterial color={shard.color} transparent opacity={0.28} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OrbitalLines() {
  return (
    <group position={[1.4, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[3.3, 0.012, 6, 128]} />
        <meshBasicMaterial color="#8d7dff" transparent opacity={0.18} />
      </mesh>
      <mesh rotation={[0.1, 0.08, 0.25]}>
        <torusGeometry args={[4.2, 0.008, 6, 128]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

export default function OrbitalScene({ engaged, discoveredCount, discovered, selectedMission, onSelectMission }: OrbitalSceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.45, 10], fov: 42, near: 0.1, far: 100 }}
    >
      <color attach="background" args={["#05080d"]} />
      <fog attach="fog" args={["#05080d", 11, 27]} />
      <ambientLight intensity={0.3} color="#a8c9e8" />
      <hemisphereLight args={["#a9dfff", "#101522", 0.7]} />
      <directionalLight position={[4, 7, 8]} intensity={2.2} color="#d6efff" castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 1, -4]} intensity={1.4} color="#7567ff" />
      <pointLight position={[1.4, 2.2, 3]} intensity={engaged ? 7 : 4} distance={12} color="#5fe4ff" />
      <Stars radius={65} depth={42} count={1700} factor={1.8} fade speed={engaged ? 0.6 : 0.22} />
      <Sparkles count={engaged ? 130 : 75} scale={[13, 8, 10]} size={1.4} speed={0.22} color="#9be8ff" position={[0, 1, 0]} />
      <OrbitalLines />
      <Planet />
      <DataShards />
      <MissionHotspots discovered={discovered} selectedMission={selectedMission} onSelectMission={onSelectMission} />
      <Station engaged={engaged} discoveredCount={discoveredCount} selectedMission={selectedMission} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        autoRotate={!engaged}
        autoRotateSpeed={0.35}
        minPolarAngle={Math.PI / 2.8}
        maxPolarAngle={Math.PI / 1.65}
      />
    </Canvas>
  );
}
