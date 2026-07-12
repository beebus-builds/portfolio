"use client";

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioManager } from '@/lib/audio';

const ACCEL = 20;
const FRICTION = 0.98;
const ROT_SPEED = 2.5;
const MAX_SPEED = 15;

interface Zone {
  id: string;
  position: THREE.Vector3;
  label: string;
  color: string;
}

export default function Spaceship({
  position,
  velocity,
  zones,
  onProximity,
}: {
  position: React.MutableRefObject<THREE.Vector3>;
  velocity: React.MutableRefObject<THREE.Vector3>;
  zones: Zone[];
  onProximity: (zoneId: string | null) => void;
}) {
  const shipRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);
  const keys = useRef<Set<string>>(new Set());
  const lastZone = useRef<string | null>(null);

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
    const moveDir = new THREE.Vector3();
    if (keys.current.has('w') || keys.current.has('arrowup')) moveDir.z -= 1;
    if (keys.current.has('s') || keys.current.has('arrowdown')) moveDir.z += 1;
    if (keys.current.has('a') || keys.current.has('arrowleft')) moveDir.x -= 1;
    if (keys.current.has('d') || keys.current.has('arrowright')) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      
      // Apply acceleration
      velocity.current.x += moveDir.x * ACCEL * delta;
      velocity.current.z += moveDir.z * ACCEL * delta;
      
      // Rotate ship to face direction of movement
      const targetRot = Math.atan2(moveDir.x, -moveDir.z);
      if (shipRef.current) {
        shipRef.current.rotation.y = THREE.MathUtils.lerp(
          shipRef.current.rotation.y,
          targetRot,
          delta * ROT_SPEED
        );
      }
      
      // Thruster effect
      if (thrusterRef.current) {
        thrusterRef.current.scale.setScalar(1 + Math.random() * 0.3);
      }
      audioManager.playThruster(0.5);
    } else {
      if (thrusterRef.current) {
        thrusterRef.current.scale.setScalar(1);
      }
    }

    // Apply friction and speed limit
    velocity.current.multiplyScalar(FRICTION);
    if (velocity.current.length() > MAX_SPEED) {
      velocity.current.setLength(MAX_SPEED);
    }

    // Update position
    position.current.add(velocity.current.clone().multiplyScalar(delta));

    if (shipRef.current) {
      shipRef.current.position.copy(position.current);
    }

    // Proximity check
    let found: string | null = null;
    for (const zone of zones) {
      if (position.current.distanceTo(zone.position) < 5) {
        found = zone.id;
        break;
      }
    }
    if (found !== lastZone.current) {
      lastZone.current = found;
      onProximity(found);
    }

    // Camera follow
    const camOffset = new THREE.Vector3(0, 4, 8);
    camOffset.applyQuaternion(shipRef.current?.quaternion || new THREE.Quaternion());
    const camTarget = position.current.clone().add(camOffset);
    state.camera.position.lerp(camTarget, 0.05);
    state.camera.lookAt(position.current);
    
    // Dynamic FOV based on speed
    const speed = velocity.current.length();
    state.camera.fov = THREE.MathUtils.lerp(40, 60, speed / MAX_SPEED);
    state.camera.updateProjectionMatrix();
  });

  return (
    <group ref={shipRef}>
      {/* Ship Body */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.3, 1.2, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={1} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0, 0.2]} rotation={[0, 0, Math.PI]}>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshStandardMaterial color="#6366f1" roughness={0.1} metalness={1} />
      </mesh>
      {/* Cockpit */}
      <mesh position={[0, 0.2, -0.1]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ffff" transparent opacity={0.6} roughness={0} />
      </mesh>
      {/* Thruster Flame */}
      <mesh ref={thrusterRef} position={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.1, 0, 0.4, 8]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.8} />
      </mesh>
      {/* Ship Light */}
      <pointLight intensity={2} distance={4} color="#6366f1" position={[0, 0, -1]} />
    </group>
  );
}
