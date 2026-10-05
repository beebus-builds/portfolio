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
  /** Concentrates stars along a tilted galactic plane (the Milky Way band). */
  band?: { thickness: number; tilt: [number, number, number] };
};

/**
 * Stellar temperature palette, weighted like a real sky: mostly dim orange-red
 * dwarfs, plenty of sun-like yellows, few blue-white giants.
 */
const STAR_TEMPS: { color: string; weight: number }[] = [
  { color: "#ff9a5c", weight: 0.3 },
  { color: "#ffc98a", weight: 0.2 },
  { color: "#fff4e0", weight: 0.25 },
  { color: "#ffffff", weight: 0.12 },
  { color: "#cfe0ff", weight: 0.09 },
  { color: "#9fc0ff", weight: 0.04 },
];

function pickTemp(): string {
  let roll = Math.random();
  for (const entry of STAR_TEMPS) {
    roll -= entry.weight;
    if (roll <= 0) return entry.color;
  }
  return "#ffffff";
}

const _tilt = new THREE.Euler();
const _v = new THREE.Vector3();

function makeLayer(
  count: number,
  radius: number,
  spread: number,
  saturation: [number, number],
  band?: { thickness: number; tilt: [number, number, number] }
) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const color = new THREE.Color();
  if (band) _tilt.set(...band.tilt);

  for (let i = 0; i < count; i += 1) {
    // Cube-face sampling gives a far more even distribution than random angles.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const planar = Math.sqrt(1 - u * u);
    const r = radius * (1 - spread * Math.random());
    _v.set(r * planar * Math.cos(theta), r * u, r * planar * Math.sin(theta));

    if (band) {
      // Squeeze toward the galactic plane, then tilt it diagonally across the sky.
      _v.y *= band.thickness * (0.4 + Math.random() * 0.6);
      _v.normalize().multiplyScalar(r);
      _v.applyEuler(_tilt);
    }

    positions[i * 3] = _v.x;
    positions[i * 3 + 1] = _v.y;
    positions[i * 3 + 2] = _v.z;

    color.set(pickTemp());
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    color.setHSL(
      hsl.h,
      THREE.MathUtils.clamp(hsl.s * saturation[0] + saturation[1] * Math.random(), 0, 1),
      band
        ? THREE.MathUtils.clamp(0.3 + Math.random() * 0.45, 0, 1)
        : THREE.MathUtils.clamp(0.55 + Math.random() * 0.45, 0, 1)
    );
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    sizes[i] = band ? 0.4 + Math.pow(Math.random(), 3) * 1.1 : 0.5 + Math.pow(Math.random(), 4) * 2.6;
  }

  return { positions, colors, sizes };
}

function StarLayer({
  count,
  radius,
  size,
  opacity,
  follows = false,
  spin = 0,
  spread = 0.35,
  saturation = [1, 0],
  band,
}: StarLayerProps) {
  const points = useRef<THREE.Points>(null);
  const texture = useMemo(() => createGlowTexture(), []);
  const geometry = useMemo(() => {
    const data = makeLayer(count, radius, spread, saturation, band);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    return geo;
  }, [count, radius, spread, saturation, band]);

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

const GALAXIES = [
  { dir: [0.62, 0.28, -0.73] as const, scale: [120, 44] as const, color: "#e8d5b5", opacity: 0.16, rotation: 0.5 },
  { dir: [-0.55, -0.32, -0.77] as const, scale: [90, 90] as const, color: "#b9c8ff", opacity: 0.13, rotation: 0 },
  { dir: [0.12, -0.62, 0.77] as const, scale: [150, 30] as const, color: "#d7e4ff", opacity: 0.12, rotation: -0.35 },
  { dir: [-0.78, 0.42, 0.46] as const, scale: [64, 64] as const, color: "#ffffff", opacity: 0.1, rotation: 0 },
];

/** Faint island universes pinned to the far backdrop, always beyond reach. */
function DistantGalaxies() {
  const group = useRef<THREE.Group>(null);
  const glowMap = useMemo(() => createGlowTexture(), []);
  const items = useMemo(
    () =>
      GALAXIES.map((g) => ({
        ...g,
        position: new THREE.Vector3(...g.dir).normalize().multiplyScalar(1150),
      })),
    []
  );

  useFrame(({ camera }) => {
    if (group.current) group.current.position.copy(camera.position);
  });

  return (
    <group ref={group}>
      {items.map((g, index) => (
        <sprite key={index} position={g.position} scale={[g.scale[0], g.scale[1], 1]}>
          <spriteMaterial
            map={glowMap}
            color={g.color}
            transparent
            opacity={g.opacity}
            rotation={g.rotation}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  );
}

/** Near-field ice-crystal dust drifting past the hull: sells motion at any speed. */
function CosmicDust({ count = 550, radius = 85 }: { count?: number; radius?: number }) {
  const points = useRef<THREE.Points>(null);
  const texture = useMemo(() => createGlowTexture(), []);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const planar = Math.sqrt(1 - u * u);
      const r = radius * (0.25 + 0.75 * Math.random());
      positions[i * 3] = r * planar * Math.cos(theta);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * planar * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count, radius]);

  useFrame(({ camera }, delta) => {
    if (!points.current) return;
    points.current.position.copy(camera.position);
    points.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={texture}
        size={0.7}
        transparent
        opacity={0.3}
        color="#9db8d8"
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/**
 * Deep-space backdrop: temperature-weighted star shells with parallax, a dense
 * Milky Way band with dark-lane dimming, island galaxies at infinity, and dust
 * motes drifting past the camera.
 */
export default function Starfield() {
  return (
    <group>
      <StarLayer count={5200} radius={1250} size={1.9} opacity={0.95} follows spread={0.1} />
      <StarLayer count={2600} radius={620} size={2.6} opacity={0.85} spin={0.004} spread={0.45} saturation={[0.9, 0.12]} />
      <StarLayer count={900} radius={260} size={3.4} opacity={0.7} spin={-0.008} spread={0.55} saturation={[1.1, 0.2]} />
      <StarLayer
        count={4500}
        radius={1250}
        size={1.5}
        opacity={0.8}
        follows
        spread={0.05}
        saturation={[0.8, 0.1]}
        band={{ thickness: 0.16, tilt: [0.42, 0, 0.9] }}
      />
      <DistantGalaxies />
      <CosmicDust />
    </group>
  );
}
