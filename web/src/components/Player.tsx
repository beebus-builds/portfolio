"use client";

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SPEED = 5;
const BOUNDS = 12;

interface Zone {
  id: string;
  position: THREE.Vector3;
  label: string;
  color: string;
}

export default function Player({
  position,
  zones,
  onProximity,
}: {
  position: React.MutableRefObject<THREE.Vector3>;
  zones: Zone[];
  onProximity: (zoneId: string | null) => void;
}) {
  const keys = useRef<Set<string>>(new Set());
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lastZone = useRef<string | null>(null);
  const bobPhase = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.current.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, delta) => {
    const dir = new THREE.Vector3();
    if (keys.current.has('w') || keys.current.has('arrowup')) dir.z -= 1;
    if (keys.current.has('s') || keys.current.has('arrowdown')) dir.z += 1;
    if (keys.current.has('a') || keys.current.has('arrowleft')) dir.x -= 1;
    if (keys.current.has('d') || keys.current.has('arrowright')) dir.x += 1;

    const moving = dir.lengthSq() > 0;
    if (moving) {
      dir.normalize();
      position.current.x += dir.x * SPEED * delta;
      position.current.z += dir.z * SPEED * delta;
    }

    position.current.x = Math.max(-BOUNDS, Math.min(BOUNDS, position.current.x));
    position.current.z = Math.max(-BOUNDS, Math.min(BOUNDS, position.current.z));

    if (groupRef.current) {
      groupRef.current.position.copy(position.current);
    }

    let found: string | null = null;
    for (const zone of zones) {
      const dist = position.current.distanceTo(zone.position);
      if (dist < 3) {
        found = zone.id;
        break;
      }
    }
    if (found !== lastZone.current) {
      lastZone.current = found;
      onProximity(found);
    }

    // Floating animation
    bobPhase.current += delta * 2;
    const bobY = 0.6 + Math.sin(bobPhase.current) * 0.1;
    
    if (groupRef.current) {
      groupRef.current.position.y = bobY;
    }

    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.5;
      ringRef.current.rotation.z += delta * 0.8;
    }

    // Camera smooth follow
    const camTarget = new THREE.Vector3(
      position.current.x * 0.4 + 7,
      11,
      position.current.z * 0.4 + 9
    );
    state.camera.position.lerp(camTarget, 0.04);
    state.camera.lookAt(position.current.x, 0.6, position.current.z);
  });

  return (
    <group ref={groupRef}>
      {/* The Aura Light */}
      <pointLight intensity={2} distance={6} color="#6366f1" position={[0, 0, 0]} />
      
      {/* Inner Core: Crystalline Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#6366f1" 
          emissiveIntensity={2} 
          roughness={0} 
          metalness={1} 
        />
      </mesh>

      {/* Outer Ring: Kinetic Orbit */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.4, 0.03, 16, 64]} />
        <meshStandardMaterial 
          color="#818cf8" 
          emissive="#818cf8" 
          emissiveIntensity={1} 
          roughness={0} 
          metalness={1} 
        />
      </mesh>

      {/* Base Shadow/Glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}
