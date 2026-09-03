"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { VehicleState } from "./Vehicle";

export interface LandmarkData {
  id: string;
  label: string;
  sub: string;
  href: string;
  color: string;
  position: [number, number, number];
  shape: "icosahedron" | "torusKnot" | "octahedron" | "dodecahedron" | "box";
}

function ShapeGeometry({ shape }: { shape: LandmarkData["shape"] }) {
  switch (shape) {
    case "torusKnot": return <torusKnotGeometry args={[1.0, 0.3, 140, 20]} />;
    case "octahedron": return <octahedronGeometry args={[1.35, 0]} />;
    case "dodecahedron": return <dodecahedronGeometry args={[1.25, 0]} />;
    case "box": return <boxGeometry args={[1.6, 1.9, 1.6]} />;
    default: return <icosahedronGeometry args={[1.35, 1]} />;
  }
}

export default function Landmark({ data, vehicleState, onProximity }: {
  data: LandmarkData;
  vehicleState: { current: VehicleState };
  onProximity: (id: string, near: boolean, data: LandmarkData) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const glass = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const halo2 = useRef<THREE.Mesh>(null);
  const beamMat = useRef<THREE.MeshBasicMaterial>(null);
  const glowLight = useRef<THREE.PointLight>(null);
  const pool = useRef<THREE.Mesh>(null);
  const wasNear = useRef(false);
  const [pos] = useState(() => new THREE.Vector3(...data.position));
  const [tmp] = useState(() => new THREE.Vector3());
  const [near, setNear] = useState(false);

  useFrame((scene, delta) => {
    const t = scene.clock.elapsedTime;
    tmp.set(vehicleState.current.position.x, 0, vehicleState.current.position.z);
    const distance = pos.distanceTo(tmp);
    const isNear = distance < 4.8;

    if (mesh.current) {
      mesh.current.rotation.y += delta * (isNear ? 1.1 : 0.45);
      mesh.current.rotation.x += delta * 0.15;
      mesh.current.position.y = 2.5 + Math.sin(t * 1.2 + pos.z) * 0.18;
      const s = isNear ? 1.18 : 1;
      mesh.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, delta * 6));
    }
    if (glass.current) {
      glass.current.rotation.y -= delta * 0.4;
      glass.current.position.y = 2.5 + Math.sin(t * 1.2 + pos.z) * 0.18;
      const s = (isNear ? 1.18 : 1) * 1.22;
      glass.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, delta * 5));
    }
    if (halo.current) {
      halo.current.rotation.z += delta * (isNear ? 1.2 : 0.3);
      const s = isNear ? 1.25 + Math.sin(t * 5) * 0.1 : 1;
      halo.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, delta * 5));
    }
    if (halo2.current) {
      halo2.current.rotation.z -= delta * (isNear ? 0.8 : 0.2);
    }
    if (beamMat.current) {
      beamMat.current.opacity = isNear ? 0.34 + Math.sin(t * 4) * 0.06 : 0.16;
    }
    if (glowLight.current) {
      glowLight.current.intensity = THREE.MathUtils.damp(glowLight.current.intensity, isNear ? 22 : 10, 6, delta);
    }
    if (pool.current) {
      const mat = pool.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, isNear ? 0.6 : 0.3, 6, delta);
    }

    if (isNear !== wasNear.current) {
      wasNear.current = isNear;
      setNear(isNear);
      onProximity(data.id, isNear, data);
    }
  });

  return (
    <group position={data.position}>
      {/* pedestal */}
      <mesh position={[0, 0.22, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.7, 2.0, 0.44, 40]} />
        <meshStandardMaterial color="#0b0b16" roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.55, 1.7, 48]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* vertical light beam */}
      <mesh position={[0, 3.4, 0]}>
        <cylinderGeometry args={[0.55, 0.95, 6.4, 20, 1, true]} />
        <meshBasicMaterial
          ref={beamMat}
          color={data.color}
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* double halo rings */}
      <mesh ref={halo} position={[0, 2.5, 0]}>
        <ringGeometry args={[1.85, 1.98, 56]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.65} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={halo2} position={[0, 2.5, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[2.25, 2.3, 56]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* glass shell */}
      <mesh ref={glass} position={[0, 2.5, 0]}>
        <ShapeGeometry shape={data.shape} />
        <meshPhysicalMaterial
          color={data.color}
          transparent
          opacity={0.28}
          roughness={0.08}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.12}
          transmission={0}
          depthWrite={false}
        />
      </mesh>
      {/* solid emissive core */}
      <mesh ref={mesh} position={[0, 2.5, 0]} castShadow>
        <ShapeGeometry shape={data.shape} />
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={near ? 1.4 : 0.7}
          roughness={0.28}
          metalness={0.35}
          flatShading={data.shape !== "torusKnot"}
        />
      </mesh>

      <pointLight ref={glowLight} position={[0, 2.6, 0]} color={data.color} intensity={10} distance={13} />

      {/* ground pool */}
      <mesh ref={pool} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[2.5, 40]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[3.8, 4.15, 56]} />
        <meshBasicMaterial color={data.color} transparent opacity={near ? 0.7 : 0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* floating HTML label — the AAA touch */}
      <Html position={[0, 4.6, 0]} center distanceFactor={11} style={{ pointerEvents: "none" }}>
        <div
          style={{
            textAlign: "center",
            fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
            transform: `scale(${near ? 1.12 : 1})`,
            transition: "transform .3s",
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: ".22em",
              color: data.color,
              textShadow: `0 0 12px ${data.color}`,
            }}
          >
            {data.label}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "#fff",
              background: "rgba(6,6,14,.78)",
              border: `1px solid ${data.color}66`,
              padding: "5px 12px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              boxShadow: near ? `0 0 24px ${data.color}55` : "0 8px 24px rgba(0,0,0,.5)",
            }}
          >
            {data.sub}
          </div>
          {near && (
            <div
              style={{
                marginTop: 6,
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".12em",
                color: "#08090a",
                background: data.color,
                padding: "4px 12px",
                borderRadius: 6,
                animation: "landmarkPulse 1s ease-in-out infinite",
              }}
            >
              ENTER ⏎
            </div>
          )}
        </div>
        <style>{`@keyframes landmarkPulse{50%{opacity:.65}}`}</style>
      </Html>
    </group>
  );
}
