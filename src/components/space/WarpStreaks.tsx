"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Simulation } from "@/lib/simulation";

const COUNT = 420;
const SPREAD = 26;
const NEAR = 14;
const FAR = 90;

/**
 * Speed streaks that only appear under thrust. Parented to the ship, so they
 * always stream backwards along the direction of travel.
 */
export default function WarpStreaks({ sim }: { sim: Simulation }) {
  const ref = useRef<THREE.LineSegments>(null);
  const basis = useMemo(
    () => ({ forward: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() }),
    []
  );
  const { forward, right, up } = basis;

  const { object, geometry, material, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 2 * 3);
    const seeds = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * SPREAD + 1.4;
      seeds[i * 3] = Math.cos(angle) * radius;
      seeds[i * 3 + 1] = Math.sin(angle) * radius;
      seeds[i * 3 + 2] = -FAR + Math.random() * (FAR + FAR);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color("#bfe9ff"),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { object: new THREE.LineSegments(geometry, material), geometry, material, seeds };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material]
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;
    const intensity = THREE.MathUtils.clamp((sim.shipSpeed - 12) / 46, 0, 1);
    material.opacity = intensity * 0.55;
    if (ref.current) ref.current.visible = intensity > 0.01;
    if (intensity <= 0.01) return;

    // Streaks run along the ship's own axes so they always stream backwards.
    forward.set(0, 0, 1).applyQuaternion(sim.shipQuaternion);
    right.set(1, 0, 0).applyQuaternion(sim.shipQuaternion);
    up.set(0, 1, 0).applyQuaternion(sim.shipQuaternion);
    const head = sim.shipPosition;
    const length = 1.5 + intensity * 16;

    for (let i = 0; i < COUNT; i += 1) {
      const x = seeds[i * 3];
      const y = seeds[i * 3 + 1];
      let z = seeds[i * 3 + 2];
      z -= sim.shipSpeed * delta * 1.9;
      if (z < -FAR) z += FAR + FAR;
      seeds[i * 3 + 2] = z;

      const px = head.x + right.x * x + up.x * y + forward.x * z;
      const py = head.y + right.y * x + up.y * y + forward.y * z;
      const pz = head.z + right.z * x + up.z * y + forward.z * z;
      const index = i * 6;
      array[index] = px;
      array[index + 1] = py;
      array[index + 2] = pz;
      array[index + 3] = px - forward.x * length;
      array[index + 4] = py - forward.y * length;
      array[index + 5] = pz - forward.z * length;
    }
    attribute.needsUpdate = true;
  }, 0);

  return <primitive ref={ref} object={object} />;
}
