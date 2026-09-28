"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { createGlowTexture } from "./textures";

/** Direction the system light comes from. Shared by the sun mesh and the key light. */
export const SUN_DIRECTION = new THREE.Vector3(-0.58, 0.32, -0.75).normalize();
export const SUN_DISTANCE = 2100;
export const SUN_POSITION = SUN_DIRECTION.clone().multiplyScalar(SUN_DISTANCE);

/** The system primary: a small hot core wrapped in additive glare. */
export default function Sun() {
  const glowMap = useMemo(() => createGlowTexture(), []);
  const flareMap = useMemo(() => createGlowTexture("rgba(255,246,224,1)"), []);

  return (
    <group position={SUN_POSITION}>
      <mesh>
        <sphereGeometry args={[46, 32, 24]} />
        <meshBasicMaterial color="#fff6e2" toneMapped={false} />
      </mesh>
      <sprite scale={[520, 520, 1]}>
        <spriteMaterial
          map={glowMap}
          color="#ffd9a0"
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[1100, 260, 1]} rotation={[0, 0, 0.42]}>
        <spriteMaterial
          map={flareMap}
          color="#ffb877"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[260, 1100, 1]} rotation={[0, 0, 0.42]}>
        <spriteMaterial
          map={flareMap}
          color="#ffb877"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
