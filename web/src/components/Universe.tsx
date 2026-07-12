"use client";

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars, Float, Text } from '@react-three/drei';
import * as THREE from 'three';

const sectors = [
  { id: 'about', position: [-20, 0, -30], color: '#a855f7', label: 'S-1: THE_CORE' },
  { id: 'projects', position: [20, 0, -30], color: '#6366f1', label: 'S-2: THE_FORGE' },
  { id: 'contact', position: [0, 0, 30], color: '#ec4899', label: 'S-3: THE_BEACON' },
];

function Nebula({ color, position }: { color: string; position: [number, number, number] }) {
  return (
    <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={position}>
        <sphereGeometry args={[10, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} blending={THREE.AdditiveBlending} />
      </mesh>
    </Float>
  );
}

function Sector({ position, color, label, index }: { position: [number, number, number]; color: string; label: string; index: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.005;
    }
  });

  return (
    <group position={position} ref={ref}>
      {/* Central Hub */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#050506" emissive={new THREE.Color(color)} emissiveIntensity={0.5} roughness={0} metalness={1} />
      </mesh>
      
      {/* Orbital Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4, 0.05, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* Satellite Nodes */}
      {[0, 1, 2].map(i => (
        <mesh position={[Math.cos(i * (Math.PI * 2 / 3)) * 4, Math.sin(i * (Math.PI * 2 / 3)) * 4, 0]} rotation={[0, 0, Math.PI/2]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={color} emissive={new THREE.Color(color)} emissiveIntensity={1} />
        </mesh>
      ))}

      <Text
        position={[0, 6, 0]}
        color={color}
        fontSize={1.5}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.8}
      >
        {label}
      </Text>
    </group>
  );
}

export default function Universe({ activeZone }: { activeZone: string | null }) {
  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Background Nebulas */}
      <Nebula color="#4f46e5" position={[-20, 0, -40]} />
      <Nebula color="#8b5cf6" position={[20, 10, -30]} />
      <Nebula color="#ec4899" position={[0, -10, 20]} />

      {sectors.map((sector, i) => (
        <Sector 
          key={sector.id} 
          position={sector.position} 
          color={sector.color} 
          label={sector.label} 
          index={i} 
        />
      ))}
      
      {/* Ambient cosmic dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position" 
            count={1000} 
            array={new Float32Array(1000 * 3).map(() => (Math.random() - 0.5) * 100)} 
            itemSize={3} 
          />
        </bufferGeometry>
        <pointsMaterial size={0.1} color="#ffffff" transparent opacity={0.2} />
      </points>
    </group>
  );
}
