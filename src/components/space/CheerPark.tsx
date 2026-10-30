"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Cheer Park: the social hub of the flight deck, parked on the origin every
 * new flight spawns from. A beacon ring, a slowly orbiting set of marker
 * studs, a light column and a floating label — enough to read as a place,
 * cheap enough to always render.
 */

function textSprite(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = "600 72px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(2, 6, 12, 0.92)";
    ctx.strokeText(text, 256, 66);
    ctx.fillStyle = "#7fe3ff";
    ctx.fillText(text, 256, 66);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function CheerPark() {
  const studs = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.PointLight>(null);

  const label = useMemo(() => textSprite("CHEER PARK"), []);
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0c2438",
        emissive: new THREE.Color("#38bdf8"),
        emissiveIntensity: 1.15,
        metalness: 0.3,
        roughness: 0.4,
      }),
    []
  );
  const columnMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const padMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#38bdf8", transparent: true, opacity: 0.045, depthWrite: false }),
    []
  );
  const studMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#7fe3ff", toneMapped: false }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (studs.current) studs.current.rotation.y = t * 0.22;
    if (pulse.current) pulse.current.intensity = 14 + Math.sin(t * 1.8) * 5;
  });

  const studPositions = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2;
        return [Math.cos(angle) * 20, 0.5, Math.sin(angle) * 20] as const;
      }),
    []
  );

  return (
    <group>
      {/* The beacon ring, flat on the deck plane. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ringMaterial}>
        <torusGeometry args={[26, 0.9, 8, 96]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.35, 0]} material={ringMaterial}>
        <torusGeometry args={[20, 0.5, 6, 72]} />
      </mesh>

      {/* Marker studs circling the inner ring, so the park visibly turns. */}
      <group ref={studs}>
        {studPositions.map((position, index) => (
          <mesh key={index} position={[position[0] ?? 0, position[1] ?? 0, position[2] ?? 0]} material={studMaterial}>
            <boxGeometry args={[1.4, 0.4, 1.4]} />
          </mesh>
        ))}
      </group>

      {/* Faint landing pad disc underfoot. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, 0]} material={padMaterial}>
        <circleGeometry args={[26, 48]} />
      </mesh>

      {/* Light column and its breathing halo. */}
      <mesh position={[0, 30, 0]} material={columnMaterial}>
        <cylinderGeometry args={[0.7, 0.7, 60, 8, 1, true]} />
      </mesh>
      <pointLight ref={pulse} position={[0, 6, 0]} color="#38bdf8" intensity={14} distance={130} decay={1.4} />

      <sprite position={[0, 15, 0]} scale={[22, 5.5, 1]}>
        <spriteMaterial map={label} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}
