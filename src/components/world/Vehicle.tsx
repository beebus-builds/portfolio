"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DriveInput } from "@/hooks/useDriveInput";

export interface VehicleState {
  position: THREE.Vector3;
  heading: number;
  speed: number;
}

export default function Vehicle({
  input,
  state,
}: {
  input: { current: DriveInput };
  state: { current: VehicleState };
}) {
  const group = useRef<THREE.Group>(null);
  const wheelRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    const i = input.current;
    const s = state.current;
    const accel = 9;
    const maxSpeed = 9;
    const maxReverse = 5;
    const friction = 4;
    const turnRate = 2.4;

    if (i.forward) s.speed = Math.min(maxSpeed, s.speed + accel * delta);
    else if (i.back) s.speed = Math.max(-maxReverse, s.speed - accel * delta);
    else {
      const drop = Math.min(Math.abs(s.speed), friction * delta);
      s.speed -= Math.sign(s.speed) * drop;
    }

    const turnInput = (i.left ? 1 : 0) - (i.right ? 1 : 0);
    if (Math.abs(s.speed) > 0.05) {
      s.heading += turnInput * turnRate * delta * Math.sign(s.speed);
    }

    s.position.x += Math.sin(s.heading) * s.speed * delta;
    s.position.z += Math.cos(s.heading) * s.speed * delta;

    const bound = 34;
    s.position.x = THREE.MathUtils.clamp(s.position.x, -bound, bound);
    s.position.z = THREE.MathUtils.clamp(s.position.z, -bound, bound);

    if (group.current) {
      group.current.position.set(s.position.x, 0, s.position.z);
      group.current.rotation.y = s.heading;
    }
    wheelRefs.current.forEach((w) => {
      if (w) w.rotation.x -= s.speed * delta * 3;
    });
  });

  const wheelPositions: [number, number, number][] = [
    [-0.55, 0.24, 0.65],
    [0.55, 0.24, 0.65],
    [-0.55, 0.24, -0.65],
    [0.55, 0.24, -0.65],
  ];

  return (
    <group ref={group}>
      <group position={[0, 0.42, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 0.5, 2]} />
          <meshStandardMaterial color="#12131a" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.36, -0.1]} castShadow>
          <boxGeometry args={[0.78, 0.36, 1]} />
          <meshStandardMaterial color="#1b1c26" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.08, -1.02]}>
          <boxGeometry args={[0.9, 0.2, 0.06]} />
          <meshStandardMaterial color="#8f7bff" emissive="#8f7bff" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.2, -1.6]} color="#8f7bff" intensity={3} distance={5} />
      </group>
      {wheelPositions.map((p, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            wheelRefs.current[idx] = el;
          }}
          position={p}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.26, 0.26, 0.22, 16]} />
          <meshStandardMaterial color="#050505" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}
