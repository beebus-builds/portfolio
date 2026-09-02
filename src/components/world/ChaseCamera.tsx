"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { VehicleState } from "./Vehicle";

export default function ChaseCamera({ target }: { target: { current: VehicleState } }) {
  const { camera, pointer } = useThree();
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3(0, 1.2, 8));
  const smoothedPointer = useRef(new THREE.Vector2());
  const lookTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const t = target.current;
    const ease = Math.min(1, delta * 3.2);
    smoothedPointer.current.lerp(pointer, Math.min(1, delta * 4));

    const bx = Math.sin(t.heading) * -9;
    const bz = Math.cos(t.heading) * -9;
    desired.current.set(
      t.position.x + bx + smoothedPointer.current.x * 1.35,
      5.5 + smoothedPointer.current.y * 0.7,
      t.position.z + bz
    );

    camera.position.lerp(desired.current, ease);

    lookTarget.current.set(
      t.position.x + smoothedPointer.current.x * 2.4,
      1.2 - smoothedPointer.current.y * 0.7,
      t.position.z
    );
    lookAt.current.lerp(lookTarget.current, Math.min(1, delta * 4));
    camera.lookAt(lookAt.current);
  });

  return null;
}
