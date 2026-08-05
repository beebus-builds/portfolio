"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import type { GameState, Move, PieceType, Color } from "@/lib/chess";

interface ChessBoardThreeJSProps {
  game: GameState;
  selected: number | null;
  legalTargets: Set<number>;
  inCheckKing: number | null;
  lastMove: Move | null;
  boardFlipped: boolean;
  onSquareClick: (idx: number) => void;
}

const LIGHT = "#e8dcc8";
const DARK = "#8b6d4a";
const HIGHLIGHT_LAST = "#4af0ff";
const HIGHLIGHT_SEL = "#4af0ff";
const HIGHLIGHT_TARGET = "#4af0ff";
const HIGHLIGHT_CHECK = "#ff4444";

function sqTo3D(idx: number, flipped: boolean): [number, number, number] {
  let row = idx >> 3;
  let col = idx & 7;
  if (flipped) { row = 7 - row; col = 7 - col; }
  return [(col - 3.5) * 1.05, 0.01, (row - 3.5) * -1.05];
}

function BoardSquares({
  flipped, lastMove, selected, legalTargets, inCheckKing, onSquareClick,
}: {
  flipped: boolean;
  lastMove: Move | null;
  selected: number | null;
  legalTargets: Set<number>;
  inCheckKing: number | null;
  onSquareClick: (idx: number) => void;
}) {
  const meshes = useMemo(() => {
    const result: { idx: number; pos: [number, number, number]; color: string; highlight?: string }[] = [];
    for (let i = 0; i < 64; i++) {
      const row = i >> 3;
      const col = i & 7;
      const isLight = (row + col) % 2 === 0;
      let highlight: string | undefined;
      if (lastMove && (lastMove.from === i || lastMove.to === i)) highlight = HIGHLIGHT_LAST;
      else if (i === inCheckKing) highlight = HIGHLIGHT_CHECK;
      const pos = sqTo3D(i, flipped);
      result.push({ idx: i, pos, color: isLight ? LIGHT : DARK, highlight });
    }
    return result;
  }, [flipped, lastMove, inCheckKing]);

  return (
    <group>
      {meshes.map(({ idx, pos, color, highlight }) => (
        <group key={idx} position={pos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={() => onSquareClick(idx)}>
            <planeGeometry args={[1.02, 1.02]} />
            <meshStandardMaterial color={highlight ?? color} />
          </mesh>
          {idx === selected && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[1.02, 1.02]} />
              <meshStandardMaterial color={HIGHLIGHT_SEL} transparent opacity={0.3} />
            </mesh>
          )}
          {legalTargets.has(idx) && (
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial color={HIGHLIGHT_TARGET} transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

function Piece3D({ type, color, position }: { type: PieceType; color: Color; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const mat = color === "w" ? "#f0ece0" : "#22262e";
  const matDark = color === "w" ? "#d8d4c4" : "#1a1e26";

  useFrame(() => {
    if (ref.current) {
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, position[1], 0.1);
    }
  });

  switch (type) {
    case "p":
      return (
        <group ref={ref} position={position}>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.13, 0.17, 0.28, 12]} />
            <meshStandardMaterial color={mat} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial color={mat} roughness={0.3} />
          </mesh>
        </group>
      );
    case "r":
      return (
        <group ref={ref} position={position}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.15, 0.18, 0.32, 12]} />
            <meshStandardMaterial color={mat} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[0.24, 0.08, 0.24]} />
            <meshStandardMaterial color={matDark} roughness={0.5} />
          </mesh>
        </group>
      );
    case "n":
      return (
        <group ref={ref} position={position}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.15, 0.18, 0.32, 12]} />
            <meshStandardMaterial color={mat} roughness={0.4} />
          </mesh>
          <mesh position={[0.02, 0.38, 0.02]} rotation={[0.25, 0, 0]}>
            <boxGeometry args={[0.14, 0.22, 0.18]} />
            <meshStandardMaterial color={mat} roughness={0.35} />
          </mesh>
        </group>
      );
    case "b":
      return (
        <group ref={ref} position={position}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.15, 0.18, 0.32, 12]} />
            <meshStandardMaterial color={mat} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[0.1, 0.2, 12]} />
            <meshStandardMaterial color={mat} roughness={0.3} />
          </mesh>
        </group>
      );
    case "q":
      return (
        <group ref={ref} position={position}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.17, 0.2, 0.4, 12]} />
            <meshStandardMaterial color={mat} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.46, 0]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color={matDark} roughness={0.25} />
          </mesh>
        </group>
      );
    case "k":
      return (
        <group ref={ref} position={position}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.17, 0.2, 0.4, 12]} />
            <meshStandardMaterial color={mat} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[0.05, 0.14, 0.05]} />
            <meshStandardMaterial color={matDark} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.12, 0.05, 0.05]} />
            <meshStandardMaterial color={matDark} roughness={0.3} />
          </mesh>
        </group>
      );
    default:
      return null;
  }
}

function Pieces({ game, boardFlipped }: { game: GameState; boardFlipped: boolean }) {
  const entries = useMemo(() => {
    const out: { key: string; type: PieceType; color: Color; pos: [number, number, number] }[] = [];
    for (let i = 0; i < 64; i++) {
      const p = game.board[i];
      if (p) {
        const pos = sqTo3D(i, boardFlipped);
        out.push({ key: `${p.color}-${p.type}-${i}`, type: p.type, color: p.color, pos: [pos[0], 0.01, pos[2]] });
      }
    }
    return out;
  }, [game.board, boardFlipped]);

  return (
    <group>
      {entries.map((e) => (
        <Piece3D key={e.key} type={e.type} color={e.color} position={e.pos} />
      ))}
    </group>
  );
}

export default function ChessBoardThreeJS({
  game, selected, legalTargets, inCheckKing, lastMove, boardFlipped, onSquareClick,
}: ChessBoardThreeJSProps) {
  const handleClick = useCallback((idx: number) => onSquareClick(idx), [onSquareClick]);

  return (
    <div className="chess-three-canvas">
      <Canvas
        camera={{ position: [0, 8, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 10, 6]} intensity={0.9} castShadow />
        <directionalLight position={[-3, 6, -4]} intensity={0.3} />
        <BoardSquares
          flipped={boardFlipped}
          lastMove={lastMove}
          selected={selected}
          legalTargets={legalTargets}
          inCheckKing={inCheckKing}
          onSquareClick={handleClick}
        />
        <Pieces game={game} boardFlipped={boardFlipped} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#0a0a1a" />
        </mesh>
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          minDistance={5}
          maxDistance={14}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
