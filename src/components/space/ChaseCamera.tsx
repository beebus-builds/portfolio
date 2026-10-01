"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightInput } from "@/lib/flight";
import type { Simulation } from "@/lib/simulation";

const MIN_PITCH = -0.55;
const MAX_PITCH = 0.8;

/**
 * Third-person chase rig with selectable camera angles. Chase sits behind the
 * nose, Side and Top lock to cinematic offsets, and Free keeps whatever angle
 * the drag leaves behind. Switching modes glides via the position lerp.
 */
export default function ChaseCamera({ sim, enabled = true }: { sim: Simulation; enabled?: boolean }) {
  const { camera } = useThree();
  const swing = useRef({ yaw: 0, pitch: 0 });
  const look = useRef({ yaw: 0, pitch: 0 });
  const lookAt = useRef(new THREE.Vector3());

  const scratch = useMemo(
    () => ({
      desired: new THREE.Vector3(),
      lookTarget: new THREE.Vector3(),
      offset: new THREE.Vector3(),
      quat: new THREE.Quaternion(),
      combined: new THREE.Quaternion(),
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
      forward: new THREE.Vector3(),
    }),
    []
  );

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!enabled) return;

    const mode = flightInput.cameraMode;

    if (!flightInput.dragging && mode !== "free") {
      const decay = Math.exp(-2.2 * delta);
      flightInput.cameraYaw *= decay;
      flightInput.cameraPitch *= decay;
    }

    const blend = 1 - Math.exp(-9 * delta);
    swing.current.yaw += (flightInput.cameraYaw - swing.current.yaw) * blend;
    swing.current.pitch += (flightInput.cameraPitch - swing.current.pitch) * blend;
    // Mouse-look eases toward the cursor target so leaving the viewport
    // glides back to center instead of snapping.
    const lookBlend = 1 - Math.exp(-6 * delta);
    look.current.yaw += (flightInput.lookYaw - look.current.yaw) * lookBlend;
    look.current.pitch += (flightInput.lookPitch - look.current.pitch) * lookBlend;
    const locked = mode === "side" || mode === "top";
    const totalYaw = swing.current.yaw + (locked ? 0 : look.current.yaw);
    const totalPitch = THREE.MathUtils.clamp(
      swing.current.pitch + (locked ? 0 : look.current.pitch),
      MIN_PITCH,
      MAX_PITCH
    );
    const pitch = totalPitch;

    scratch.euler.set(pitch, totalYaw, 0, "YXZ");
    scratch.quat.setFromEuler(scratch.euler);
    scratch.forward.set(0, 0, 1).applyQuaternion(sim.shipQuaternion);

    const boostPullback = sim.boosting ? 10 : 0;
    if (mode === "side") {
      // Locked broadside dolly: profile view of the hull, ship centered.
      scratch.combined.copy(sim.shipQuaternion);
      scratch.offset.set(48, 6, -8);
      scratch.offset.applyQuaternion(scratch.combined);
      scratch.desired.copy(sim.shipPosition).add(scratch.offset);
      scratch.lookTarget.copy(sim.shipPosition).addScaledVector(scratch.forward, 10);
    } else if (mode === "top") {
      // Locked high overlook, tilted forward so the nose stays in frame.
      scratch.combined.copy(sim.shipQuaternion);
      scratch.offset.set(0, 62, -18);
      scratch.offset.applyQuaternion(scratch.combined);
      scratch.desired.copy(sim.shipPosition).add(scratch.offset);
      scratch.lookTarget.copy(sim.shipPosition).addScaledVector(scratch.forward, 18);
    } else {
      // Chase + free: behind the ship in ship-local space (-Z). The drag
      // swing orbits it around the hull; combining with the ship quaternion
      // keeps the view glued behind the nose through turns. Free mode simply
      // never eases the swing back, so any dragged angle sticks.
      scratch.combined.copy(sim.shipQuaternion).multiply(scratch.quat);
      scratch.offset.set(0, 6.5 + pitch * 10, -(30 + boostPullback));
      scratch.offset.applyQuaternion(scratch.combined);
      scratch.desired.copy(sim.shipPosition).add(scratch.offset);
      scratch.lookTarget.copy(sim.shipPosition).addScaledVector(scratch.forward, 26);
    }

    camera.position.lerp(scratch.desired, 1 - Math.exp(-7 * delta));

    if (sim.boosting) {
      // Blockbuster rumble: the frame shudders while the engines scream.
      const shake = Math.min(0.5, sim.shipSpeed / 160);
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
    }

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
