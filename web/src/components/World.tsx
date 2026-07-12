"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Particles from './Particles';

const zones: { id: string; position: [number, number, number]; color: string; label: string }[] = [
  { id: 'about', position: [-7, 0, -6], color: '#a855f7', label: 'CORE_MEMORIES' },
  { id: 'projects', position: [7, 0, -6], color: '#6366f1', label: 'DATA_Spires' },
  { id: 'contact', position: [0, 0, 7], color: '#ec4899', label: 'LINK_SATELLITE' },
];

function MirrorGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial 
        color="#020203" 
        roughness={0.05} 
        metalness={1} 
        envMapIntensity={1}
      />
    </mesh>
  );
}

function Spire({ position, color, label, index }: { position: [number, number, number]; color: string; label: string; index: number }) {
  const spireRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (spireRef.current) {
      spireRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={position}>
      {/* The Spire Monolith */}
      <mesh ref={spireRef} position={[0, 2, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 4, 6]} />
        <meshStandardMaterial 
          color="#0a0a0b" 
          emissive={new THREE.Color(color)} 
          emissiveIntensity={0.2} 
          roughness={0} 
          metalness={1} 
        />
      </mesh>
      
      {/* Energy Ring at top */}
      <mesh ref={ringRef} position={[0, 4, 0]}>
        <torusGeometry args={[0.6, 0.05, 16, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* Base Glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Floating Label */}
      <Text
        position={[0, 4.8, 0]}
        color={color}
        fontSize={0.3}
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
    return Array.from({ length: 20 }, () => ({
      pos: [ (Math.random() - 0.5) * 30, Math.random() * 10 + 2, (Math.random() - 0.5) * 30 ],
      rot: [ Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI ],
      scale: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  return (
    <group>
      {shards.map((s, i) => (
        <mesh key={i} position={s.pos as [number, number, number]} rotation={s.rot as [number, number, number]} scale={s.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#0a0a0b" roughness={0} metalness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Nebula() {
  return (
    <group>
      <mesh position={[-15, 5, -15]}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.05} />
      </mesh>
      <mesh position={[15, 8, -10]}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.05} />
      </mesh>
      <mesh position={[0, 2, -20]}>
        <sphereGeometry args={[20, 32, 32]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.03} />
      </mesh>
    </group>
  );
}

export default function World({ activeZone }: { activeZone: string | null }) {
  return (
    <group>
      <Particles />
      <Nebula />
      <FloatingShards />
      <MirrorGround />
      {zones.map((zone, i) => (
        <Spire 
          key={zone.id} 
          position={zone.position} 
          color={zone.color} 
          label={zone.label} 
          index={i} 
        />
      ))}
    </group>
  );
}
