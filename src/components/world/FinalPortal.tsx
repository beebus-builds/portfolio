"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";

export default function FinalPortal({ unlocked }: { unlocked: boolean }) {
  const router = useRouter();
  const group = useRef<THREE.Group>(null);
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);

  useEffect(() => {
    if (!unlocked) return;
    const onKey = (event: KeyboardEvent) => {
      if (nearRef.current && (event.key === "Enter" || event.key.toLowerCase() === "e")) router.push("/contact?from=unknown");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, unlocked]);

  useFrame(({ clock, camera }) => {
    if (!group.current || !unlocked) return;
    const t = clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.35) * 0.08;
    const pulse = 1 + Math.sin(t * 1.5) * 0.045;
    group.current.scale.setScalar(pulse);
    const nextNear = camera.position.distanceTo(group.current.position) < 7;
    if (nextNear !== nearRef.current) { nearRef.current = nextNear; setNear(nextNear); }
  });

  if (!unlocked) return null;

  return (
    <group ref={group} position={[0, 2.5, 34]}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[4.5, 0.05, 12, 64]} />
        <meshBasicMaterial color="#b8ff4d" transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} scale={0.88}>
        <torusGeometry args={[4.5, 0.22, 12, 64]} />
        <meshBasicMaterial color="#b8ff4d" transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight color="#b8ff4d" intensity={near ? 24 : 12} distance={20} />
      <Text position={[0, 5.1, 0]} fontSize={0.22} color="#b8ff4d" anchorX="center" letterSpacing={0.18}>THE UNKNOWN</Text>
      <Text position={[0, 4.65, 0]} fontSize={0.11} color="#e9f2e4" anchorX="center" fillOpacity={0.72}>THE STORY ENDS. THE WORK DOESN'T.</Text>
      {near && <Text position={[0, -2.8, 0]} fontSize={0.12} color="#ffffff" anchorX="center">PRESS E TO ENTER THE NEXT CHAPTER</Text>}
    </group>
  );
}
