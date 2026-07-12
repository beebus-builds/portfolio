"use client";

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const zones: { id: string; position: [number, number, number]; color: string; label: string }[] = [
  { id: 'about', position: [-6, 0, -5], color: '#8b5cf6', label: 'About Me' },
  { id: 'projects', position: [6, 0, -5], color: '#4f46e5', label: 'Projects' },
  { id: 'contact', position: [0, 0, 6], color: '#ec4899', label: 'Contact' },
];

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[24, 24, 40, 40]} />
      <meshStandardMaterial color="#18181b" wireframe={false} roughness={0.9} />
    </mesh>
  );
}

function GridHelper() {
  return (
    <gridHelper args={[24, 24, '#27272a', '#18181b']} position={[0, 0, 0]} />
  );
}

function ZoneGlow({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05);
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={[position[0], 0.15, position[2]]}>
      <ringGeometry args={[1.4, 1.8, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ZonePlatform({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.5, 1.8, 0.3, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[1.2, 1.5, 0.1, 24]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} roughness={0.1} metalness={0.9} />
      </mesh>
      <ZoneGlow position={position} color={color} />
    </group>
  );
}

function ZoneBeam({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
    }
  });

  return (
    <mesh ref={ref} position={[position[0], 2.5, position[2]]}>
      <cylinderGeometry args={[0.03, 0.4, 5, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} />
    </mesh>
  );
}

function ZoneIcon({ position, color, index }: { position: [number, number, number]; color: string; index: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + 1.2 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.15;
      ref.current.rotation.y += 0.01;
    }
  });

  const iconColor = new THREE.Color(color);

  return (
    <group ref={ref} position={[position[0], position[1] + 1.2, position[2]]}>
      {index === 0 && (
        <>
          <mesh>
            <sphereGeometry args={[0.25, 12, 12]} />
            <meshStandardMaterial color={iconColor} emissive={iconColor} emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, -0.35, 0]}>
            <boxGeometry args={[0.15, 0.25, 0.1]} />
            <meshStandardMaterial color={iconColor} emissive={iconColor} emissiveIntensity={0.2} />
          </mesh>
        </>
      )}
      {index === 1 && (
        <mesh>
          <boxGeometry args={[0.3, 0.25, 0.15]} />
          <meshStandardMaterial color={iconColor} emissive={iconColor} emissiveIntensity={0.3} />
        </mesh>
      )}
      {index === 2 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.08, 8, 16]} />
          <meshStandardMaterial color={iconColor} emissive={iconColor} emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function ZoneLabel({ position, color, label }: { position: [number, number, number]; color: string; label: string }) {
  return (
    <Text
      position={[position[0], 0.8, position[2]]}
      color={color}
      fontSize={0.25}
      anchorX="center"
      anchorY="middle"
      fillOpacity={0.7}
    >
      {label}
    </Text>
  );
}

function BoundaryWalls() {
  const wallColor = '#18181b';
  return (
    <group>
      {[[0, 2, -10.5], [0, 2, 10.5], [-10.5, 2, 0], [10.5, 2, 0]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[i < 2 ? 22 : 0.5, 4, i >= 2 ? 22 : 0.5]} />
          <meshStandardMaterial color={wallColor} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function World({ activeZone }: { activeZone: string | null }) {
  const ringRefs = useRef<THREE.Mesh[]>([]);

  const ringData = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      x: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 20,
      scale: Math.random() * 0.5 + 0.1,
      speed: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  useFrame((state) => {
    ringRefs.current.forEach((ref, i) => {
      if (ref) {
        ref.position.y = -0.005 + Math.sin(state.clock.elapsedTime * ringData[i].speed + i) * 0.005;
      }
    });
  });

  return (
    <group>
      <Ground />
      <GridHelper />

      {ringData.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
          position={[d.x, -0.005, d.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[d.scale * 0.8, d.scale, 8]} />
          <meshBasicMaterial color="#27272a" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {zones.map((zone, i) => (
        <group key={zone.id}>
          <ZonePlatform position={zone.position} color={zone.color} />
          <ZoneBeam position={zone.position} color={zone.color} />
          <ZoneIcon position={zone.position} color={zone.color} index={i} />
          <ZoneLabel position={zone.position} color={zone.color} label={zone.label} />
          {activeZone === zone.id && (
            <mesh position={[zone.position[0], 0.05, zone.position[2]]}>
              <ringGeometry args={[1.9, 2.2, 32]} />
              <meshBasicMaterial color={zone.color} transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
          )}
        </group>
      ))}

      <BoundaryWalls />
    </group>
  );
}
