"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightInput } from "@/lib/flight";
import type { Simulation } from "@/lib/simulation";

const MIN_PITCH = -0.55;
const MAX_PITCH = 0.8;

/**
 * Third-person chase rig. The keyboard flies the ship, dragging swings the
 * camera around it, and the view eases back behind the nose once you let go.
 */
export default function ChaseCamera({ sim, enabled = true }: { sim: Simulation; enabled?: boolean }) {
  const { camera } = useThree();
  const swing = useRef({ yaw: 0, pitch: 0 });
  const lookAt = useRef(new THREE.Vector3());

  const scratch = useMemo(
    () => ({
      desired: new THREE.Vector3(),
      lookTarget: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
      forward: new THREE.Vector3(),
    }),
    []
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!enabled) return;

    if (!flightInput.dragging) {
      const decay = Math.exp(-2.2 * delta);
      flightInput.cameraYaw *= decay;
      flightInput.cameraPitch *= decay;
    }

    const blend = 1 - Math.exp(-9 * delta);
    swing.current.yaw += (flightInput.cameraYaw - swing.current.yaw) * blend;
    swing.current.pitch += (flightInput.cameraPitch - swing.current.pitch) * blend;
    const pitch = THREE.MathUtils.clamp(swing.current.pitch, MIN_PITCH, MAX_PITCH);

    scratch.euler.set(pitch, swing.current.yaw, 0, "YXZ");
    scratch.quat.setFromEuler(scratch.euler);
    scratch.forward.set(0, 0, 1).applyQuaternion(sim.shipQuaternion);

    const boostPullback = sim.boosting ? 4.5 : 0;
    scratch.offset.set(0, 2.6 + pitch * 5.5, 13.5 + boostPullback);
    scratch.offset.applyQuaternion(scratch.quat);
    scratch.desired.copy(sim.shipPosition).add(scratch.offset);

    camera.position.lerp(scratch.desired, 1 - Math.exp(-7 * delta));

    scratch.lookTarget.copy(sim.shipPosition).addScaledVector(scratch.forward, 14);
    lookAt.current.lerp(scratch.lookTarget, 1 - Math.exp(-9 * delta));
    camera.lookAt(lookAt.current);

    const perspective = camera as THREE.PerspectiveCamera;
    if (perspective.isPerspectiveCamera) {
      const targetFov = sim.boosting ? 82 : 68;
      if (Math.abs(perspective.fov - targetFov) > 0.05) {
        perspective.fov += (targetFov - perspective.fov) * (1 - Math.exp(-4 * delta));
        perspective.updateProjectionMatrix();
      }
    }
  }, 0);

  return null;
}
