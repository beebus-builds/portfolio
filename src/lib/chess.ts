export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export interface Piece {
  type: PieceType;
  color: Color;
}

export type Board = (Piece | null)[];

export interface Move {
  from: number;
  to: number;
  piece: PieceType;
  color: Color;
  captured: PieceType | null;
  promotion: PieceType | null;
  isCastle: boolean;
  isEnPassant: boolean;
  isDoublePush: boolean;
}

export interface CastlingRights {
  wk: boolean;
  wq: boolean;
  bk: boolean;
  bq: boolean;
}

export interface GameState {
  board: Board;
  turn: Color;
  rights: CastlingRights;
  ep: number;
  halfmove: number;
  fullmove: number;
  history: Move[];
  lastMove: Move | null;
}

export const FILES = "abcdefgh";

export function squareName(i: number): string {
  return FILES[i & 7] + (8 - (i >> 3));
}

export function indexOf(file: string, rank: number): number {
  const f = FILES.indexOf(file);
  return (8 - rank) * 8 + f;
}

export const PIECE_UNICODE: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};

export function initialBoard(): Board {
  const b: Board = new Array(64).fill(null);
  const back: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
  for (let f = 0; f < 8; f++) {
    b[indexOf(FILES[f], 8)] = { type: back[f], color: "b" };
    b[indexOf(FILES[f], 7)] = { type: "p", color: "b" };
    b[indexOf(FILES[f], 2)] = { type: "p", color: "w" };
    b[indexOf(FILES[f], 1)] = { type: back[f], color: "w" };
  }
  return b;
}

export function initialState(): GameState {
  return {
    board: initialBoard(),
    turn: "w",
    rights: { wk: true, wq: true, bk: true, bq: true },
    ep: -1,
    halfmove: 0,
    fullmove: 1,
    history: [],
    lastMove: null,
  };
}

function isOnBoard(i: number): boolean {
  return i >= 0 && i < 64;
}

const KNIGHT_OFFSETS = [-17, -15, -10, -6, 6, 10, 15, 17];
const KING_OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9];
const BISHOP_DIRS = [-9, -7, 7, 9];
const ROOK_DIRS = [-8, -1, 1, 8];

function isKnightStep(from: number, to: number): boolean {
  const fd = (to & 7) - (from & 7);
  const rd = (to >> 3) - (from >> 3);
  return (Math.abs(fd) === 2 && Math.abs(rd) === 1) || (Math.abs(fd) === 1 && Math.abs(rd) === 2);
}

function onSameRay(d: number, from: number, to: number): boolean {
  const fd = (to & 7) - (from & 7);
  const rd = (to >> 3) - (from >> 3);
  if (d === 1 || d === -1) return rd === 0;
  if (d === 8 || d === -8) return fd === 0;
  return Math.abs(fd) === Math.abs(rd);
}

export function findKing(board: Board, color: Color): number {
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (p && p.type === "k" && p.color === color) return i;
  }
  return -1;
}

export function isSquareAttacked(board: Board, square: number, by: Color): boolean {
  const pawnDir = by === "w" ? 8 : -8;
  for (const d of [pawnDir - 1, pawnDir + 1]) {
    const t = square + d;
    if (isOnBoard(t) && Math.abs((t & 7) - (square & 7)) === 1) {
      const p = board[t];
      if (p && p.type === "p" && p.color === by) return true;
    }
  }
  for (const d of KNIGHT_OFFSETS) {
    const t = square + d;
    if (isOnBoard(t) && isKnightStep(square, t)) {
      const p = board[t];
      if (p && p.type === "n" && p.color === by) return true;
    }
  }
  for (const d of KING_OFFSETS) {
    const t = square + d;
    if (isOnBoard(t) && Math.abs((t & 7) - (square & 7)) <= 1) {
      const p = board[t];
      if (p && p.type === "k" && p.color === by) return true;
    }
  }
  for (const dirs of [BISHOP_DIRS, ROOK_DIRS]) {
    for (const d of dirs) {
      let t = square + d;
      while (isOnBoard(t) && onSameRay(d, square, t)) {
        const p = board[t];
        if (p) {
          const isBishop = p.type === "b" || p.type === "q";
          const isRook = p.type === "r" || p.type === "q";
          if (p.color === by && ((dirs === BISHOP_DIRS && isBishop) || (dirs === ROOK_DIRS && isRook))) return true;
          break;
        }
        t += d;
      }
    }
  }
  return false;
}

function inCheck(board: Board, color: Color): boolean {
  const k = findKing(board, color);
  if (k === -1) return false;
  return isSquareAttacked(board, k, color === "w" ? "b" : "w");
}

