"use client";

import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useRef } from "react";
import type { DriveInput } from "@/hooks/useDriveInput";
import type { VehicleState } from "./Vehicle";

export default function StoryTraveler({ input, state }: { input: { current: DriveInput }; state: { current: VehicleState } }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const velocity = useRef(0);
  const lateral = useRef(0);

  useFrame((_, delta) => {
    const i = input.current;
    const moving = i.forward || i.back;
    const direction = i.forward ? 1 : i.back ? -0.55 : 0;
    velocity.current = THREE.MathUtils.damp(velocity.current, direction * 2.9, 4.5, delta);
    lateral.current = THREE.MathUtils.damp(lateral.current, (i.right ? 1 : 0) - (i.left ? 1 : 0), 7, delta);
    state.current.heading = THREE.MathUtils.damp(state.current.heading, state.current.heading - lateral.current * 0.8 * delta, 5, delta);
    const heading = state.current.heading;
    state.current.position.x += Math.sin(heading) * velocity.current * delta;
    state.current.position.z += Math.cos(heading) * velocity.current * delta;
    state.current.position.x = THREE.MathUtils.clamp(state.current.position.x, -8, 8);
    state.current.position.z = THREE.MathUtils.clamp(state.current.position.z, -31, 31);
    state.current.speed = Math.abs(velocity.current);

    if (group.current) {
      group.current.position.copy(state.current.position);
      group.current.rotation.y = heading;
      group.current.position.y = 0.1 + Math.sin(performance.now() * 0.004) * 0.035;
      group.current.scale.y = THREE.MathUtils.damp(group.current.scale.y, moving ? 1.04 : 1, 8, delta);
    }
    if (glow.current) {
      const s = 1 + Math.sin(performance.now() * 0.006) * 0.12;
      glow.current.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      <Float speed={2.2} rotationIntensity={0.15} floatIntensity={0.35}>
        <mesh castShadow position={[0, 1.05, 0]}>
          <capsuleGeometry args={[0.42, 0.85, 8, 16]} />
          <meshStandardMaterial color="#f3f0ff" emissive="#6d5bff" emissiveIntensity={0.45} roughness={0.28} metalness={0.35} />
        </mesh>
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.2, 20, 20]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh ref={glow} position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.64, 32]} />
          <meshBasicMaterial color="#6d5bff" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      <pointLight position={[0, 1, 0]} color="#6d5bff" intensity={3} distance={5} />
    </group>
  );
}
