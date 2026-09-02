"use client";

import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
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
    case "torusKnot":
      return <torusKnotGeometry args={[1.1, 0.34, 128, 16]} />;
    case "octahedron":
      return <octahedronGeometry args={[1.5, 0]} />;
    case "dodecahedron":
      return <dodecahedronGeometry args={[1.4, 0]} />;
    case "box":
      return <boxGeometry args={[1.8, 2.2, 1.8]} />;
    default:
      return <icosahedronGeometry args={[1.5, 0]} />;
  }
}

export default function Landmark({
  data,
  vehicleState,
  onProximity,
}: {
  data: LandmarkData;
  vehicleState: { current: VehicleState };
  onProximity: (id: string, near: boolean, data: LandmarkData) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const wasNear = useRef(false);
  const [pos] = useState(() => new THREE.Vector3(...data.position));
  const [tmp] = useState(() => new THREE.Vector3());

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.35;
      mesh.current.rotation.x += delta * 0.12;
    }
    tmp.set(vehicleState.current.position.x, 0, vehicleState.current.position.z);
    const near = pos.distanceTo(tmp) < 4.2;
    if (near !== wasNear.current) {
      wasNear.current = near;
      onProximity(data.id, near, data);
    }
  });

  return (
    <group position={data.position}>
      <mesh ref={mesh} position={[0, 2.4, 0]} castShadow>
        <ShapeGeometry shape={data.shape} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.55} roughness={0.25} metalness={0.4} />
      </mesh>
      <pointLight position={[0, 2.4, 0]} color={data.color} intensity={8} distance={9} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[3.8, 4.2, 48]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}
