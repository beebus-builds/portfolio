"use client";

import dynamic from "next/dynamic";
import type { GameState, Move } from "@/lib/chess";

const ChessBoardThreeJS = dynamic(() => import("./ChessBoardThreeJS"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full font-mono text-neon-400 text-xs">
      <div className="w-6 h-6 border-2 border-neon-400 border-t-transparent rounded-full animate-spin mb-2" />
      Initializing WebGL 3D Chess Engine...
    </div>
  ),
});

interface ChessViewportProps {
  game: GameState;
  selected: number | null;
  legalTargets: Set<number>;
  inCheckKing: number | null;
  lastMove: Move | null;
  boardFlipped: boolean;
  onSquareClick: (idx: number) => void;
}

export default function ChessViewport(props: ChessViewportProps) {
  return <ChessBoardThreeJS {...props} />;
}