function pseudoLegalMoves(state: GameState, from: number): Move[] {
  const { board, turn, rights, ep } = state;
  const piece = board[from];
  if (!piece || piece.color !== turn) return [];
  const moves: Move[] = [];
  const own = piece.color;
  const opp: Color = own === "w" ? "b" : "w";
  const push = own === "w" ? -8 : 8;
  const startRow = own === "w" ? 6 : 1;
  const homeRow = own === "w" ? 7 : 0;
  const promoteRow = own === "w" ? 0 : 7;

  const add = (to: number, captured: PieceType | null, flags?: Partial<Move>) => {
    let promotion: PieceType | null = null;
    if (piece.type === "p" && (to >> 3) === promoteRow) promotion = "q";
    moves.push({
      from,
      to,
      piece: piece.type,
      color: own,
      captured,
      promotion,
      isCastle: false,
      isEnPassant: false,
      isDoublePush: false,
      ...flags,
      ...(promotion ? { promotion } : {}),
    });
  };

  switch (piece.type) {
    case "p": {
      const f1 = from + push;
      if (isOnBoard(f1) && !board[f1]) {
        add(f1, null);
        const f2 = from + push * 2;
        if ((from >> 3) === startRow && !board[f2]) add(f2, null, { isDoublePush: true });
      }
      for (const d of [push - 1, push + 1]) {
        const t = from + d;
        if (!isOnBoard(t)) continue;
        if (Math.abs((t & 7) - (from & 7)) !== 1) continue;
        if (board[t] && board[t]!.color === opp) add(t, board[t]!.type);
        else if (t === ep) add(t, "p", { isEnPassant: true });
      }
      break;
    }
    case "n": {
      for (const d of KNIGHT_OFFSETS) {
        const t = from + d;
        if (!isOnBoard(t) || !isKnightStep(from, t)) continue;
        const p = board[t];
        if (!p || p.color === opp) add(t, p ? p.type : null);
      }
      break;
    }
    case "k": {
      for (const d of KING_OFFSETS) {
        const t = from + d;
        if (!isOnBoard(t)) continue;
        if (Math.abs((t & 7) - (from & 7)) > 1) continue;
        const p = board[t];
        if (!p || p.color === opp) add(t, p ? p.type : null);
      }
      const kSide = own === "w" ? rights.wk : rights.bk;
      const qSide = own === "w" ? rights.wq : rights.bq;
      if (kSide && from === indexOf("e", homeRow === 0 ? 8 : 1)) {
        const rookSq = indexOf("h", homeRow === 0 ? 8 : 1);
        if (!board[from + 1] && !board[from + 2] && board[rookSq]?.type === "r" && board[rookSq]?.color === own) {
          add(from + 2, null, { isCastle: true });
        }
      }
      if (qSide && from === indexOf("e", homeRow === 0 ? 8 : 1)) {
        const rookSq = indexOf("a", homeRow === 0 ? 8 : 1);
        if (!board[from - 1] && !board[from - 2] && !board[from - 3] && board[rookSq]?.type === "r" && board[rookSq]?.color === own) {
          add(from - 2, null, { isCastle: true });
        }
      }
      break;
    }
    case "b":
    case "r":
    case "q": {
      const dirs = piece.type === "b" ? BISHOP_DIRS : piece.type === "r" ? ROOK_DIRS : [...BISHOP_DIRS, ...ROOK_DIRS];
      for (const d of dirs) {
        let t = from + d;
        while (isOnBoard(t) && onSameRay(d, from, t)) {
          const p = board[t];
          if (p) {
            if (p.color === opp) add(t, p.type);
            break;
          }
          add(t, null);
          t += d;
        }
      }
      break;
    }
  }

  return moves;
}

function cloneBoard(b: Board): Board {
  return b.slice();
}

export function makeMove(state: GameState, move: Move): GameState {
  const board = cloneBoard(state.board);
  const rights: CastlingRights = { ...state.rights };
  const piece = move.piece;
  const own = move.color;

  board[move.to] = { type: move.promotion || piece, color: own };
  board[move.from] = null;

  if (move.isEnPassant) {
    board[move.to + (own === "w" ? 8 : -8)] = null;
  }

  if (move.isCastle) {
    if (move.to > move.from) {
      board[move.from + 3] = null;
      board[move.from + 1] = { type: "r", color: own };
    } else {
      board[move.from - 4] = null;
      board[move.from - 1] = { type: "r", color: own };
    }
  }

  if (piece === "k") {
    if (own === "w") { rights.wk = false; rights.wq = false; }
    else { rights.bk = false; rights.bq = false; }
  }
  if (piece === "r") {
    if (own === "w") {
      if (move.from === indexOf("h", 1)) rights.wk = false;
      if (move.from === indexOf("a", 1)) rights.wq = false;
    } else {
      if (move.from === indexOf("h", 8)) rights.bk = false;
      if (move.from === indexOf("a", 8)) rights.bq = false;
    }
  }
  if (move.captured === "r") {
    if (move.to === indexOf("h", 1)) rights.wk = false;
    if (move.to === indexOf("a", 1)) rights.wq = false;
    if (move.to === indexOf("h", 8)) rights.bk = false;
    if (move.to === indexOf("a", 8)) rights.bq = false;
  }

  const ep = move.isDoublePush ? (move.from + move.to) / 2 : -1;
  const isPawn = piece === "p";
  const isCapture = move.captured !== null || move.isEnPassant;

  return {
    board,
    turn: own === "w" ? "b" : "w",
    rights,
    ep,
    halfmove: isPawn || isCapture ? 0 : state.halfmove + 1,
    fullmove: own === "b" ? state.fullmove + 1 : state.fullmove,
    history: [...state.history, move],
    lastMove: move,
  };
}

