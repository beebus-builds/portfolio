"use client";

import { useRef, useLayoutEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const planets: { id: string; position: [number, number, number]; color: string; label: string; emissive: string }[] = [
  { id: 'about', position: [-25, 0, -25], color: '#a855f7', emissive: '#4a154b', label: 'S-1: CORE_MEMORIES' },
  { id: 'skills', position: [25, 0, -25], color: '#3b82f6', emissive: '#0c2340', label: 'S-2: TECH_LAB' },
  { id: 'experience', position: [30, 0, 15], color: '#10b981', emissive: '#0a3622', label: 'S-3: TEMPORAL_GRID' },
  { id: 'projects', position: [-30, 0, 15], color: '#6366f1', emissive: '#1d1b4c', label: 'S-4: THE_FORGE' },
  { id: 'contact', position: [0, 0, 35], color: '#ec4899', emissive: '#4c1d3c', label: 'S-5: SIGNAL_BEACON' },
];

function CentralStar() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05);
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[4.5, 32, 32]} />
      <meshBasicMaterial color="#ffffff" />
      <pointLight intensity={10} distance={150} color="#ffffff" />
    </mesh>
  );
}

function PlanetRings({ radius, color }: { radius: number; color: string }) {
  const ref = useRef<THREE.Points>(null);
  
  useLayoutEffect(() => {
    if (ref.current) {
      const count = 300;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.1;
        const dist = radius + (Math.random() - 0.5) * 1.5;
        positions[i * 3] = Math.cos(angle) * dist;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = Math.sin(angle) * dist;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      ref.current.geometry = geometry;
    }
  }, [radius]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003;
    }
  });

  return (
    <points ref={ref}>
      <pointsMaterial size={0.08} color={color} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function CustomPlanet({ id, position, color, label, emissive, index }: { id: string; position: [number, number, number]; color: string; label: string; emissive: string; index: number }) {
  const planetRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
    if (coreRef.current) {
      coreRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.15;
    }
  });

  const baseColor = new THREE.Color(color);
  const glowColor = new THREE.Color(emissive);

  return (
    <group position={position} ref={planetRef}>
      {/* Central Planet Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshPhysicalMaterial 
          color={baseColor} 
          emissive={glowColor}
          emissiveIntensity={1.5}
          roughness={0.15} 
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Decorative Orbits depending on target */}
      {id === 'projects' && <PlanetRings radius={5.5} color={color} />}
      {id === 'skills' && <PlanetRings radius={4.5} color={color} />}
      
      {id === 'contact' && (
        <mesh scale={1.22}>
          <sphereGeometry args={[2.5, 12, 12]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.12} />
        </mesh>
      )}

      {id === 'experience' && (
        <mesh rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[3.8, 0.02, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Atmosphere Envelope */}
      <mesh scale={1.04}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>

      {/* Floating Orbital Label */}
      <Text
        position={[0, 4.2, 0]}
        color={color}
        fontSize={1.2}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.8}
      >
        {label}
      </Text>
    </group>
  );
}

function FloatingShards() {
  const shards = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      pos: [ (Math.random() - 0.5) * 80, Math.random() * 25 + 2, (Math.random() - 0.5) * 80 ],
      rot: [ Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI ],
      scale: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  return (
    <group>
      {shards.map((s, i) => (
        <mesh key={i} position={s.pos as [number, number, number]} rotation={s.rot as [number, number, number]} scale={s.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial color="#050506" roughness={0} metalness={1} />
        </mesh>
      ))}
    </group>
  );
}

function CosmicDust() {
  const pointsRef = useRef<THREE.Points>(null);
  useLayoutEffect(() => {
    if (pointsRef.current) {
      const count = 4000;
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        pos[i] = (Math.random() - 0.5) * 160;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pointsRef.current.geometry = geometry;
    }
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00015;
    }
  });

  return (
    <points ref={pointsRef}>
      <pointsMaterial size={0.08} color="#ffffff" transparent opacity={0.15} />
    </points>
  );
}

export default function Universe() {
  return (
    <group>
      <Stars radius={120} depth={50} count={15000} factor={4} saturation={0} fade speed={1} />
      <CosmicDust />
      <CentralStar />
      <FloatingShards />
      {planets.map((planet, i) => (
        <CustomPlanet 
          key={planet.id} 
          id={planet.id}
          position={planet.position} 
          color={planet.color} 
          emissive={planet.emissive}
          label={planet.label} 
          index={i} 
        />
      ))}
    </group>
  );
}
