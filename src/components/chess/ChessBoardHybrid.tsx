"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import type { GameState, PieceType, Color } from "@/lib/chess";

interface ChessBoardHybridProps {
  game: GameState;
  boardFlipped: boolean;
}

const sqTo3D = (idx: number, flipped: boolean): [number, number, number] => {
  let row = idx >> 3;
  let col = idx & 7;
  if (flipped) { row = 7 - row; col = 7 - col; }
  return [(col - 3.5) * 1.05, 0, (row - 3.5) * -1.05];
};

function Piece({ type, color, position }: { type: PieceType; color: Color; position: [number, number, number] }) {
  const mat = color === "w" ? "#f0ece0" : "#22262e";
  const matDk = color === "w" ? "#d8d4c4" : "#1a1e26";
  switch (type) {
    case "p": return (
      <group position={position}>
        <mesh position={[0, 0.14, 0]}><cylinderGeometry args={[0.13, 0.17, 0.28, 12]} /><meshStandardMaterial color={mat} roughness={0.4} /></mesh>
        <mesh position={[0, 0.32, 0]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color={mat} roughness={0.3} /></mesh>
      </group>
    );
    case "r": return (
      <group position={position}>
        <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.15, 0.18, 0.32, 12]} /><meshStandardMaterial color={mat} roughness={0.4} /></mesh>
        <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.24, 0.08, 0.24]} /><meshStandardMaterial color={matDk} roughness={0.5} /></mesh>
      </group>
    );
    case "n": return (
      <group position={position}>
        <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.15, 0.18, 0.32, 12]} /><meshStandardMaterial color={mat} roughness={0.4} /></mesh>
        <mesh position={[0.02, 0.38, 0.02]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.14, 0.22, 0.18]} /><meshStandardMaterial color={mat} roughness={0.35} /></mesh>
      </group>
    );
    case "b": return (
      <group position={position}>
        <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.15, 0.18, 0.32, 12]} /><meshStandardMaterial color={mat} roughness={0.4} /></mesh>
        <mesh position={[0, 0.4, 0]}><coneGeometry args={[0.1, 0.2, 12]} /><meshStandardMaterial color={mat} roughness={0.3} /></mesh>
      </group>
    );
    case "q": return (
      <group position={position}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.17, 0.2, 0.4, 12]} /><meshStandardMaterial color={mat} roughness={0.4} /></mesh>
        <mesh position={[0, 0.46, 0]}><sphereGeometry args={[0.11, 12, 12]} /><meshStandardMaterial color={matDk} roughness={0.25} /></mesh>
      </group>
    );
    case "k": return (
      <group position={position}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.17, 0.2, 0.4, 12]} /><meshStandardMaterial color={mat} roughness={0.4} /></mesh>
        <mesh position={[0, 0.48, 0]}><boxGeometry args={[0.05, 0.14, 0.05]} /><meshStandardMaterial color={matDk} roughness={0.3} /></mesh>
        <mesh position={[0, 0.52, 0]}><boxGeometry args={[0.12, 0.05, 0.05]} /><meshStandardMaterial color={matDk} roughness={0.3} /></mesh>
      </group>
    );
    default: return null;
  }
}

export default function ChessBoardHybrid({ game, boardFlipped }: ChessBoardHybridProps) {
  const pieces = useMemo(() => {
    const out: { key: string; type: PieceType; color: Color; pos: [number, number, number] }[] = [];
    for (let i = 0; i < 64; i++) {
      const p = game.board[i];
      if (p) {
        const pos = sqTo3D(i, boardFlipped);
        out.push({ key: `${p.color}-${p.type}-${i}`, type: p.type, color: p.color, pos: [pos[0], 0, pos[2]] });
      }
    }
    return out;
  }, [game.board, boardFlipped]);

  return (
    <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden" style={{ zIndex: 5 }}>
      <Canvas
        camera={{ position: [0, 9, 0.001], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 10, 6]} intensity={0.85} />
        <directionalLight position={[-3, 6, -4]} intensity={0.25} />
        {pieces.map((e) => (
          <Piece key={e.key} type={e.type} color={e.color} position={e.pos} />
        ))}
      </Canvas>
    </div>
  );
}
