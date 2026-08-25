"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageShell from "@/components/PageShell";
import ChessViewport from "@/components/chess/ChessViewport";
import {
  GameState,
  Move,
  PIECE_UNICODE,
  describeMove,
  getStatus,
  initialState,
  isInsufficientMaterial,
  legalMoves,
  makeMove,
  pickAIMove,
  squareName,
  type Color,
  type GameStatus,
  type PieceType,
} from "@/lib/chess";
import { playClick, playTick } from "@/lib/audio";

export const dynamic = "force-dynamic";

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY: Record<Difficulty, { depth: number; randomness: number }> = {
  easy: { depth: 1, randomness: 0.7 },
  medium: { depth: 2, randomness: 0.3 },
  hard: { depth: 3, randomness: 0.1 },
};

const PROMOTION_PIECES: PieceType[] = ["q", "r", "b", "n"];

export default function ChessPage() {
  const [mounted, setMounted] = useState(false);
  const [game, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [aiColor, setAiColor] = useState<Color>("b");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [thinking, setThinking] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(false);
  
  const busyRef = useRef(false);
  const genRef = useRef(0);

  useEffect(() => {
    setGame(initialState());
    setMounted(true);
  }, []);

  const status: GameStatus = useMemo(() => {
    if (!game) return { kind: "playing" };
    const s = getStatus(game);
    if (s.kind === "playing" && isInsufficientMaterial(game)) return { kind: "draw" };
    return s;
  }, [game]);

  const over = status.kind === "checkmate" || status.kind === "stalemate" || status.kind === "draw";
  const aiTurn = !over && !pendingPromotion && game?.turn === aiColor;

  const legalFromSelected = useMemo(() => {
    if (!game || selected === null) return [];
    return legalMoves(game, selected);
  }, [game, selected]);

  const aiMove = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setThinking(true);
    const gen = genRef.current;
    setTimeout(() => {
      setGame((prev) => {
        if (!prev || gen !== genRef.current) return prev;
        const move = pickAIMove(prev, DIFFICULTY[difficulty]);
        return move ? makeMove(prev, move) : prev;
      });
      busyRef.current = false;
      setThinking(false);
      playTick();
    }, 400);
  }, [difficulty]);

  useEffect(() => {
    if (aiTurn) aiMove();
  }, [aiTurn, aiMove]);

  const handleSquareClick = useCallback(
    (idx: number) => {
      playClick();
      if (!game || over || aiTurn || pendingPromotion) return;

      const piece = game.board[idx];
      if (piece && piece.color === game.turn) {
        setSelected(idx);
        return;
      }

      if (selected !== null) {
        const matchingMoves = legalFromSelected.filter((m) => m.to === idx);
        if (matchingMoves.length === 0) {
          setSelected(null);
          return;
        }
        if (matchingMoves.length === 1) {
          const move = matchingMoves[0];
          if (move.promotion) {
            setPendingPromotion(move);
          } else {
            setGame((prev) => (prev ? makeMove(prev, move) : prev));
            setSelected(null);
          }
        } else {
          setPendingPromotion(matchingMoves[0]);
        }
      }
    },
    [over, aiTurn, pendingPromotion, game, selected, legalFromSelected]
  );

  const handlePromotionSelect = (pt: PieceType) => {
    playClick();
    if (!pendingPromotion || !game) return;
    const move: Move = { ...pendingPromotion, promotion: pt };
    setGame((prev) => (prev ? makeMove(prev, move) : prev));
    setPendingPromotion(null);
    setSelected(null);
  };

  const resetGame = () => {
    playClick();
    genRef.current += 1;
    busyRef.current = false;
    setGame(initialState());
    setSelected(null);
    setPendingPromotion(null);
    setThinking(false);
  };

  const legalTargets = useMemo(() => new Set(legalFromSelected.map((m) => m.to)), [legalFromSelected]);

  const inCheckKing = useMemo(() => {
    if (!game) return null;
    if (status.kind === "check" || status.kind === "checkmate") {
      const turnColor = game.turn;
      for (let i = 0; i < 64; i++) {
        const p = game.board[i];
        if (p && p.type.toLowerCase() === "k" && p.color === turnColor) return i;
      }
    }
    return null;
  }, [status, game]);

  const lastMove = game?.history[game.history.length - 1] ?? null;

  if (!mounted || !game) {
    return (
      <PageShell>
        <div className="min-h-[600px] flex items-center justify-center font-mono text-neon-400">
          Loading Tactical Arena...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="comment-label mb-2">Tactical Command Arena</p>
          <h1 className="text-4xl font-mono font-bold text-white tracking-tighter">
            Quantum Chess Lab
          </h1>
          <p className="text-xs font-mono text-white/40 mt-1">
            Immersive WebGL 3D chess arena against hybrid AI engine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Board Arena Viewport */}
          <div className="term-window relative flex flex-col items-center justify-center p-6 bg-terminal-950/40">
            <div className="term-titlebar w-full absolute top-0 left-0 right-0 z-20">
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-path">~/chess_3d_arena.gl</span>
            </div>

            {/* Top Player Indicator (AI / Black) */}
            <div className="w-full flex items-center justify-between mb-4 pt-4 px-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff4af0] shadow-[0_0_8px_#ff4af0]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">AI Engine (Black)</span>
              </div>
              <span className="text-xs font-mono text-white/40">
                {game.turn === "b" && thinking ? <span className="text-[#ff4af0] animate-pulse">Calculating...</span> : ""}
              </span>
            </div>

            {/* 3D WebGL Board */}
            <div className="w-full max-w-[480px] aspect-square relative border-2 border-white/10 rounded-lg overflow-hidden shadow-2xl">
              <ChessViewport
                game={game}
                selected={selected}
                legalTargets={legalTargets}
                inCheckKing={inCheckKing}
                lastMove={lastMove}
                boardFlipped={boardFlipped}
                onSquareClick={handleSquareClick}
              />
            </div>

            {/* Bottom Player Indicator (Player / White) */}
            <div className="w-full flex items-center justify-between mt-4 px-2 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#54e6d4] shadow-[0_0_8px_#54e6d4]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">Player 1 (White)</span>
              </div>
              <span className="text-xs font-mono text-neon-400">
                {game.turn === "w" ? "Your Turn" : ""}
              </span>
            </div>

            {/* Promotion Modal Overlay */}
            {pendingPromotion && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
                <div className="neon-card p-6 max-w-sm w-full text-center">
                  <p className="text-xs font-mono text-white/60 mb-4">Choose Promotion Piece</p>
                  <div className="flex justify-center gap-3">
                    {PROMOTION_PIECES.map((pt) => (
                      <button
                        key={pt}
                        onClick={() => handlePromotionSelect(pt)}
                        className="w-14 h-14 rounded-xl border border-neon-400/30 bg-neon-400/10 text-neon-400 text-3xl font-mono flex items-center justify-center hover:bg-neon-400/25 transition-all"
                      >
                        {PIECE_UNICODE[game.turn][pt]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Controls & Status */}
          <div className="space-y-6">
            <div className="term-window">
              <div className="term-titlebar">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-path">~/match_status.sh</span>
              </div>
              <div className="term-body space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white/50">Turn:</span>
                  <span className={`text-xs font-mono font-bold ${game.turn === "w" ? "text-neon-400" : "text-[#ff4af0]"}`}>
                    {game.turn === "w" ? "White (Player)" : "Black (AI)"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white/50">Status:</span>
                  <span className="text-xs font-mono text-white">
                    {thinking ? (
                      <span className="text-neon-400 animate-pulse">AI Thinking...</span>
                    ) : over ? (
                      <span className="text-red-400 font-bold uppercase">{status.kind}</span>
                    ) : status.kind === "check" ? (
                      <span className="text-amber-400 font-bold">Check!</span>
                    ) : (
                      "Active Game"
                    )}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => { playClick(); setBoardFlipped(!boardFlipped); }}
                    className="btn-ghost flex-1 text-xs py-2 text-center"
                  >
                    Flip Board
                  </button>
                  <button
                    onClick={resetGame}
                    className="btn-neon flex-1 text-xs py-2 text-center"
                  >
                    New Game
                  </button>
                </div>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="term-window">
              <div className="term-titlebar">
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-dot" />
                <span className="term-path">~/ai_engine_config.json</span>
              </div>
              <div className="term-body">
                <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-3">AI Difficulty</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => { playClick(); setDifficulty(d); }}
                      className={`py-2 text-xs font-mono uppercase rounded-lg border transition-all ${
                        difficulty === d
                          ? "border-neon-400 bg-neon-400/15 text-neon-400 font-bold"
                          : "border-white/10 text-white/40 hover:text-white"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
