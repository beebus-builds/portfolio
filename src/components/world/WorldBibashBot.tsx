"use client";

import { Text, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { VehicleState } from "./Vehicle";

const MESSAGES = [
  "KEEP GOING.",
  "YOU FOUND A MEMORY.",
  "TRY THE TERMINAL.",
  "FAILURE IS PART OF THE MAP.",
  "THE UNKNOWN IS WAITING.",
];

type Props = { state: { current: VehicleState }; discovered: string[]; complete: boolean };

export default function WorldBibashBot({ state, discovered, complete }: Props) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const texture = useTexture("/Bibash%20Bot.png");
  const message = useMemo(() => complete ? "THE NEXT CHAPTER STARTS NOW." : MESSAGES[Math.min(discovered.length, MESSAGES.length - 1)], [complete, discovered.length]);

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    const heading = state.current.heading;
    const target = new THREE.Vector3(
      state.current.position.x - Math.sin(heading) * 1.7 + Math.sin(t * 0.8) * 0.18,
      1.65 + Math.sin(t * 2.1) * 0.12,
      state.current.position.z - Math.cos(heading) * 1.7 + Math.cos(t * 1.1) * 0.16,
    );
    group.current.position.lerp(target, 1 - Math.exp(-5 * delta));
    group.current.rotation.y = -heading;
    group.current.rotation.z = Math.sin(t * 1.4) * 0.035;
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.07);
  });

  return (
    <group ref={group}>
      <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.45, 0]}>
        <ringGeometry args={[0.55, 0.59, 32]} />
        <meshBasicMaterial color="#b8ff4d" transparent opacity={0.65} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial map={texture} transparent opacity={0.96} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 0.62, 0]} fontSize={0.085} color="#b8ff4d" anchorX="center" anchorY="middle" letterSpacing={0.08} outlineWidth={0.008} outlineColor="#050512">BIBASH // BOT</Text>
      <Text position={[0, 0.45, 0]} fontSize={0.065} color="#e9f2e4" anchorX="center" anchorY="middle" maxWidth={2.8} fillOpacity={0.72}>{message}</Text>
      <pointLight position={[0, 0, 0]} color="#b8ff4d" intensity={complete ? 3.5 : 1.8} distance={3.5} />
    </group>
  );
}
