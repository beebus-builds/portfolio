"use client";

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { audioManager } from '@/lib/audio';

interface Planet {
  id: string;
  position: THREE.Vector3;
  label: string;
  color: string;
}

export default function Spaceship({
  targetPlanetId,
  planets,
  onArrival,
}: {
  targetPlanetId: string | null;
  planets: Planet[];
  onArrival: () => void;
}) {
  const shipRef = useRef<THREE.Group>(null);
  const thrusterRef = useRef<THREE.Mesh>(null);
  
  const startPos = useRef(new THREE.Vector3(0, 0, 0));
  const currentPos = useRef(new THREE.Vector3(0, 0, 0));
  const flightProgress = useRef(1); // 0 to 1
  const activeTargetId = useRef<string | null>(null);

  // For orbit animation
  const orbitAngle = useRef(0);

  useEffect(() => {
    if (targetPlanetId && targetPlanetId !== activeTargetId.current) {
      activeTargetId.current = targetPlanetId;
      startPos.current.copy(currentPos.current);
      flightProgress.current = 0;
      audioManager.playThruster(1);
    }
  }, [targetPlanetId]);

  useFrame((state, delta) => {
    const targetPlanet = planets.find(p => p.id === targetPlanetId);
    
    if (targetPlanet && flightProgress.current < 1) {
      // Autopilot flight / Warp
      flightProgress.current += delta * 0.5; // Flight takes ~2 seconds
      
      if (flightProgress.current >= 1) {
        flightProgress.current = 1;
        onArrival();
      }

      // Linear interpolation with Bezier arc for space curve
      const t = flightProgress.current;
      const easeT = t * t * (3 - 2 * t); // Smoothstep

      const targetPos = targetPlanet.position.clone();
      
      // Calculate a curved arc in space
      const midpoint = new THREE.Vector3().addVectors(startPos.current, targetPos).multiplyScalar(0.5);
      midpoint.y += startPos.current.distanceTo(targetPos) * 0.25; // Arches upwards

      // Quadratic Bezier curve formula: (1-t)^2 * p0 + 2(1-t)t * p1 + t^2 * p2
      const omt = 1 - easeT;
      const term0 = startPos.current.clone().multiplyScalar(omt * omt);
      const term1 = midpoint.multiplyScalar(2 * omt * easeT);
      const term2 = targetPos.multiplyScalar(easeT * easeT);
      
      currentPos.current.copy(term0).add(term1).add(term2);

      if (shipRef.current) {
        // Face the movement direction
        const lookTarget = targetPos.clone();
        shipRef.current.lookAt(lookTarget);
        shipRef.current.position.copy(currentPos.current);
      }

      // Thruster flare scaling during warp
      if (thrusterRef.current) {
        thrusterRef.current.scale.set(1.5, 1.5, 3 + Math.sin(state.clock.elapsedTime * 20) * 0.5);
      }

      // Camera: Cinematic warp angle (Chase)
      const offset = new THREE.Vector3(0, 2, 6).applyQuaternion(shipRef.current?.quaternion || new THREE.Quaternion());
      const camTarget = currentPos.current.clone().add(offset);
      state.camera.position.lerp(camTarget, 0.08);
      state.camera.lookAt(currentPos.current);

      // FOV Stretch on Warp speed
      const speedFactor = Math.sin(t * Math.PI); // Peakes in the middle
      const camera = state.camera as THREE.PerspectiveCamera;
      camera.fov = THREE.MathUtils.lerp(45, 75, speedFactor);
      camera.updateProjectionMatrix();

    } else if (targetPlanet) {
      // Stable Orbit upon arrival
      orbitAngle.current += delta * 0.3;
      const orbitRadius = 4;
      
      const orbitPos = new THREE.Vector3(
        targetPlanet.position.x + Math.cos(orbitAngle.current) * orbitRadius,
        targetPlanet.position.y + 0.5,
        targetPlanet.position.z + Math.sin(orbitAngle.current) * orbitRadius
      );
      
      currentPos.current.copy(orbitPos);

      if (shipRef.current) {
        shipRef.current.position.copy(orbitPos);
        // Face the direction of the orbit tangentially
        const tangent = new THREE.Vector3(
          -Math.sin(orbitAngle.current),
          0,
          Math.cos(orbitAngle.current)
        ).add(orbitPos);
        shipRef.current.lookAt(tangent);
      }

      if (thrusterRef.current) {
        thrusterRef.current.scale.set(1, 1, 1);
      }

      // Camera: Smooth Cinematic Orbit camera
      const camOffset = new THREE.Vector3(
        Math.cos(orbitAngle.current + 0.5) * 6,
        2.5,
        Math.sin(orbitAngle.current + 0.5) * 6
      );
      const camTarget = targetPlanet.position.clone().add(camOffset);
      state.camera.position.lerp(camTarget, 0.05);
      state.camera.lookAt(targetPlanet.position);
    } else {
      // Initial state: Float near center
      orbitAngle.current += delta * 0.1;
      currentPos.current.set(Math.cos(orbitAngle.current) * 2, 1, Math.sin(orbitAngle.current) * 2);
      if (shipRef.current) {
        shipRef.current.position.copy(currentPos.current);
        shipRef.current.rotation.y += delta * 0.1;
      }
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
