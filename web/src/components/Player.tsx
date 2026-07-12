"use client";

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SPEED = 4.5;
const BOUNDS = 9;

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
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
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
      if (dist < 2.5) {
        found = zone.id;
        break;
      }
    }
    if (found !== lastZone.current) {
      lastZone.current = found;
      onProximity(found);
    }

    if (moving) {
      bobPhase.current += delta * 8;
      if (bodyRef.current) {
        bodyRef.current.position.y = 0.1 + Math.abs(Math.sin(bobPhase.current)) * 0.12;
      }
      if (headRef.current) {
        headRef.current.position.y = 0.75 + Math.abs(Math.sin(bobPhase.current)) * 0.1;
      }
      if (groupRef.current) {
        groupRef.current.rotation.y += dir.x * delta * 3;
      }
    } else {
      if (bodyRef.current) {
        bodyRef.current.position.y += (0.1 - bodyRef.current.position.y) * 0.1;
      }
      if (headRef.current) {
        headRef.current.position.y += (0.75 - headRef.current.position.y) * 0.1;
      }
    }

    const camTarget = new THREE.Vector3(
      position.current.x * 0.3 + 6,
      10,
      position.current.z * 0.3 + 8
    );
    state.camera.position.lerp(camTarget, 0.03);
    state.camera.lookAt(position.current.x, 0, position.current.z);
  });

  return (
    <group ref={groupRef}>
      {/* Dynamic light following player */}
      <pointLight intensity={1.5} distance={5} color="#6366f1" position={[0, 1, 0]} />
      
      <mesh ref={bodyRef} position={[0, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.4]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh ref={headRef} position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#818cf8" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
