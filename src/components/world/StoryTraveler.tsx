"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef } from "react";
import type { DriveInput } from "@/hooks/useDriveInput";
import type { VehicleState } from "./Vehicle";

export default function StoryTraveler({ input, state }: { input: { current: DriveInput }; state: { current: VehicleState } }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const velocity = useRef(0);
  const step = useRef(0);

  useFrame((_, delta) => {
    const i = input.current;
    const moving = i.forward || i.back || i.left || i.right;
    const direction = i.forward ? 1 : i.back ? -0.65 : 0;
    velocity.current = THREE.MathUtils.damp(velocity.current, direction * 2.25, 5, delta);

    if (i.left) state.current.heading += 1.7 * delta;
    if (i.right) state.current.heading -= 1.7 * delta;
    const heading = state.current.heading;

    state.current.position.x += Math.sin(heading) * velocity.current * delta;
    state.current.position.z += Math.cos(heading) * velocity.current * delta;
    state.current.position.x = THREE.MathUtils.clamp(state.current.position.x, -8.5, 8.5);
    state.current.position.z = THREE.MathUtils.clamp(state.current.position.z, -32, 31);
    state.current.speed = Math.abs(velocity.current);

    if (moving) step.current += delta * 9;
    if (group.current) {
      group.current.position.copy(state.current.position);
      group.current.rotation.y = heading;
      group.current.position.y = 0.02 + (moving ? Math.abs(Math.sin(step.current)) * 0.035 : 0);
    }
    if (body.current) body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, moving ? Math.sin(step.current) * 0.045 : 0, 8, delta);
    if (leftLeg.current) leftLeg.current.rotation.x = moving ? Math.sin(step.current) * 0.35 : 0;
    if (rightLeg.current) rightLeg.current.rotation.x = moving ? -Math.sin(step.current) * 0.35 : 0;
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(performance.now() * 0.005) * 0.1);
  });

  return (
    <group ref={group}>
      <group ref={body}>
        <mesh castShadow position={[0, 1.28, 0]}>
          <capsuleGeometry args={[0.3, 0.72, 8, 14]} />
          <meshStandardMaterial color="#eeeaff" emissive="#6d5bff" emissiveIntensity={0.55} roughness={0.3} metalness={0.25} />
        </mesh>
        <mesh position={[0, 1.9, 0]}>
          <sphereGeometry args={[0.23, 16, 16]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <group ref={leftLeg} position={[-0.14, 0.75, 0]}>
          <mesh position={[0, -0.38, 0]}>
            <capsuleGeometry args={[0.09, 0.58, 6, 10]} />
            <meshStandardMaterial color="#aaa5c7" emissive="#322b65" emissiveIntensity={0.5} />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.14, 0.75, 0]}>
          <mesh position={[0, -0.38, 0]}>
            <capsuleGeometry args={[0.09, 0.58, 6, 10]} />
            <meshStandardMaterial color="#aaa5c7" emissive="#322b65" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>
      <mesh ref={glow} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.6, 32]} />
        <meshBasicMaterial color="#6d5bff" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 1.1, 0]} color="#6d5bff" intensity={2.5} distance={5} />
    </group>
  );
}
