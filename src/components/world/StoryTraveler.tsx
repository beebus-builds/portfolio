"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import type { DriveInput } from "@/hooks/useDriveInput";
import type { VehicleState } from "./Vehicle";

const CLOAK = "#1b1545";
const CLOAK_DARK = "#100c2c";
const TRIM = "#54e6d4";
const EYE = "#9df3ff";
const CRYSTAL = "#8f7bff";

export default function StoryTraveler({ input, state }: { input: { current: DriveInput }; state: { current: VehicleState } }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const cloak = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const scarf1 = useRef<THREE.Group>(null);
  const scarf2 = useRef<THREE.Group>(null);
  const scarf3 = useRef<THREE.Group>(null);
  const crystal = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const velocity = useRef(0);
  const step = useRef(0);

  // Bell-shaped cloak silhouette
  const cloakGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.03, 1.52),
      new THREE.Vector2(0.17, 1.47),
      new THREE.Vector2(0.21, 1.2),
      new THREE.Vector2(0.28, 0.85),
      new THREE.Vector2(0.37, 0.45),
      new THREE.Vector2(0.43, 0.18),
    ];
    return new THREE.LatheGeometry(pts, 20);
  }, []);

  // Scarf planes pivot at their top edge so they wave naturally
  const scarfGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.17, 0.3, 1, 3);
    g.translate(0, -0.15, 0);
    return g;
  }, []);

  useFrame((scene, delta) => {
    const t = scene.clock.elapsedTime;
    const i = input.current;
    const moving = i.forward || i.back || i.left || i.right;
    const direction = i.forward ? 1 : i.back ? -0.65 : 0;
    velocity.current = THREE.MathUtils.damp(velocity.current, direction * 2.4, 5, delta);

    if (i.left) state.current.heading += 1.7 * delta;
    if (i.right) state.current.heading -= 1.7 * delta;
    const heading = state.current.heading;

    state.current.position.x += Math.sin(heading) * velocity.current * delta;
    state.current.position.z += Math.cos(heading) * velocity.current * delta;
    state.current.position.x = THREE.MathUtils.clamp(state.current.position.x, -8.5, 8.5);
    state.current.position.z = THREE.MathUtils.clamp(state.current.position.z, -32, 31);
    state.current.speed = Math.abs(velocity.current);
    const speedMix = Math.min(1, Math.abs(velocity.current) / 2.4);

    if (moving) step.current += delta * (6 + 4 * speedMix);
    const swing = moving ? Math.sin(step.current) : 0;
    const idle = Math.sin(t * 1.8);

    if (group.current) {
      group.current.position.copy(state.current.position);
      group.current.rotation.y = heading;
      group.current.position.y = 0.02 + (moving ? Math.abs(Math.sin(step.current)) * 0.05 * speedMix : idle * 0.008);
    }
    if (body.current) {
      // Lean into motion, breathe at rest
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, speedMix * 0.1, 6, delta);
      body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, moving ? Math.sin(step.current) * 0.03 : idle * 0.008, 8, delta);
      const breathe = moving ? 1 : 1 + idle * 0.006;
      body.current.scale.set(1, breathe, 1);
    }
    if (cloak.current) {
      cloak.current.rotation.y = Math.sin(t * 0.9) * 0.05 + (moving ? Math.sin(step.current) * 0.04 : 0);
    }
    // Walk cycle: legs + counter-swinging arms
    if (leftLeg.current) leftLeg.current.rotation.x = swing * 0.55 * speedMix;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing * 0.55 * speedMix;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.42 * speedMix + (moving ? 0 : idle * 0.03);
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.42 * speedMix + (moving ? 0 : -idle * 0.03);
    // Scarf trails behind, waves harder with speed
    const wave = 0.5 + speedMix * 0.9;
    if (scarf1.current) scarf1.current.rotation.x = -0.5 - speedMix * 0.5 + Math.sin(t * 3.1) * 0.16 * wave;
    if (scarf2.current) scarf2.current.rotation.x = Math.sin(t * 3.1 - 0.8) * 0.28 * wave;
    if (scarf3.current) scarf3.current.rotation.x = Math.sin(t * 3.1 - 1.6) * 0.34 * wave;
    // Staff crystal pulse
    if (crystal.current) crystal.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12);
    if (light.current) light.current.intensity = 3 + Math.sin(t * 2.4) * 0.7;
  });

  return (
    <group ref={group}>
      {/* Soft blob shadow + presence ring */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.56, 32]} />
        <meshBasicMaterial color={TRIM} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <group ref={body}>
        {/* Cloak */}
        <mesh ref={cloak} geometry={cloakGeo} castShadow>
          <meshStandardMaterial color={CLOAK} roughness={0.55} metalness={0.15} emissive="#241b6e" emissiveIntensity={0.5} flatShading />
        </mesh>
        {/* Hem trim */}
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[0.425, 0.022, 8, 32]} />
          <meshStandardMaterial color={TRIM} emissive={TRIM} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        {/* Chest core */}
        <mesh position={[0, 1.12, 0.2]}>
          <octahedronGeometry args={[0.07, 0]} />
          <meshStandardMaterial color={CRYSTAL} emissive={CRYSTAL} emissiveIntensity={2.4} toneMapped={false} />
        </mesh>

        {/* Hood */}
        <mesh position={[0, 1.6, -0.03]} scale={[1, 1.18, 1.05]} castShadow>
          <sphereGeometry args={[0.24, 18, 14]} />
          <meshStandardMaterial color={CLOAK_DARK} roughness={0.6} emissive="#1c1450" emissiveIntensity={0.5} flatShading />
        </mesh>
        {/* Shadowed face + glowing eyes */}
        <mesh position={[0, 1.56, 0.13]}>
          <sphereGeometry args={[0.155, 16, 12]} />
          <meshBasicMaterial color="#050510" />
        </mesh>
        {[-0.062, 0.062].map((x) => (
          <mesh key={x} position={[x, 1.585, 0.26]}>
            <sphereGeometry args={[0.03, 10, 10]} />
            <meshBasicMaterial color={EYE} toneMapped={false} />
          </mesh>
        ))}

        {/* Arms */}
        {([
          { ref: leftArm, x: -0.26 },
          { ref: rightArm, x: 0.26 },
        ] as const).map(({ ref: r, x }) => (
          <group key={x} ref={r} position={[x, 1.34, 0]}>
            <mesh position={[0, -0.2, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
              <meshStandardMaterial color={CLOAK} roughness={0.6} emissive="#1c1450" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, -0.42, 0]}>
              <sphereGeometry args={[0.055, 10, 10]} />
              <meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* Legs */}
        {([
          { ref: leftLeg, x: -0.13 },
          { ref: rightLeg, x: 0.13 },
        ] as const).map(({ ref: r, x }) => (
          <group key={x} ref={r} position={[x, 0.62, 0]}>
            <mesh position={[0, -0.26, 0]} castShadow>
              <capsuleGeometry args={[0.075, 0.42, 4, 8]} />
              <meshStandardMaterial color={CLOAK_DARK} roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.55, 0.05]}>
              <boxGeometry args={[0.13, 0.09, 0.24]} />
              <meshStandardMaterial color="#0a0a14" roughness={0.4} metalness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Scarf — chained waving segments */}
        <group ref={scarf1} position={[0, 1.44, -0.2]}>
          <mesh geometry={scarfGeo} castShadow>
            <meshStandardMaterial color="#3d2b8f" emissive={CRYSTAL} emissiveIntensity={0.7} side={THREE.DoubleSide} roughness={0.6} />
          </mesh>
          <group ref={scarf2} position={[0, -0.28, 0]}>
            <mesh geometry={scarfGeo}>
              <meshStandardMaterial color="#3d2b8f" emissive={CRYSTAL} emissiveIntensity={0.7} side={THREE.DoubleSide} roughness={0.6} />
            </mesh>
            <group ref={scarf3} position={[0, -0.28, 0]}>
              <mesh geometry={scarfGeo}>
                <meshStandardMaterial color="#3d2b8f" emissive={CRYSTAL} emissiveIntensity={0.9} side={THREE.DoubleSide} roughness={0.6} />
              </mesh>
            </group>
          </group>
        </group>

        {/* Staff with crystal */}
        <group position={[0.42, 0, 0.1]}>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.024, 0.03, 1.7, 8]} />
            <meshStandardMaterial color="#3a2a18" roughness={0.8} />
          </mesh>
          <mesh ref={crystal} position={[0, 1.8, 0]}>
            <octahedronGeometry args={[0.095, 0]} />
            <meshStandardMaterial color={CRYSTAL} emissive={CRYSTAL} emissiveIntensity={2.6} toneMapped={false} flatShading />
          </mesh>
          <pointLight ref={light} position={[0, 1.8, 0]} color={CRYSTAL} intensity={3} distance={7} decay={2} />
        </group>
      </group>
    </group>
  );
}
