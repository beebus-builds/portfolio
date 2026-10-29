"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { flightInput } from "@/lib/flight";
import { planets, type PlanetDef, type SectionId } from "@/lib/profile";
import { orbitPosition, planetSpin, type Simulation } from "@/lib/simulation";
import { createCloudTexture, createGlowTexture, createPlanetTexture, createRingTexture, type PlanetStyle } from "./textures";
import { CLOUD_MAPS, MOON_MAP, PLANET_MAPS, RING_MAP, useBumpMap, useRealAlphaMap, useRealMap } from "./realAssets";

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  void main() {
    float rim = pow(1.0 - clamp(dot(vNormal, vView), 0.0, 1.0), uPower);
    float glow = rim * uIntensity;
    gl_FragColor = vec4(uColor * glow, glow);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const STYLES: Record<SectionId, PlanetStyle> = {
  about: "ocean",
  skills: "gaseous",
  projects: "rocky",
  contact: "bands",
  resume: "crystalline",
};

/**
 * Surface response once a real map is in place. Rocky bodies stay matte and
 * dusty; the cloud tops of the gas giants are smoother and pick up a specular
 * sheen from the key light, the way real cloud decks do.
 */
const SURFACE_ROUGHNESS: Record<PlanetStyle, number> = {
  ocean: 0.78,
  gaseous: 0.82,
  rocky: 0.95,
  bands: 0.88,
  crystalline: 0.92,
};

function seedFrom(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

type PlanetProps = {
  def: PlanetDef;
  sim: Simulation;
  active: boolean;
  visited: boolean;
  onSelect: (id: SectionId) => void;
};

export default function Planet({ def, sim, active, visited, onSelect }: PlanetProps) {
  const group = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Mesh>(null);
  const moonOrbit = useRef<THREE.Group>(null);
  const orbitRing = useRef<THREE.Mesh>(null);
  const surfaceMesh = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const seed = useMemo(() => seedFrom(def.id), [def.id]);
  const surface = useMemo(() => createPlanetTexture(def.color, def.bandColor, seed, STYLES[def.id]), [def.color, def.bandColor, def.id, seed]);
  const cloudMap = useMemo(() => createCloudTexture(seed + 77), [seed]);
  const ringMap = useMemo(() => createRingTexture(def.ringColor), [def.ringColor]);
  const glowMap = useMemo(() => createGlowTexture(), []);

  /* Real NASA-derived imagery, swapped in over the procedural surface as soon
     as it arrives. Until then the procedural map keeps the planet readable. */
  const realSurface = useRealMap(PLANET_MAPS[def.id]);
  const realBump = useBumpMap(realSurface, STYLES[def.id] === "ocean" ? 1.4 : 3.1);
  const realClouds = useRealAlphaMap(CLOUD_MAPS[def.id]);
  const realRing = useRealAlphaMap(def.ring ? RING_MAP : null);
  const moonTexture = useRealMap(def.moons > 0 ? MOON_MAP : null);

  const activeMap = realSurface ?? surface;
  const activeNormal = realSurface ? realBump : null;

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(def.glowColor) },
      uPower: { value: 2.6 },
      uIntensity: { value: 1.05 },
    }),
    [def.glowColor]
  );

  useEffect(() => {
    atmosphereUniforms.uIntensity.value = hovered || active ? 1.55 : 1.05;
  }, [atmosphereUniforms, hovered, active]);

  // Adding a normal map turns on a shader define the material was compiled
  // without, so the program has to be rebuilt once the bump map lands.
  useEffect(() => {
    const material = surfaceMesh.current?.material as THREE.MeshStandardMaterial | undefined;
    if (material) material.needsUpdate = true;
  }, [activeNormal]);

  useEffect(
    () => () => {
      surface.dispose();
      cloudMap.dispose();
      ringMap.dispose();
      glowMap.dispose();
    },
    [surface, cloudMap, ringMap, glowMap]
  );

  useFrame(() => {
    const position = sim.positions.get(def.id);
    if (group.current && position) {
      group.current.position.copy(position);
      group.current.quaternion.setFromEuler(planetSpin(def, sim.time));
    }
    if (clouds.current) clouds.current.rotation.y = sim.time * 0.035;
    if (moonOrbit.current) moonOrbit.current.rotation.y = sim.time * 0.22;
    if (orbitRing.current) {
      const material = orbitRing.current.material as THREE.MeshBasicMaterial;
      material.opacity = active ? 0.4 : hovered ? 0.28 : 0.11;
    }
  });

  const handleClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (flightInput.suppressClick) {
        flightInput.suppressClick = false;
        return;
      }
      onSelect(def.id);
    },
    [def.id, onSelect]
  );

  const status = active ? "APPROACHING" : hovered ? "DOCK" : visited ? "VISITED" : "CLICK TO DOCK";

  return (
    <group>
      <mesh ref={orbitRing} rotation={[Math.PI / 2 + def.orbitTilt, 0, def.orbitTilt * 0.6]}>
        <ringGeometry args={[def.orbitRadius - 0.6, def.orbitRadius + 0.6, 220]} />
        <meshBasicMaterial
          color={def.glowColor}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group ref={group}>
        <mesh
          ref={surfaceMesh}
          onClick={handleClick}
          onPointerOver={(event) => {
            event.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <sphereGeometry args={[def.radius, 64, 48]} />
          <meshStandardMaterial
            map={activeMap}
            normalMap={activeNormal}
            normalScale={new THREE.Vector2(0.85, 0.85)}
            roughness={SURFACE_ROUGHNESS[STYLES[def.id]]}
            metalness={0.02}
            envMapIntensity={0.4}
            emissive={def.bandColor}
            emissiveIntensity={0.05}
          />
        </mesh>

        {def.id !== "skills" && (
          <mesh ref={clouds}>
            <sphereGeometry args={[def.radius * 1.015, 48, 32]} />
            <meshStandardMaterial
              map={realClouds ?? cloudMap}
              alphaMap={realClouds ?? cloudMap}
              transparent
              opacity={realClouds ? 0.85 : 0.4}
              roughness={1}
              depthWrite={false}
            />
          </mesh>
        )}

        <mesh>
          <sphereGeometry args={[def.radius * 1.06, 48, 32]} />
          <shaderMaterial
            vertexShader={atmosphereVertex}
            fragmentShader={atmosphereFragment}
            uniforms={atmosphereUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <sprite scale={[def.radius * 3.6, def.radius * 3.6, 1]}>
          <spriteMaterial
            map={glowMap}
            color={def.glowColor}
            transparent
            opacity={active ? 0.5 : hovered ? 0.4 : 0.22}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>

        {def.ring && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[def.radius * 1.4, def.radius * 2.6, 128]} />
            <meshBasicMaterial
              map={realRing ?? ringMap}
              alphaMap={realRing ?? ringMap}
              color={def.ringColor}
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}

        {def.moons > 0 && (
          <group ref={moonOrbit} rotation={[0.2, 0, 0.1]}>
            {Array.from({ length: def.moons }, (_, index) => {
              const distance = def.radius * (2.9 + index * 1.1);
              const size = def.radius * (0.16 - index * 0.035);
              const angle = (index / def.moons) * Math.PI * 2;
              return (
                <group key={index} rotation={[0, angle, 0]}>
                  <mesh position={[distance, Math.sin(angle * 2) * def.radius * 0.3, 0]}>
                    <sphereGeometry args={[size, 24, 16]} />
                    <meshStandardMaterial
                      map={moonTexture ?? undefined}
                      color={moonTexture ? "#ffffff" : "#8b93a6"}
                      roughness={0.96}
                      metalness={0.02}
                      envMapIntensity={0.35}
                    />
                  </mesh>
                </group>
              );
            })}
          </group>
        )}

        <Html position={[0, def.radius * 1.45 + 5, 0]} center zIndexRange={[8, 0]}>
          <button
            type="button"
            className="planet-tag"
            data-active={active || undefined}
            data-hovered={hovered || undefined}
            onClick={(event) => {
              event.currentTarget.blur();
              onSelect(def.id);
            }}
          >
            <span className="planet-tag__name" style={{ color: def.glowColor }}>
              {def.label}
            </span>
            <span className="planet-tag__meta">
              {def.title} · {status}
            </span>
          </button>
        </Html>
      </group>
    </group>
  );
}

type PlanetSystemProps = {
  sim: Simulation;
  active: SectionId | null;
  visited: Set<string>;
  onSelect: (id: SectionId) => void;
};

const BELT_ROCKS = ["#a08b74", "#8b93a6", "#c2b3a0", "#6f7686", "#9db8d8"];

type AsteroidBeltProps = {
  radius: number;
  width: number;
  count: number;
  size: number;
  opacity: number;
  spin: number;
  tilt?: [number, number, number];
};

/** A dense drifting rock field circling the system: cheap points, real depth. */
function AsteroidBelt({ radius, width, count, size, opacity, spin, tilt = [0.08, 0, 0.05] }: AsteroidBeltProps) {
  const points = useRef<THREE.Points>(null);
  const texture = useMemo(() => createGlowTexture(), []);
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius + (Math.random() * 2 - 1) * width;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() * 2 - 1) * width * 0.16;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      color.set(BELT_ROCKS[Math.floor(Math.random() * BELT_ROCKS.length)] ?? "#5b6b86");
      const shade = 0.45 + Math.random() * 0.55;
      colors[i * 3] = color.r * shade;
      colors[i * 3 + 1] = color.g * shade;
      colors[i * 3 + 2] = color.b * shade;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [radius, width, count]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * spin;
  });

  return (
    <points ref={points} rotation={tilt} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={texture}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

/** Recomputes every planet's world position once per frame, before the ship flies. */
export function PlanetSystem({ sim, active, visited, onSelect }: PlanetSystemProps) {
  useFrame(({ clock }) => {
    sim.time = clock.elapsedTime;
    for (const def of planets) {
      sim.positions.set(def.id, orbitPosition(def, sim.time, sim.positions.get(def.id)));
    }
  }, -2);

  return (
    <group>
      {planets.map((def) => (
        <Planet
          key={def.id}
          def={def}
          sim={sim}
          active={active === def.id}
          visited={visited.has(def.id)}
          onSelect={onSelect}
        />
      ))}
      <AsteroidBelt radius={195} width={14} count={1400} size={1.6} opacity={0.55} spin={0.012} />
      <AsteroidBelt radius={430} width={26} count={2000} size={2} opacity={0.5} spin={-0.007} />
    </group>
  );
}