export function isSquareAttackedAfter(board: Board, square: number, by: Color, move: Move): boolean {
  const b = cloneBoard(board);
  const own = move.color;
  b[move.to] = { type: move.promotion || move.piece, color: own };
  b[move.from] = null;
  if (move.isEnPassant) b[move.to + (own === "w" ? 8 : -8)] = null;
  return isSquareAttacked(b, square, by);
}

export function legalMoves(state: GameState, from: number): Move[] {
  const pseudo = pseudoLegalMoves(state, from);
  const opp: Color = state.turn === "w" ? "b" : "w";
  return pseudo.filter((m) => {
    if (m.isCastle) {
      const k = from;
      const step = m.to > m.from ? 1 : -1;
      if (isSquareAttacked(state.board, k, opp)) return false;
      if (isSquareAttacked(state.board, k + step, opp)) return false;
      if (isSquareAttacked(state.board, m.to, opp)) return false;
      return true;
    }
    const kingSq = m.piece === "k" ? m.to : findKing(state.board, state.turn);
    return !isSquareAttackedAfter(state.board, kingSq, opp, m);
  });
}

export function allLegalMoves(state: GameState): Move[] {
  const out: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (p && p.color === state.turn) out.push(...legalMoves(state, i));
  }
  return out;
}

export function isInCheck(state: GameState): boolean {
  return inCheck(state.board, state.turn);
}

export type GameStatus =
  | { kind: "playing" }
  | { kind: "check" }
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" }
  | { kind: "draw" };

export function getStatus(state: GameState): GameStatus {
  if (isInCheck(state)) {
    if (allLegalMoves(state).length === 0) {
      return { kind: "checkmate", winner: state.turn === "w" ? "b" : "w" };
    }
    return { kind: "check" };
  }
  if (allLegalMoves(state).length === 0) return { kind: "stalemate" };
  return { kind: "playing" };
}

export const PIECE_VALUES: Record<PieceType, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PAWN_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5, 5, 10, 25, 25, 10, 5, 5,
  0, 0, 0, 20, 20, 0, 0, 0,
  5, -5, -10, 0, 0, -10, -5, 5,
  5, 10, 10, -20, -20, 10, 10, 5,
  0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_TABLE = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20, 0, 0, 0, 0, -20, -40,
  -30, 0, 10, 15, 15, 10, 0, -30,
  -30, 5, 15, 20, 20, 15, 5, -30,
  -30, 0, 15, 20, 20, 15, 0, -30,
  -30, 5, 10, 15, 15, 10, 5, -30,
  -40, -20, 0, 5, 5, 0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_TABLE = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 10, 10, 5, 0, -10,
  -10, 5, 5, 10, 10, 5, 5, -10,
  -10, 0, 10, 10, 10, 10, 0, -10,
  -10, 10, 10, 10, 10, 10, 10, -10,
  -10, 5, 0, 0, 0, 0, 5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_TABLE = [
  0, 0, 0, 0, 0, 0, 0, 0,
  5, 10, 10, 10, 10, 10, 10, 5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  -5, 0, 0, 0, 0, 0, 0, -5,
  0, 0, 0, 5, 5, 0, 0, 0,
];

const QUEEN_TABLE = [
  -20, -10, -10, -5, -5, -10, -10, -20,
  -10, 0, 0, 0, 0, 0, 0, -10,
  -10, 0, 5, 5, 5, 5, 0, -10,
  -5, 0, 5, 5, 5, 5, 0, -5,
  0, 0, 5, 5, 5, 5, 0, -5,
  -10, 5, 5, 5, 5, 5, 0, -10,
  -10, 0, 5, 0, 0, 0, 0, -10,
  -20, -10, -10, -5, -5, -10, -10, -20,
];

