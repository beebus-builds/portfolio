"use client";

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioManager } from '@/lib/audio';
import { GAME } from '@/lib/config';

export default function Spaceship({
  shipX,
  gameState,
}: {
  shipX: React.MutableRefObject<THREE.Vector3>;
  gameState: 'menu' | 'playing' | 'orbit' | 'gameover';
}) {
  const shipRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);
  const keys = useRef<Set<string>>(new Set());
  const tilt = useRef(0);

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
    let dir = 0;
    if (keys.current.has('a') || keys.current.has('arrowleft')) dir -= 1;
    if (keys.current.has('d') || keys.current.has('arrowright')) dir += 1;

    if (gameState === 'playing') {
      // Manual steer during running phase
      shipX.current.x += dir * GAME.SHIP_SENSITIVITY * delta;
      shipX.current.x = THREE.MathUtils.clamp(shipX.current.x, -GAME.SHIP_BOUNDS, GAME.SHIP_BOUNDS);
      tilt.current = THREE.MathUtils.lerp(tilt.current, -dir * GAME.SHIP_TILT_FACTOR, delta * 8);

      if (shipRef.current) {
        shipRef.current.position.set(shipX.current.x, 0, 0);
        shipRef.current.rotation.set(0, 0, tilt.current);
      }

      // Smooth camera chase
      const camTarget = new THREE.Vector3(
        shipX.current.x * GAME.SHIP_CAMERA_OFFSET.x,
        GAME.SHIP_CAMERA_OFFSET.y,
        GAME.SHIP_CAMERA_OFFSET.z
      );
      state.camera.position.lerp(camTarget, GAME.CAMERA_LERP_SPEED);
      state.camera.lookAt(shipX.current.x * GAME.SHIP_CAMERA_LOOKAHEAD.x, 0, GAME.SHIP_CAMERA_LOOKAHEAD.z);

      if (thrusterRef.current) {
        thrusterRef.current.scale.set(1.5, 1.5, 3 + Math.sin(state.clock.elapsedTime * 20) * 0.5);
      }
      if (dir !== 0) audioManager.playThruster(0.3);

    } else if (gameState === 'orbit' || gameState === 'menu') {
      // Passive float near center
      shipX.current.x = THREE.MathUtils.lerp(shipX.current.x, 0, delta * 3);
      tilt.current = THREE.MathUtils.lerp(tilt.current, 0, delta * 3);
      
      const floatY = Math.sin(state.clock.elapsedTime * GAME.SHIP_ORBIT_FLOAT_SPEED) * GAME.SHIP_ORBIT_FLOAT_AMPLITUDE;

      if (shipRef.current) {
        shipRef.current.position.set(shipX.current.x, floatY, 0);
        shipRef.current.rotation.set(0, 0, tilt.current);
      }

      const camTarget = new THREE.Vector3(
        GAME.ORBIT_CAMERA_POSITION.x,
        GAME.ORBIT_CAMERA_POSITION.y,
        GAME.ORBIT_CAMERA_POSITION.z
      );
      state.camera.position.lerp(camTarget, GAME.ORBIT_CAMERA_LERP_SPEED);
      state.camera.lookAt(0, 0, -2);
    }
  });

  return (
    <group ref={shipRef}>
      {/* Premium Metallic Spaceship */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.2, 1.2, 4]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          metalness={1} 
          roughness={0.05} 
          clearcoat={1} 
          clearcoatRoughness={0} 
        />
      </mesh>
      {/* Ship Wings */}
      <mesh position={[0, -0.05, 0.2]} rotation={[0, 0, Math.PI]}>
        <boxGeometry args={[1.5, 0.03, 0.5]} />
        <meshPhysicalMaterial color="#6366f1" metalness={1} roughness={0.1} />
      </mesh>
      {/* High-tech Cockpit */}
      <mesh position={[0, 0.12, -0.1]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshPhysicalMaterial color="#00ffff" transparent opacity={0.6} roughness={0} />
      </mesh>
      {/* Hyper-drive engine flame */}
      <mesh ref={thrusterRef} position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0, 0.4, 8]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.9} />
      </mesh>
      <pointLight intensity={3} distance={5} color="#3b82f6" position={[0, 0, -1]} />
    </group>
  );
}
