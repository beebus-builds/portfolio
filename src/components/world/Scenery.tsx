"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Deterministic pseudo-random so the forest layout is stable per load.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Gradient sky dome ──────────────────────────────────────────

const SKY_VERT = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAG = /* glsl */ `
  varying vec3 vPos;
  void main() {
    float h = normalize(vPos).y;
    vec3 top = vec3(0.008, 0.012, 0.035);
    vec3 mid = vec3(0.045, 0.05, 0.16);
    vec3 hor = vec3(0.09, 0.33, 0.36);
    vec3 col = mix(hor, mid, smoothstep(0.0, 0.28, h));
    col = mix(col, top, smoothstep(0.22, 0.75, h));
    col = mix(vec3(0.015, 0.015, 0.04), col, smoothstep(-0.2, 0.015, h));
    col += vec3(0.28, 0.09, 0.38) * pow(max(0.0, 1.0 - abs(h - 0.07) * 5.0), 2.0) * 0.4;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function SkyDome() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  );
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[140, 24, 16]} />
    </mesh>
  );
}

// ─── Neon grid ground overlay ───────────────────────────────────

const GRID_VERT = /* glsl */ `
  varying vec2 vXZ;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vXZ = wp.xz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GRID_FRAG = /* glsl */ `
  varying vec2 vXZ;
  uniform vec3 uGrid;
  uniform vec3 uMajor;
  uniform vec3 uPath;
  float grid(vec2 p, float scale) {
    vec2 g = abs(fract(p / scale - 0.5) - 0.5) / fwidth(p / scale);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float minor = grid(vXZ, 1.0);
    float major = grid(vXZ, 5.0);
    float dCenter = abs(vXZ.x);
    float path = smoothstep(1.5, 0.2, dCenter);
    float edge = smoothstep(0.14, 0.0, abs(dCenter - 1.5));
    float r = length(vXZ * vec2(1.0, 0.45));
    float fade = smoothstep(46.0, 12.0, r);
    vec3 col = uGrid * minor * 0.32 + uMajor * major * 0.85;
    col += uPath * (path * 0.5 + edge * 0.95);
    float a = clamp(minor * 0.22 + major * 0.5 + path * 0.5 + edge * 0.85, 0.0, 1.0) * fade;
    gl_FragColor = vec4(col, a * 0.85);
  }
`;

export function GroundGrid() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GRID_VERT,
        fragmentShader: GRID_FRAG,
        uniforms: {
          uGrid: { value: new THREE.Color("#2a3f8f") },
          uMajor: { value: new THREE.Color("#54e6d4") },
          uPath: { value: new THREE.Color("#6d5bff") },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  return (
    <>
      {/* Dark base that catches light + shadows */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 95]} />
        <meshStandardMaterial color="#07070f" roughness={0.95} metalness={0.1} />
      </mesh>
      {/* Glowing grid + path overlay */}
      <mesh material={mat} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 90]} />
      </mesh>
    </>
  );
}

// ─── Drifting fireflies ─────────────────────────────────────────

export function Fireflies({ count = 130 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { base, phase } = useMemo(() => {
    const r = rng(7);
    const base = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      base[i * 3] = (r() * 2 - 1) * 15;
      base[i * 3 + 1] = 0.4 + r() * 5.5;
      base[i * 3 + 2] = (r() * 2 - 1) * 34;
      phase[i] = r() * Math.PI * 2;
    }
    return { base, phase };
  }, [count]);

  useFrame(({ clock }) => {
    const pts = ref.current;
    if (!pts) return;
    const t = clock.elapsedTime;
    const pos = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const p = phase[i];
      pos.setXYZ(
        i,
        base[i * 3] + Math.sin(t * 0.35 + p) * 1.4,
        base[i * 3 + 1] + Math.sin(t * 0.6 + p * 1.7) * 0.5,
        base[i * 3 + 2] + Math.cos(t * 0.28 + p) * 1.4
      );
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[base.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.14} color="#9df3ff" transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

// ─── Pine grove (instanced, flanks the path) ────────────────────

interface Spot { x: number; z: number; s: number; r: number }

function useSpots(count: number, seed: number, minX: number, maxX: number, minZ: number, maxZ: number): Spot[] {
  return useMemo(() => {
    const r = rng(seed);
    const spots: Spot[] = [];
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      spots.push({
        x: side * (minX + r() * (maxX - minX)),
        z: minZ + r() * (maxZ - minZ),
        s: 0.7 + r() * 0.9,
        r: r() * Math.PI * 2,
      });
    }
    return spots;
  }, [count, seed, minX, maxX, minZ, maxZ]);
}

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, spots: Spot[], yOffset: number) {
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    spots.forEach((s, i) => {
      dummy.position.set(s.x, yOffset * s.s, s.z);
      dummy.rotation.set(0, s.r, 0);
      dummy.scale.setScalar(s.s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [ref, spots, dummy, yOffset]);
}

const PINE_TRUNK = "#2a1c14";
const PINE_LEAF = "#0e3a34";
const PINE_TIP = "#1d6b5e";

export function PineGrove() {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const lower = useRef<THREE.InstancedMesh>(null);
  const upper = useRef<THREE.InstancedMesh>(null);
  const spots = useSpots(18, 21, 8, 15, -34, 33);
  useInstances(trunks, spots, 0.8);
  useInstances(lower, spots, 2.2);
  useInstances(upper, spots, 3.4);

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 1.6, 7]} />
        <meshStandardMaterial color={PINE_TRUNK} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={lower} args={[undefined, undefined, spots.length]} castShadow>
        <coneGeometry args={[1.15, 2.2, 8]} />
        <meshStandardMaterial color={PINE_LEAF} roughness={0.85} flatShading />
      </instancedMesh>
      <instancedMesh ref={upper} args={[undefined, undefined, spots.length]} castShadow>
        <coneGeometry args={[0.75, 1.6, 8]} />
        <meshStandardMaterial color={PINE_TIP} roughness={0.8} flatShading emissive="#0a2e28" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

// ─── Scattered rocks + grass tufts ──────────────────────────────

export function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spots = useSpots(26, 99, 2.6, 13, -34, 33);
  useInstances(ref, spots, 0.12);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.32, 0]} />
      <meshStandardMaterial color="#1b1b2b" roughness={0.9} flatShading />
    </instancedMesh>
  );
}

export function GrassTufts() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spots = useSpots(320, 1337, 2.2, 13.5, -35, 34);
  useInstances(ref, spots, 0.16);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, spots.length]}>
      <coneGeometry args={[0.07, 0.42, 4]} />
      <meshStandardMaterial color="#0f4a44" roughness={0.9} flatShading emissive="#0d3f3a" emissiveIntensity={0.55} />
    </instancedMesh>
  );
}
