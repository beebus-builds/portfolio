"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SKY_MAP, useRealMap } from "./realAssets";

const SKY_RADIUS = 1600;

/**
 * The real Milky Way, mapped as a camera-locked equirectangular dome.
 *
 * The panorama already carries the galactic band, so this replaces the
 * procedural band layer rather than stacking on top of it. It sits just inside
 * the far plane and beyond every body in the system, and follows the camera so
 * it reads as infinitely distant.
 *
 * Until the image arrives (or if it fails) the dome is simply absent and the
 * procedural starfield carries the sky on its own.
 */
export default function RealSky({ intensity = 1 }: { intensity?: number }) {
  const group = useRef<THREE.Group>(null);
  const sky = useRealMap(SKY_MAP);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: sky,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
        transparent: true,
        opacity: 0,
      }),
    // Built once; the map is assigned in the effect below so the material keeps
    // a stable identity across reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    material.map = sky;
    material.needsUpdate = true;
  }, [material, sky]);

  // Fade in once the panorama is decoded, so there is no pop.
  useEffect(() => {
    if (!sky) return;
    const target = intensity;
    let raf = 0;
    const step = () => {
      material.opacity += (target - material.opacity) * 0.08;
      if (Math.abs(target - material.opacity) > 0.002) {
        raf = requestAnimationFrame(step);
      } else {
        material.opacity = target;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [sky, intensity, material]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera }) => {
    if (group.current) group.current.position.copy(camera.position);
  });

  if (!sky) return null;

  return (
    <group ref={group} renderOrder={-1}>
      <mesh frustumCulled={false} renderOrder={-1} material={material}>
        <sphereGeometry args={[SKY_RADIUS, 64, 32]} />
      </mesh>
    </group>
  );
}
