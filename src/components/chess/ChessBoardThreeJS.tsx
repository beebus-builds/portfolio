"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Center, Float } from "@react-three/drei";
import { useRef, useMemo, useCallback, useState, useEffect } from "react";
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

const LIGHT = "#d1c2a5";
const DARK = "#6e4e30";
const HIGHLIGHT_LAST = "#54e6d4";
const HIGHLIGHT_SEL = "#54e6d4";
const HIGHLIGHT_TARGET = "#54e6d4";
const HIGHLIGHT_CHECK = "#ff4444";

function sqTo3D(idx: number, flipped: boolean): [number, number, number] {
  let row = idx >> 3;
  let col = idx & 7;
  if (flipped) { row = 7 - row; col = 7 - col; }
  return [(col - 3.5) * 1.05, 0.02, (row - 3.5) * -1.05];
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
      {/* Luxurious Obsidian Board Frame with Gold Trim */}
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <boxGeometry args={[9.8, 0.14, 9.8]} />
        <meshStandardMaterial color="#0b0d12" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[9.4, 0.02, 9.4]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>

      {meshes.map(({ idx, pos, color, highlight }) => (
        <group key={idx} position={pos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={() => onSquareClick(idx)} receiveShadow castShadow>
            <planeGeometry args={[1.02, 1.02]} />
            <meshStandardMaterial color={highlight ?? color} roughness={0.2} metalness={0.2} />
          </mesh>
          {idx === selected && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[1.02, 1.02]} />
              <meshStandardMaterial color={HIGHLIGHT_SEL} transparent opacity={0.5} />
            </mesh>
          )}
          {legalTargets.has(idx) && (
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} />
              <meshStandardMaterial color={HIGHLIGHT_TARGET} transparent opacity={0.9} emissive={HIGHLIGHT_TARGET} emissiveIntensity={0.8} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// Ultra-Realistic Procedural 3D Chess Master Sculptures (Staunton Tournament Grade)
function Piece3D({ type, color, position }: { type: PieceType; color: Color; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const isWhite = color === "w";
  
  const baseColor = isWhite ? "#f6f3ed" : "#181b22";
  const trimColor = isWhite ? "#e2ded6" : "#0d1015";
  const metalVal = isWhite ? 0.3 : 0.7;
  const roughVal = isWhite ? 0.25 : 0.2;

  useFrame(() => {
    if (ref.current) {
      ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, position[1], 0.2);
    }
  });

  const tLower = type.toLowerCase() as PieceType;

  return (
    <group ref={ref} position={position}>
      {/* Universal Weighted Staunton Base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.42, 0.06, 24]} />
        <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
      </mesh>
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.35, 0.03, 24]} />
        <meshStandardMaterial color={trimColor} metalness={metalVal} roughness={roughVal} />
      </mesh>

      {/* PAWN */}
      {tLower === "p" && (
        <group position={[0, 0.08, 0]}>
          {/* Tapered Collar */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.24, 0.22, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Ball head */}
          <mesh position={[0, 0.33, 0]} castShadow>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
        </group>
      )}

      {/* ROOK (Castle / Fortress) */}
      {tLower === "r" && (
        <group position={[0, 0.08, 0]}>
          {/* Fluted Column */}
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.24, 0.34, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Collar ring */}
          <mesh position={[0, 0.36, 0]} castShadow>
            <torusGeometry args={[0.2, 0.03, 12, 24]} />
            <meshStandardMaterial color={trimColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Crenellated Battlement Head */}
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.23, 0.2, 0.12, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
        </group>
      )}

      {/* KNIGHT (Sculpted Horse) */}
      {tLower === "n" && (
        <group position={[0, 0.08, 0]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.23, 0.3, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Horse Neck & Head */}
          <mesh position={[0.02, 0.36, 0.06]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[0.16, 0.32, 0.24]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Snout */}
          <mesh position={[0.02, 0.46, -0.06]} rotation={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.1, 0.18, 0.14]} />
            <meshStandardMaterial color={trimColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Mane */}
          <mesh position={[-0.06, 0.38, 0.08]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[0.06, 0.24, 0.08]} />
            <meshStandardMaterial color={trimColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
        </group>
      )}

      {/* BISHOP (Mitre & Split) */}
      {tLower === "b" && (
        <group position={[0, 0.08, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.22, 0.34, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Mitre head */}
          <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0]} castShadow>
            <coneGeometry args={[0.14, 0.32, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Finial ball */}
          <mesh position={[0, 0.6, 0]} castShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={trimColor} metalness={0.8} roughness={0.1} />
          </mesh>
        </group>
      )}

      {/* QUEEN (Coronet Spire) */}
      {tLower === "q" && (
        <group position={[0, 0.08, 0]}>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.24, 0.42, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Coronet collar */}
          <mesh position={[0, 0.46, 0]} castShadow>
            <torusGeometry args={[0.15, 0.04, 16, 24]} />
            <meshStandardMaterial color={trimColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Crown points spires */}
          <mesh position={[0, 0.55, 0]} castShadow>
            <coneGeometry args={[0.14, 0.2, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Golden/Cyan Gem on top */}
          <mesh position={[0, 0.67, 0]} castShadow>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color={isWhite ? "#54e6d4" : "#ff4af0"} emissive={isWhite ? "#54e6d4" : "#ff4af0"} emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* KING (Royal Crown & Cross) */}
      {tLower === "k" && (
        <group position={[0, 0.08, 0]}>
          <mesh position={[0, 0.24, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.26, 0.46, 16]} />
            <meshStandardMaterial color={baseColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          <mesh position={[0, 0.51, 0]} castShadow>
            <boxGeometry args={[0.24, 0.08, 0.24]} />
            <meshStandardMaterial color={trimColor} metalness={metalVal} roughness={roughVal} />
          </mesh>
          {/* Glowing Majestic Cross */}
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.06, 0.16, 0.06]} />
            <meshStandardMaterial color="#54e6d4" emissive="#54e6d4" emissiveIntensity={0.9} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[0.16, 0.05, 0.05]} />
            <meshStandardMaterial color="#54e6d4" emissive="#54e6d4" emissiveIntensity={0.9} metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Pieces({ game, boardFlipped }: { game: GameState; boardFlipped: boolean }) {
  const entries = useMemo(() => {
    const out: { key: string; type: PieceType; color: Color; pos: [number, number, number] }[] = [];
    for (let i = 0; i < 64; i++) {
      const p = game.board[i];
      if (p) {
        const pos = sqTo3D(i, boardFlipped);
        out.push({ key: `${p.color}-${p.type}-${i}`, type: p.type, color: p.color, pos: [pos[0], 0.02, pos[2]] });
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

// Grand Sci-Fi Colosseum Arena & Two Players
function ArenaEnvironment() {
  return (
    <group>
      {/* Massive Arena Floor Platform */}
      <mesh position={[0, -0.35, 0]} receiveShadow>
        <cylinderGeometry args={[10, 10.8, 0.3, 48]} />
        <meshStandardMaterial color="#05070a" metalness={0.95} roughness={0.1} />
      </mesh>
      
      {/* Glowing Neon Cyber Rings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <ringGeometry args={[6.8, 7.0, 48]} />
        <meshStandardMaterial color="#54e6d4" emissive="#54e6d4" emissiveIntensity={1.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]}>
        <ringGeometry args={[9.0, 9.2, 48]} />
        <meshStandardMaterial color="#ff4af0" emissive="#ff4af0" emissiveIntensity={1.0} side={THREE.DoubleSide} />
      </mesh>

      {/* Player 1 Pedestal (White / Human) — white side (negative z, near camera) */}
      <group position={[0, 0, -7.5]}>
        <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.8, 0.3, 24]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.2, 1.35, 24]} />
          <meshStandardMaterial color="#54e6d4" emissive="#54e6d4" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#54e6d4" emissive="#54e6d4" emissiveIntensity={1.2} transparent opacity={0.7} wireframe />
        </mesh>
      </group>

      {/* Player 2 Pedestal (Black / AI Engine) */}
      <group position={[0, 0, 7.5]}>
        <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.8, 0.3, 24]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[1.2, 1.35, 24]} />
          <meshStandardMaterial color="#ff4af0" emissive="#ff4af0" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#ff4af0" emissive="#ff4af0" emissiveIntensity={1.2} transparent opacity={0.7} wireframe />
        </mesh>
      </group>
    </group>
  );
}

export default function ChessBoardThreeJS({
  game, selected, legalTargets, inCheckKing, lastMove, boardFlipped, onSquareClick,
}: ChessBoardThreeJSProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const handleClick = useCallback((idx: number) => onSquareClick(idx), [onSquareClick]);

  if (!isClient) return null;

  return (
    <div className="chess-three-canvas w-full h-full">
      <Canvas
        camera={{ position: [0, 9.5, -8.5], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[7, 16, 8]} intensity={1.6} castShadow />
        <directionalLight position={[-7, 12, -8]} intensity={0.8} />
        <pointLight position={[0, 10, 0]} color="#54e6d4" intensity={1.0} distance={15} />
        
        <ArenaEnvironment />
        <BoardSquares
          flipped={boardFlipped}
          lastMove={lastMove}
          selected={selected}
          legalTargets={legalTargets}
          inCheckKing={inCheckKing}
          onSquareClick={handleClick}
        />
        <Pieces game={game} boardFlipped={boardFlipped} />
        
        <OrbitControls
          enablePan={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={7}
          maxDistance={20}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
