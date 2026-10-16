"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { engineState } from "@/lib/engineState";
import { ENGINE_EXIT_Z, ENGINE_OFFSET_X } from "./shipGeometry";
import { createGlowTexture } from "./textures";

/** Outer plume: a wide, translucent shock structure trailing the bell. */
const PLUME_LENGTH = 3.9;
const PLUME_RADIUS = 0.5;
/** Inner core: white-hot throat wash, about half as long and half as wide. */
const CORE_LENGTH = 1.9;
const CORE_RADIUS = 0.26;

const plumeVertex = /* glsl */ `
  uniform float uLength;
  varying float vT;
  varying float vR;
  void main() {
    // Cone apex sits at the nozzle exit: t = 0 there, 1 at the far tail.
    vT = clamp((uLength * 0.5 - position.y) / uLength, 0.0, 1.0);
    vR = length(position.xz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const plumeFragment = /* glsl */ `
  uniform float uTime;
  uniform float uThrottle;
  uniform float uBoost;
  uniform float uRadius;
  uniform float uInner;
  uniform vec3 uHot;
  uniform vec3 uMid;
  uniform vec3 uCool;
  varying float vT;
  varying float vR;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }

  float valueNoise(float x) {
    float i = floor(x);
    float f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(hash(i), hash(i + 1.0), f);
  }

  void main() {
    // Clamp: additive blending has no headroom, and an unclamped boost makes the
    // plume clip to a white ball instead of showing its structure.
    float drive = min(uThrottle, 1.25);

    // Distance from the plume axis, normalised by the cone radius at this slice.
    float rel = vR / max(uRadius * vT, 1e-4);
    float core = 1.0 - smoothstep(0.05, 1.0, rel);
    core = pow(core, mix(2.6, 1.2, uInner));

    // Shock diamonds: standing waves marching aft as the flow expands.
    float wave = 0.5 + 0.5 * sin(vT * mix(30.0, 46.0, uInner) - uTime * 11.0);
    wave = mix(1.0, wave, smoothstep(0.0, 0.45, vT) * (1.0 - uInner * 0.5));

    // Broadband turbulence plus travelling striations: no two frames match.
    float turb = valueNoise(vT * 8.0 - uTime * 15.0) * 0.6
               + valueNoise(vT * 21.0 - uTime * 27.0) * 0.4;
    float energy = drive * (0.78 + turb * 0.42 + uBoost * 0.25);

    // Brightest at the throat, then falling away down the plume.
    float axial = (0.28 + 0.72 * pow(vT, 0.45)) * exp(-vT * mix(2.1, 2.9, uInner));
    float alpha = core * wave * energy * axial;
    if (alpha < 0.004) discard;

    vec3 colour = mix(uHot, uMid, smoothstep(0.0, 0.32, vT));
    colour = mix(colour, uCool, smoothstep(0.3, 1.0, vT));
    // Keep the outer sheath well under clipping so the diamonds stay legible.
    gl_FragColor = vec4(colour * (0.32 + core * 0.55 * uInner), alpha * 0.85);
  }
