"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uCloudA;
  uniform vec3 uCloudB;
  uniform vec3 uCore;
  uniform vec3 uSunDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float slow = uTime * 0.004;
    float base = fbm(dir * 2.1 + vec3(slow, slow * 0.4, -slow));
    float detail = fbm(dir * 4.7 + base * 1.3 + vec3(3.1, 7.7, 1.9));
    float clouds = smoothstep(0.55, 0.96, base * 0.68 + detail * 0.58);

    vec3 color = mix(uDeep, uCloudA, clouds);
    color = mix(color, uCloudB, smoothstep(0.62, 1.0, detail) * 0.6);

    float lanes = smoothstep(0.24, 0.66, fbm(dir * 8.0 + 11.0));
    color *= 0.8 + 0.2 * lanes;

    float core = pow(max(0.0, 1.0 - distance(dir, normalize(uSunDir)) * 1.5), 5.0);
    color += uCore * core * 0.35;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

type NebulaProps = {
  radius?: number;
  deep?: string;
  cloudA?: string;
  cloudB?: string;
  core?: string;
  sunDirection?: [number, number, number];
};

/**
 * Camera-locked deep-space dome. Real space is near-black, so this stays a
 * whisper of cold gas: faint cold wisps over black, never a cartoon sky.
 */
export default function Nebula({
  radius = 1500,
  deep = "#010208",
  cloudA = "#0a0d1a",
  cloudB = "#0a1420",
  core = "#ffb27a",
  sunDirection = [-0.6, 0.35, -0.72],
}: NebulaProps) {
  const group = useRef<THREE.Group>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(deep) },
      uCloudA: { value: new THREE.Color(cloudA) },
      uCloudB: { value: new THREE.Color(cloudB) },
      uCore: { value: new THREE.Color(core) },
      uSunDir: { value: new THREE.Vector3(...sunDirection).normalize() },
    }),
    [deep, cloudA, cloudB, core, sunDirection]
  );

  useFrame(({ camera, clock }) => {
    if (group.current) group.current.position.copy(camera.position);
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group ref={group}>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[radius, 48, 32]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
