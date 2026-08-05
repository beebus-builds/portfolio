"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PageShell from "@/components/PageShell";
import {
  FILES,
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

const ChessBoardThreeJS = dynamic(() => import("@/components/chess/ChessBoardThreeJS"), { ssr: false });
const ChessBoardHybrid = dynamic(() => import("@/components/chess/ChessBoardHybrid"), { ssr: false });

type Difficulty = "easy" | "medium" | "hard";
type ViewMode = "2d" | "perspective" | "isometric" | "3d" | "hybrid";

const DIFFICULTY: Record<Difficulty, { depth: number; randomness: number }> = {
  easy: { depth: 1, randomness: 0.7 },
  medium: { depth: 2, randomness: 0.3 },
  hard: { depth: 3, randomness: 0.1 },
};

const PROMOTION_PIECES: PieceType[] = ["q", "r", "b", "n"];
const PIECE_VALUE_ORDER: Record<PieceType, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 };

export default function ChessPage() {
  const [game, setGame] = useState<GameState>(() => initialState());
  const [selected, setSelected] = useState<number | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<Move | null>(null);
  const [aiColor, setAiColor] = useState<Color>("b");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [thinking, setThinking] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("2d");
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const genRef = useRef(0);

  const status: GameStatus = useMemo(() => {
    const s = getStatus(game);
    if (s.kind === "playing" && isInsufficientMaterial(game)) return { kind: "draw" };
    return s;
  }, [game]);
  const over = status.kind === "checkmate" || status.kind === "stalemate" || status.kind === "draw";
  const aiTurn = !over && !pendingPromotion && game.turn === aiColor;

  const legalFromSelected = useMemo(() => {
    if (selected === null) return [];
    return legalMoves(game, selected);
  }, [game, selected]);

  const promoteTargets = useMemo(() => {
    if (pendingPromotion) return { from: pendingPromotion.from, to: pendingPromotion.to };
    return null;
  }, [pendingPromotion]);

  const aiMove = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    setThinking(true);
    const gen = genRef.current;
    setTimeout(() => {
      setGame((prev) => {
        if (gen !== genRef.current) return prev;
        const move = pickAIMove(prev, DIFFICULTY[difficulty]);
        return move ? makeMove(prev, move) : prev;
      });
      busyRef.current = false;
      setThinking(false);
    }, 350);
  }, [difficulty]);

  useEffect(() => {
    if (aiTurn) aiMove();
  }, [aiTurn, aiMove]);

  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const is3d = viewMode === "perspective" || viewMode === "isometric" || viewMode === "hybrid";
    if (!is3d) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const baseRx = 50;
      const rx = baseRx - y * 10;
      const rz = viewMode === "isometric" ? -45 + x * 10 : x * 6;
      el.style.setProperty("--rx", `${rx}deg`);
      el.style.setProperty("--rz", `${rz}deg`);
    };

    const handleMouseLeave = () => {
      const rz = viewMode === "isometric" ? -45 : 0;
      el.style.setProperty("--rx", "50deg");
      el.style.setProperty("--rz", `${rz}deg`);
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [viewMode]);

  const captured = useMemo(() => {
    const byWhite: PieceType[] = [];
    const byBlack: PieceType[] = [];
    for (const m of game.history) {
      if (m.captured) {
        if (m.color === "w") byWhite.push(m.captured);
        else byBlack.push(m.captured);
      }
    }
    const sort = (a: PieceType[]) => a.slice().sort((x, y) => PIECE_VALUE_ORDER[y] - PIECE_VALUE_ORDER[x]);
    const score = (a: PieceType[]) => a.reduce((s, p) => s + PIECE_VALUE_ORDER[p], 0);
    return { byWhite: sort(byWhite), byBlack: sort(byBlack), advantage: score(byWhite) - score(byBlack) };
  }, [game.history]);

  const boardSquares = useMemo(() => {
    const squares: number[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const r = boardFlipped ? row : 7 - row;
        const c = boardFlipped ? 7 - col : col;
        squares.push(r * 8 + c);
      }
    }
    return squares;
  }, [boardFlipped]);

  const legalTargets = useMemo(() => new Set(legalFromSelected.map((m) => m.to)), [legalFromSelected]);

  const handleSquareClick = useCallback(
    (idx: number) => {
      if (over || game.turn === aiColor) return;
      if (pendingPromotion) return;

      const piece = game.board[idx];

      if (selected === null) {
        if (piece && piece.color === game.turn) setSelected(idx);
        return;
      }

      if (idx === selected) {
        setSelected(null);
        return;
      }

      if (piece && piece.color === game.turn) {
        setSelected(idx);
        return;
      }

      const move = legalFromSelected.find((m) => m.to === idx);
      if (!move) {
        setSelected(null);
        return;
      }

      if (move.promotion) {
        setPendingPromotion(move);
        return;
      }

      setGame((prev) => makeMove(prev, move));
      setSelected(null);
    },
    [game, selected, legalFromSelected, over, aiColor, pendingPromotion],
  );

  const handlePromotion = useCallback(
    (type: PieceType) => {
      if (!pendingPromotion) return;
      const move: Move = { ...pendingPromotion, promotion: type };
      setGame((prev) => makeMove(prev, move));
      setPendingPromotion(null);
      setSelected(null);
    },
    [pendingPromotion],
  );

  const newGame = useCallback(() => {
    genRef.current++;
    setGame(initialState());
    setSelected(null);
    setPendingPromotion(null);
    busyRef.current = false;
    setThinking(false);
  }, []);

  const undo = useCallback(() => {
    if (game.history.length === 0) return;
    const pop = aiColor === game.history[game.history.length - 1]?.color ? 2 : 1;
    const moves = game.history.slice(0, Math.max(0, game.history.length - pop));
    const state = initialState();
    let s = state;
    for (const m of moves) s = makeMove(s, m);
    setGame(s);
    setSelected(null);
    setPendingPromotion(null);
  }, [game.history, aiColor]);

  const playAs = useCallback(
    (color: Color) => {
      genRef.current++;
      setAiColor(color === "w" ? "b" : "w");
      setGame(initialState());
      setSelected(null);
      setPendingPromotion(null);
      busyRef.current = false;
      setThinking(false);
    },
    [],
  );

  const movesList = useMemo(() => {
    const rows: { n: number; w?: string; b?: string }[] = [];
    for (let i = 0; i < game.history.length; i += 2) {
      const w = describeMove(game.history[i]);
      const b = i + 1 < game.history.length ? describeMove(game.history[i + 1]) : undefined;
      rows.push({ n: Math.floor(i / 2) + 1, w, b });
    }
    return rows;
  }, [game.history]);

  const moveListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (moveListRef.current) {
      moveListRef.current.scrollTop = moveListRef.current.scrollHeight;
    }
  }, [movesList]);

  const statusLabel = (() => {
    if (status.kind === "checkmate") {
      return status.winner === aiColor ? "Checkmate — you win!" : "Checkmate — AI wins";
    }
    if (status.kind === "stalemate") return "Stalemate — draw";
    if (status.kind === "draw") return "Draw";
    if (status.kind === "check") return game.turn === "w" ? "White to move — check!" : "Black to move — check!";
    return game.turn === "w" ? "White to move" : "Black to move";
  })();

  const inCheckKing = useMemo(() => {
    if (status.kind !== "check") return null;
    for (let i = 0; i < 64; i++) {
      const p = game.board[i];
      if (p && p.type === "k" && p.color === game.turn) return i;
    }
    return null;
  }, [status, game.board, game.turn]);

  const light = "bg-white/10";
  const dark = "bg-black/45";

  return (
    <PageShell title="Chess" subtitle="You vs the terminal. White moves first.">
      <div className="mb-8 thread">
        <div className="section-accent" />
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          A fully legal chess engine running in the browser — castling, en passant, promotion, and a minimax
          opponent. Click a piece, click a highlighted square. Beat the terminal at{" "}
          <span className="text-neon-400">hard</span> and maybe it will stop gloating.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,520px)_minmax(0,320px)]">
        <div className="space-y-4">
          <div className="neon-card border border-white/5 rounded-xl bg-terminal-900/80 p-3">
            <div
              ref={boardWrapRef}
              className={`relative aspect-square w-full select-none ${
                viewMode !== "2d" && viewMode !== "3d" ? "chess-board-3d-wrap" : ""
              }`}
              style={{ "--rx": "50deg", "--rz": viewMode === "isometric" ? "-45deg" : "0deg" } as React.CSSProperties}
            >
              {viewMode === "3d" ? (
                <ChessBoardThreeJS
                  game={game}
                  selected={selected}
                  legalTargets={legalTargets}
                  inCheckKing={inCheckKing}
                  lastMove={game.lastMove}
                  boardFlipped={boardFlipped}
                  onSquareClick={handleSquareClick}
                />
              ) : (
                <div
                  key={boardFlipped ? "f" : "n"}
                  className={`chess-board-3d-grid ${
                    viewMode === "perspective"
                      ? "mode-perspective"
                      : viewMode === "isometric"
                        ? "mode-isometric"
                        : viewMode === "hybrid"
                          ? "mode-hybrid"
                          : ""
                  } grid grid-cols-8 h-full w-full rounded-lg overflow-hidden chess-board-flip`}
                >
                  {boardSquares.map((idx, pos) => {
                    const piece = game.board[idx];
                    const isLight = ((idx & 7) + (idx >> 3)) % 2 === 0;
                    const isLast = game.lastMove && (game.lastMove.from === idx || game.lastMove.to === idx);
                    const isSel = selected === idx;
                    const isTarget = legalTargets.has(idx);
                    const isCheck = inCheckKing === idx;
                    const isLanded = game.lastMove?.to === idx && game.history.length > 0;
                    const isCaptureLanding = isLanded && game.lastMove?.captured;
                    const showCol = pos % 8 === 0;
                    const showRow = pos >= 56;
                    const coord = squareName(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSquareClick(idx)}
                        className={`chess-square relative flex items-center justify-center aspect-square ${isLight ? light : dark} ${
                          isLast ? "bg-neon-400/10" : ""
                        } ${isSel ? "bg-neon-400/20 ring-2 ring-inset ring-neon-400/70 chess-square-selected" : ""} ${
                          isCaptureLanding ? "chess-capture-flash" : ""
                        } ${viewMode !== "2d" ? "chess-square-3d" : ""}`}
                        aria-label={coord}
                      >
                        {(showCol || showRow) && (
                          <span
                            className={`absolute text-[9px] font-mono leading-none text-white/25 ${
                              showRow ? "bottom-1 right-1" : "top-1 left-1"
                            }`}
                          >
                            {showCol ? 8 - (idx >> 3) : FILES[idx & 7]}
                          </span>
                        )}
                        {isCheck && (
                          <span className="absolute inset-0 ring-2 ring-inset ring-red-500/70 rounded-sm chess-check-pulse" />
                        )}
                        {piece && (
                          <span
                            className={`relative leading-none text-[clamp(1.6rem,10vw,3rem)] ${
                              piece.color === "w"
                                ? "text-[#f5f2ea] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]"
                                : "text-[#1a1f26] drop-shadow-[0_0_3px_rgba(255,255,255,0.4)]"
                            } ${isLanded ? "chess-piece-land" : ""} ${
                              viewMode !== "2d" ? "chess-piece-float" : ""
                            }`}
                          >
                            {PIECE_UNICODE[piece.color + piece.type]}
                          </span>
                        )}
                        {isTarget && !piece && (
                          <span className="absolute w-3.5 h-3.5 rounded-full bg-neon-400/60 chess-dot-pulse" />
                        )}
                        {isTarget && piece && (
                          <span className="absolute inset-0 ring-4 ring-inset ring-neon-400/50 rounded-sm" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {viewMode === "hybrid" && (
                <ChessBoardHybrid game={game} boardFlipped={boardFlipped} />
              )}

              {pendingPromotion && promoteTargets && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg z-10 chess-overlay">
                  <div className="bg-terminal-900 border border-white/10 rounded-xl p-5 text-center chess-overlay-text">
                    <p className="text-xs font-mono text-white/50 mb-4">Promote pawn</p>
                    <div className="flex gap-2">
                      {(PROMOTION_PIECES as PieceType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handlePromotion(t)}
                          className="w-14 h-14 rounded-lg bg-white/5 hover:bg-neon-400/20 hover:scale-110 active:scale-95 border border-white/10 hover:border-neon-400/40 flex items-center justify-center text-3xl text-[#f5f2ea] transition-all duration-200"
                        >
                          {PIECE_UNICODE[game.turn + t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {thinking && (
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center z-10 pointer-events-none">
                  <span className="flex items-center gap-1.5">
                    <span className="chess-thinking-dot" />
                    <span className="chess-thinking-dot" />
                    <span className="chess-thinking-dot" />
                  </span>
                </div>
              )}

              {over && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center z-20 chess-overlay">
                  <div className="chess-overlay-text text-center px-6">
                    <p className={`text-2xl font-mono mb-1 ${
                      status.kind === "checkmate" && status.winner === aiColor
                        ? "text-neon-400"
                        : status.kind === "checkmate"
                          ? "text-gold-400"
                          : "text-white/70"
                    }`}>
                      {status.kind === "checkmate"
                        ? (status.winner === aiColor ? "You Win!" : "AI Wins!")
                        : status.kind === "stalemate"
                          ? "Stalemate"
                          : "Draw"}
                    </p>
                    <p className="text-xs font-mono text-white/40 mb-6">
                      {status.kind === "checkmate"
                        ? "Checkmate"
                        : status.kind === "stalemate"
                          ? "No legal moves available"
                          : "Insufficient material"}
                    </p>
                    <button
                      type="button"
                      onClick={newGame}
                      className="btn-neon px-6 py-2.5 text-sm font-mono rounded-lg"
                    >
                      New Game
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={newGame} className="btn-neon px-4 py-2 text-xs font-mono rounded-lg">
              New game
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={game.history.length === 0}
              className="btn-ghost px-4 py-2 text-xs font-mono rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={() => setBoardFlipped((v) => !v)}
              className="btn-ghost px-4 py-2 text-xs font-mono rounded-lg"
            >
              Flip
            </button>
            <div className="flex items-center gap-1 ml-auto">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 text-[10px] font-mono rounded-md border transition-all duration-200 capitalize ${
                    difficulty === d
                      ? "border-neon-400/60 bg-neon-400/10 text-neon-400 shadow-[0_0_8px_rgba(74,240,255,0.1)]"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">View</span>
            <div className="flex items-center gap-1">
              {([
                ["2d", "2D"],
                ["perspective", "Perspective"],
                ["isometric", "Isometric"],
                ["3d", "Full 3D"],
                ["hybrid", "Hybrid"],
              ] as [ViewMode, string][]).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 text-[10px] font-mono rounded-md border transition-all duration-200 ${
                    viewMode === v
                      ? "border-neon-400/60 bg-neon-400/10 text-neon-400 shadow-[0_0_8px_rgba(74,240,255,0.1)]"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="neon-card border border-white/5 rounded-xl bg-terminal-900/80 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full ${game.turn === "w" ? "bg-white" : "bg-white/30"}`}
                />
                <span className="text-xs font-mono text-white/60 chess-status-flash" key={statusLabel}>{statusLabel}</span>
              </div>
              {thinking && (
                <span className="flex items-center gap-1 ml-2">
                  <span className="chess-thinking-dot" />
                  <span className="chess-thinking-dot" />
                  <span className="chess-thinking-dot" />
                </span>
              )}
            </div>

            <div className="text-xs font-mono space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-white/30 w-8 shrink-0">You</span>
                <div className="flex flex-wrap gap-0.5">
                  {(aiColor === "b" ? captured.byWhite : captured.byBlack).map((p, i) => (
                    <span key={`${p}-${i}`} className="text-[#8a93a3] chess-captured-new">
                      {PIECE_UNICODE[(aiColor === "b" ? "b" : "w") + p]}
                    </span>
                  ))}
                  {captured.advantage > 0 && (
                    <span className="text-neon-400/70 ml-1">+{captured.advantage}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/30 w-8 shrink-0">AI</span>
                <div className="flex flex-wrap gap-0.5">
                  {(aiColor === "b" ? captured.byBlack : captured.byWhite).map((p, i) => (
                    <span key={`${p}-${i}`} className="text-[#f5f2ea] chess-captured-new">
                      {PIECE_UNICODE[(aiColor === "b" ? "w" : "b") + p]}
                    </span>
                  ))}
                  {captured.advantage < 0 && (
                    <span className="text-neon-400/70 ml-1">+{-captured.advantage}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-white/5 pt-3">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Side</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => playAs("w")}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-mono rounded-md border transition-all duration-200 ${
                    aiColor === "b"
                      ? "border-neon-400/60 bg-neon-400/10 text-neon-400 shadow-[0_0_8px_rgba(74,240,255,0.1)]"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  Play White
                </button>
                <button
                  type="button"
                  onClick={() => playAs("b")}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-mono rounded-md border transition-all duration-200 ${
                    aiColor === "w"
                      ? "border-neon-400/60 bg-neon-400/10 text-neon-400 shadow-[0_0_8px_rgba(74,240,255,0.1)]"
                      : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                  }`}
                >
                  Play Black
                </button>
              </div>
            </div>
          </div>

          <div className="neon-card border border-white/5 rounded-xl bg-terminal-900/80 p-4">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Moves</p>
            {movesList.length === 0 ? (
              <p className="text-xs font-mono text-white/20">No moves yet.</p>
            ) : (
              <div ref={moveListRef} className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 text-xs font-mono max-h-56 overflow-y-auto">
                {movesList.map((row, i) => {
                  const isLastRow = i === movesList.length - 1;
                  const hasBlackMove = !!row.b;
                  return (
                    <div key={row.n} className={`contents ${isLastRow ? "chess-move-new" : ""}`}>
                      <span className="text-white/25">{row.n}.</span>
                      <span className={isLastRow && !hasBlackMove ? "text-neon-400/80" : "text-white/70"}>
                        {row.w}
                      </span>
                      <span className={isLastRow && hasBlackMove ? "text-neon-400/80" : "text-white/40"}>
                        {row.b ?? ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
