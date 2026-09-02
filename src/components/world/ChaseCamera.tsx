"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { VehicleState } from "./Vehicle";

export default function ChaseCamera({ target }: { target: { current: VehicleState } }) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3(0, 1.2, 8));

  useFrame((_, delta) => {
    const t = target.current;
    const bx = Math.sin(t.heading) * -9;
    const bz = Math.cos(t.heading) * -9;
    desired.current.set(t.position.x + bx, 5.5, t.position.z + bz);
    camera.position.lerp(desired.current, Math.min(1, delta * 3.2));
    lookAt.current.lerp(new THREE.Vector3(t.position.x, 1.2, t.position.z), Math.min(1, delta * 4));
    camera.lookAt(lookAt.current);
  });

  return null;
}
