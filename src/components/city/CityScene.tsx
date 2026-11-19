"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  DISTRICTS,
  GRID_H,
  GRID_W,
  type BuildingKey,
  type CityState,
  type DistrictId,
  type Tile,
} from "@/lib/citySim";

const CELL = 2.7;
const HALF_W = (GRID_W * CELL) / 2;
const HALF_H = (GRID_H * CELL) / 2;

function worldX(x: number) {
  return (x + 0.5) * CELL - HALF_W;
}

function worldZ(y: number) {
  return (y + 0.5) * CELL - HALF_H;
}

/** Height and accent for each building type, so the skyline reads at a glance. */
const SHAPES: Record<BuildingKey, { height: number; color: string; width: number }> = {
  home: { height: 1.1, color: "#ffd27a", width: 0.62 },
  farm: { height: 0.5, color: "#8fe6a5", width: 0.78 },
  park: { height: 0.24, color: "#4ade80", width: 0.84 },
  workshop: { height: 1.7, color: "#ff9f45", width: 0.72 },
  cafe: { height: 1.3, color: "#f472b6", width: 0.66 },
  studio: { height: 2.4, color: "#a78bfa", width: 0.62 },
  library: { height: 2.0, color: "#7dd3fc", width: 0.7 },
  landmark: { height: 3.6, color: "#67e8f9", width: 0.5 },
};

const DISTRICT_COLORS: Record<DistrictId, string> = {
  about: "#7fe3ff",
  skills: "#a78bfa",
  projects: "#67e8f9",
  services: "#f472b6",
  experience: "#ffd27a",
  resume: "#94a3b8",
  stats: "#34d399",
  contact: "#fb7185",
};

function EmptyPlot({ x, y, color, onPlot }: { x: number; y: number; color: string; onPlot: (x: number, y: number) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <mesh
      position={[worldX(x), 0.03, worldZ(y)]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(event) => {
        event.stopPropagation();
        onPlot(x, y);
      }}
    >
      <planeGeometry args={[CELL * 0.86, CELL * 0.86]} />
      <meshBasicMaterial color={hover ? color : "#162234"} transparent opacity={hover ? 0.55 : 0.24} />
    </mesh>
  );
}

function Building({ kind, x, y }: { kind: BuildingKey; x: number; y: number }) {
  const shape = SHAPES[kind];
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (glow.current) {
      const material = glow.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 1.6 + x + y) * 0.18;
    }
  });
  return (
    <group position={[worldX(x), 0, worldZ(y)]}>
      <mesh position={[0, shape.height / 2, 0]}>
        <boxGeometry args={[CELL * shape.width, shape.height, CELL * shape.width]} />
        <meshStandardMaterial color="#1d2a3d" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, shape.height + 0.03, 0]}>
        <boxGeometry args={[CELL * shape.width * 0.94, 0.07, CELL * shape.width * 0.94]} />
        <meshStandardMaterial color={shape.color} emissive={shape.color} emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      <mesh ref={glow} position={[0, shape.height * 0.55, CELL * shape.width * 0.5 + 0.02]}>
        <planeGeometry args={[CELL * shape.width * 0.62, 0.12]} />
        <meshBasicMaterial color={shape.color} transparent opacity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

function DistrictMarker({
  id,
  x,
  y,
  visited,
  onDistrict,
}: {
  id: DistrictId;
  x: number;
  y: number;
  visited: boolean;
  onDistrict: (id: DistrictId) => void;
}) {
  const ring = useRef<THREE.Mesh>(null);
  const label = DISTRICTS.find((entry) => entry.id === id);
  const color = DISTRICT_COLORS[id] ?? "#7fe3ff";
  useFrame((state) => {
    if (ring.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + x) * 0.12;
      ring.current.scale.setScalar(pulse);
    }
  });
  return (
    <group position={[worldX(x), 0, worldZ(y)]}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CELL * 0.42, 24]} />
        <meshBasicMaterial color={color} transparent opacity={visited ? 0.32 : 0.18} />
      </mesh>
      <mesh ref={ring} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[CELL * 0.38, CELL * 0.43, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh
        position={[0, 0.9, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onDistrict(id);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <cylinderGeometry args={[0.1, 0.22, 1.8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      <Html position={[0, 2.4, 0]} center distanceFactor={20} style={{ pointerEvents: "none" }}>
        <span className="city__tag" data-visited={visited || undefined}>
          {label?.label ?? id}
        </span>
      </Html>
    </group>
  );
}

function World({
  city,
  selected,
  onPlot,
  onDistrict,
  reduced,
}: {
  city: CityState;
  selected: BuildingKey;
  onPlot: (x: number, y: number) => void;
  onDistrict: (id: DistrictId) => void;
  reduced: boolean;
}) {
  const plots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    city.tiles.forEach((tile, index) => {
      if (tile === null) out.push({ x: index % GRID_W, y: Math.floor(index / GRID_W) });
    });
    return out;
  }, [city.tiles]);

  return (
    <>
      <color attach="background" args={["#050810"]} />
      <fog attach="fog" args={["#050810", 28, 78]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[10, 22, 12]} intensity={1.2} color="#cfe8ff" />
      <pointLight position={[0, 8, 0]} intensity={40} distance={44} color="#38bdf8" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#080e19" roughness={1} />
      </mesh>
      <gridHelper args={[70, 28, "#16304a", "#0d1c2c"]} position={[0, -0.04, 0]} />

      {city.tiles.map((tile: Tile | null, index) => {
        if (tile?.kind !== "road") return null;
        const x = index % GRID_W;
        const y = Math.floor(index / GRID_W);
        return (
          <mesh key={`road-${index}`} position={[worldX(x), 0.01, worldZ(y)]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[CELL, CELL]} />
            <meshBasicMaterial color="#0f1c2b" />
          </mesh>
        );
      })}

      {plots.map((plot) => (
        <EmptyPlot
          key={`plot-${plot.x}-${plot.y}`}
          x={plot.x}
          y={plot.y}
          color={SHAPES[selected].color}
          onPlot={onPlot}
        />
      ))}

      {city.tiles.map((tile, index) => {
        if (tile?.kind !== "building") return null;
        const x = index % GRID_W;
        const y = Math.floor(index / GRID_W);
        return <Building key={`building-${index}`} kind={tile.key} x={x} y={y} />;
      })}

      {city.tiles.map((tile, index) => {
        if (tile?.kind !== "district") return null;
        const x = index % GRID_W;
        const y = Math.floor(index / GRID_W);
        return (
          <DistrictMarker
            key={`district-${index}`}
            id={tile.id}
            x={x}
            y={y}
            visited={city.visited.includes(tile.id)}
            onDistrict={onDistrict}
          />
        );
      })}

      <mesh position={[worldX(5), 0.02, worldZ(3)]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[CELL * 0.5, 6]} />
        <meshBasicMaterial color="#7fe3ff" transparent opacity={0.5} />
      </mesh>

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={16}
        maxDistance={62}
        maxPolarAngle={1.35}
        autoRotate={!reduced}
        autoRotateSpeed={0.35}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function CityScene({
  city,
  selected,
  onPlot,
  onDistrict,
}: {
  city: CityState;
  selected: BuildingKey;
  onPlot: (x: number, y: number) => void;
  onDistrict: (id: DistrictId) => void;
}) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  return (
    <Canvas camera={{ position: [0, 26, 34], fov: 44 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
      <World city={city} selected={selected} onPlot={onPlot} onDistrict={onDistrict} reduced={reduced} />
    </Canvas>
  );
}
