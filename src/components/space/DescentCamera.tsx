"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { getPlanet, type SectionId } from "@/lib/profile";
import type { Simulation } from "@/lib/simulation";

const DIVE_MS = 1650;

/**
 * Atmospheric descent: as `entering` fires, the ship is pulled down toward
 * the planet's surface and the camera swings in behind it, before the
 * EntryFlash hands off to the landed world overlay.
 */
export default function DescentCamera({ sim, id }: { sim: Simulation; id: SectionId }) {
  const started = useRef(0);
  const from = useRef(new THREE.Vector3());
  const fromQuat = useRef(new THREE.Quaternion());
  const target = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useFrame(({ camera, clock }, delta) => {
    const planetPos = sim.positions.get(id);
    if (!planetPos) return;
    const def = getPlanet(id);

    if (!initialized.current) {
      initialized.current = true;
      started.current = clock.elapsedTime;
      from.current.copy(sim.shipPosition);
      fromQuat.current.copy(sim.shipQuaternion);
    }

    const t = Math.min(1, (clock.elapsedTime - started.current) * 1000 / DIVE_MS);
    const eased = t * t * (3 - 2 * t);

    // Descend toward a point just above the surface, along the approach vector.
    const approach = from.current.clone().sub(planetPos).normalize();
    const surface = planetPos.clone().add(approach.multiplyScalar(def.radius * 1.45));
    target.current.copy(from.current).lerp(surface, eased);

    sim.shipPosition.copy(target.current);
    sim.shipSpeed = 0;
    const nose = planetPos.clone().sub(target.current).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nose);
    sim.shipQuaternion.slerpQuaternions(fromQuat.current, quat, Math.min(1, eased * 1.4));

    // Camera tucks in close behind the ship during the drop.
    const desired = target.current
      .clone()
      .addScaledVector(nose, -(9 + (1 - eased) * 10))
      .add(new THREE.Vector3(0, 2.2, 0));
    camera.position.lerp(desired, Math.min(1, delta * 4));
    camera.lookAt(planetPos);
  });

  return null;
}
