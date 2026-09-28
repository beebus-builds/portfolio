"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createGlowTexture } from "./textures";

type StarLayerProps = {
  count: number;
  radius: number;
  size: number;
  opacity: number;
  /** Follows the camera so the layer never runs out. */
  follows?: boolean;
  /** Rotation speed in radians per second. */
  spin?: number;
  spread?: number;
  saturation?: [number, number];
};

const STAR_TINTS = ["#ffffff", "#dfe9ff", "#bcd4ff", "#fff1d6", "#ffd9c2", "#cfe0ff"];

function makeLayer(count: number, radius: number, spread: number, saturation: [number, number]) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    // Cube-face sampling gives a far more even distribution than random angles.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const planar = Math.sqrt(1 - u * u);
    const r = radius * (1 - spread * Math.random());
    positions[i * 3] = r * planar * Math.cos(theta);
    positions[i * 3 + 1] = r * u;
    positions[i * 3 + 2] = r * planar * Math.sin(theta);

    color.set(STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)]);
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    color.setHSL(
      hsl.h,
      THREE.MathUtils.clamp(hsl.s * saturation[0] + saturation[1] * Math.random(), 0, 1),
      THREE.MathUtils.clamp(0.55 + Math.random() * 0.45, 0, 1)
    );
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    sizes[i] = 0.5 + Math.pow(Math.random(), 3) * 2.4;
  }

  return { positions, colors, sizes };
}

function StarLayer({ count, radius, size, opacity, follows = false, spin = 0, spread = 0.35, saturation = [1, 0] }: StarLayerProps) {
  const points = useRef<THREE.Points>(null);
  const texture = useMemo(() => createGlowTexture(), []);
  const geometry = useMemo(() => {
    const data = makeLayer(count, radius, spread, saturation);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    return geo;
  }, [count, radius, spread, saturation]);

  useFrame(({ camera }, delta) => {
    if (!points.current) return;
    if (follows) points.current.position.copy(camera.position);
    if (spin !== 0) {
      points.current.rotation.y += delta * spin;
      points.current.rotation.x += delta * spin * 0.35;
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={texture}
        size={size}
        sizeAttenuation={!follows}
        transparent
        opacity={opacity}
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/**
 * Three shells of stars: a camera-locked infinity layer for density, plus two
 * world-locked layers so flying past them reads as real parallax motion.
 */
export default function Starfield() {
  return (
    <group>
      <StarLayer count={5200} radius={1250} size={1.9} opacity={0.95} follows spread={0.1} />
      <StarLayer count={2600} radius={620} size={2.6} opacity={0.85} spin={0.004} spread={0.45} saturation={[0.9, 0.12]} />
      <StarLayer count={900} radius={260} size={3.4} opacity={0.7} spin={-0.008} spread={0.55} saturation={[1.1, 0.2]} />
    </group>
  );
}