`;

type LayerConfig = {
  length: number;
  radius: number;
  inner: number;
  hot: string;
  mid: string;
  cool: string;
};

const OUTER: LayerConfig = {
  length: PLUME_LENGTH,
  radius: PLUME_RADIUS,
  inner: 0,
  hot: "#dff4ff",
  mid: "#5cc8ff",
  cool: "#1b3f9e",
};

const CORE: LayerConfig = {
  length: CORE_LENGTH,
  radius: CORE_RADIUS,
  inner: 1,
  hot: "#fffdf6",
  mid: "#bfe6ff",
  cool: "#5f8cff",
};

function makeMaterial(config: LayerConfig) {
  return new THREE.ShaderMaterial({
    vertexShader: plumeVertex,
    fragmentShader: plumeFragment,
    uniforms: {
      uTime: { value: 0 },
      uThrottle: { value: 0 },
      uBoost: { value: 0 },
      uRadius: { value: config.radius },
      uLength: { value: config.length },
      uInner: { value: config.inner },
      uHot: { value: new THREE.Color(config.hot) },
      uMid: { value: new THREE.Color(config.mid) },
      uCool: { value: new THREE.Color(config.cool) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

/**
 * Exhaust: a two-layer plasma plume per engine, an additive glare disc at each
 * bell mouth and a point light so the plume throws light back onto the hull.
 * All of it scales with the throttle the flight loop publishes.
 */
export default function EnginePlume() {
  const glows = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const outer = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);

  const resources = useMemo(() => {
    const outerMaterial = makeMaterial(OUTER);
    const coreMaterial = makeMaterial(CORE);
    const glowMap = createGlowTexture();
    const outerGeometry = new THREE.ConeGeometry(0, PLUME_RADIUS, 22, 24, true);
    const coreGeometry = new THREE.ConeGeometry(0, CORE_RADIUS, 18, 16, true);
    return { outerMaterial, coreMaterial, glowMap, outerGeometry, coreGeometry };
  }, []);

  useEffect(
    () => () => {
      resources.outerMaterial.dispose();
      resources.coreMaterial.dispose();
      resources.glowMap.dispose();
      resources.outerGeometry.dispose();
      resources.coreGeometry.dispose();
    },
    [resources]
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const throttle = engineState.throttle;
    const boost = engineState.boost;
    // Throttle bleeds off when the burn ends rather than snapping to zero.
    const strain = 0.9 + Math.sin(time * 27) * 0.06 + Math.sin(time * 61) * 0.04;

    for (const [group, material, gain] of [
      [outer.current, resources.outerMaterial, 1],
      [core.current, resources.coreMaterial, 1.25],
    ] as const) {
      material.uniforms.uTime.value = time;
      material.uniforms.uThrottle.value = throttle * strain * gain;
      material.uniforms.uBoost.value = boost;
      if (group) {
        // Bell pressure breathing: the plume stretches on a hard burn.
        const stretch = 0.55 + throttle * 0.75 + boost * 0.5;
        group.scale.set(0.82 + throttle * 0.22, 0.82 + throttle * 0.22, stretch);
      }
    }

    const glow = 0.14 + Math.min(0.4, throttle * 0.34) + boost * 0.12;
    if (glows.current) {
      for (const sprite of glows.current.children) {
        const material = (sprite as THREE.Sprite).material as THREE.SpriteMaterial;
        material.opacity = Math.min(0.6, glow * strain);
      }
    }
    if (light.current) light.current.intensity = 5 + throttle * 18 + boost * 14;
    // Priority stays at 0: any positive priority makes R3F hand the render
    // loop to this callback, which silently blanks the whole scene. Ship runs
    // at -1, so engineState is always fresh by the time we read it here.
  }, 0);

  return (
    <>
      <group ref={outer} position={[0, 0, ENGINE_EXIT_Z]}>
        {[-1, 1].map((side) => (
          <mesh
            key={`outer-${side}`}
            position={[side * ENGINE_OFFSET_X, 0, -PLUME_LENGTH / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            geometry={resources.outerGeometry}
            material={resources.outerMaterial}
            frustumCulled={false}
          />
        ))}
      </group>
      <group ref={core} position={[0, 0, ENGINE_EXIT_Z]}>
        {[-1, 1].map((side) => (
          <mesh
            key={`core-${side}`}
            position={[side * ENGINE_OFFSET_X, 0, -CORE_LENGTH / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            geometry={resources.coreGeometry}
            material={resources.coreMaterial}
            frustumCulled={false}
          />
        ))}
      </group>

      <group ref={glows}>
        {[-1, 1].map((side) => (
          <sprite key={side} position={[side * ENGINE_OFFSET_X, 0, ENGINE_EXIT_Z + 0.05]} scale={[1.25, 1.25, 1]}>
            <spriteMaterial
              map={resources.glowMap}
              color="#8fe0ff"
              transparent
              opacity={0.3}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ))}
      </group>

      <pointLight
        ref={light}
        position={[0, 0, ENGINE_EXIT_Z - 0.4]}
        color="#6fd4ff"
        intensity={12}
        distance={34}
        decay={2}
      />
    </>
  );
}