const KING_MIDDLE_TABLE = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
  20, 20, 0, 0, 0, 0, 20, 20,
  20, 30, 10, 0, 0, 10, 30, 20,
];

const KING_END_TABLE = [
  -50, -40, -30, -20, -20, -30, -40, -50,
  -30, -20, -10, 0, 0, -10, -20, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 30, 40, 40, 30, -10, -30,
  -30, -10, 20, 30, 30, 20, -10, -30,
  -30, -30, 0, 0, 0, 0, -30, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

const TABLES: Record<string, number[]> = {
  p: PAWN_TABLE,
  n: KNIGHT_TABLE,
  b: BISHOP_TABLE,
  r: ROOK_TABLE,
  q: QUEEN_TABLE,
  k: KING_MIDDLE_TABLE,
};

function mirror(i: number): number {
  return (7 - (i >> 3)) * 8 + (i & 7);
}

function endgame(state: GameState): boolean {
  let material = 0;
  for (const p of state.board) {
    if (p && p.type !== "k" && p.type !== "p") material += PIECE_VALUES[p.type];
  }
  return material <= PIECE_VALUES.r + PIECE_VALUES.b;
}

function evaluate(state: GameState): number {
  let score = 0;
  const eg = endgame(state);
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p) continue;
    const sign = p.color === "w" ? 1 : -1;
    const idx = p.color === "w" ? i : mirror(i);
    const table = p.type === "k" && eg ? KING_END_TABLE : TABLES[p.type];
    score += sign * (PIECE_VALUES[p.type] + table[idx]);
  }
  return score;
}

function orderMoves(moves: Move[]): Move[] {
  const score = (m: Move) => {
    let s = 0;
    if (m.captured) s += 10 * PIECE_VALUES[m.captured] - PIECE_VALUES[m.piece];
    if (m.promotion) s += PIECE_VALUES[m.promotion];
    if (m.isCastle) s += 60;
    return s;
  };
  return moves.slice().sort((a, b) => score(b) - score(a));
}

const MATE = 1000000;
const INF = 10000000;

function negamax(state: GameState, depth: number, alpha: number, beta: number): number {
  const moves = allLegalMoves(state);
  if (moves.length === 0) {
    return isInCheck(state) ? -(MATE + depth) : 0;
  }
  if (depth === 0) return evaluate(state);
  let best = -INF;
  for (const m of orderMoves(moves)) {
    const next = makeMove(state, m);
    const score = -negamax(next, depth - 1, -beta, -alpha);
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

export interface AISettings {
  depth: number;
  randomness: number;
}

export function pickAIMove(state: GameState, settings: AISettings): Move | null {
  const moves = allLegalMoves(state);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  let bestScore = -INF;
  const scored: { move: Move; score: number }[] = [];
  for (const m of orderMoves(moves)) {
    const next = makeMove(state, m);
    const score = -negamax(next, settings.depth - 1, -INF, INF);
    scored.push({ move: m, score });
    if (score > bestScore) bestScore = score;
  }

  const noise = settings.randomness * 50;
  let best: Move[] = [];
  let top = -INF;
  for (const { move, score } of scored) {
    const adjusted = score + (Math.random() - 0.5) * noise;
    if (adjusted > top) {
      top = adjusted;
      best = [move];
    } else if (adjusted === top) {
      best.push(move);
    }
  }
  return best[Math.floor(Math.random() * best.length)];
}

export function isInsufficientMaterial(state: GameState): boolean {
  const minors: { type: PieceType; square: number }[] = [];
  for (let i = 0; i < 64; i++) {
    const p = state.board[i];
    if (!p || p.type === "k") continue;
    // Any major piece or pawn means mating material may exist
    if (p.type !== "n" && p.type !== "b") return false;
    minors.push({ type: p.type, square: i });
  }
  if (minors.length <= 1) return true; // K vs K, or K+minor vs K
  // All bishops on the same square color -> no checkmate is possible
  if (minors.every((m) => m.type === "b")) {
    const parity = minors.map((m) => ((m.square & 7) + (m.square >> 3)) % 2);
    return parity.every((c) => c === parity[0]);
  }
  return false;
}

export function describeMove(move: Move): string {
  if (move.isCastle) return move.to > move.from ? "O-O" : "O-O-O";
  const piece = move.piece.toUpperCase();
  const to = squareName(move.to);
  const promo = move.promotion ? "=" + move.promotion.toUpperCase() : "";
  if (move.piece === "p") {
    if (move.captured) {
      const fromFile = FILES[move.from & 7];
      return `${fromFile}x${to}${promo}`;
    }
    return `${to}${promo}`;
  }
  const capture = move.captured ? "x" : "";
  return `${piece}${capture}${to}${promo}`;
}
