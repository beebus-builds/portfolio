"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageShell from "@/components/PageShell";

const ROWS = 20;
const COLS = 40;
const START: [number, number] = [Math.floor(ROWS / 2), 1];
const END: [number, number] = [Math.floor(ROWS / 2), COLS - 2];

type CellType = "wall" | "start" | "end" | "visited" | "path" | "empty";

type Mode = "path" | "sort";

function useSorting() {
  const [arr, setArr] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(40);
  const [algo, setAlgo] = useState<"bubble" | "insertion" | "quick" | "merge">("bubble");
  const [comparing, setComparing] = useState<number[]>([]);
  const [sortedIdx, setSortedIdx] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);

  const reset = useCallback((n = 40) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    aliveRef.current = false;
    setTimeout(() => {
      aliveRef.current = true;
      const values = Array.from({ length: n }, () => Math.floor(Math.random() * 90) + 10);
      setArr(values);
      setComparing([]);
      setSortedIdx([]);
      setRunning(false);
    }, 30);
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const sleep = useCallback(async (ms: number) => {
    return new Promise<void>((resolve) => {
      timerRef.current = setTimeout(resolve, Math.max(1, ms * (60 / speed)));
    });
  }, [speed]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setComparing([]);
    setSortedIdx([]);
    const arrCopy = [...arr];

    if (algo === "bubble") {
      for (let i = 0; i < arrCopy.length; i++) {
        for (let j = 0; j < arrCopy.length - i - 1; j++) {
          if (!aliveRef.current) return;
          setComparing([j, j + 1]);
          await sleep(1);
          if (arrCopy[j] > arrCopy[j + 1]) {
            [arrCopy[j], arrCopy[j + 1]] = [arrCopy[j + 1], arrCopy[j]];
            setArr([...arrCopy]);
          }
        }
        setSortedIdx((p) => [...p, arrCopy.length - 1 - i]);
      }
      setSortedIdx(arrCopy.map((_, i) => i));
    } else if (algo === "insertion") {
      for (let i = 1; i < arrCopy.length; i++) {
        let j = i;
        while (j > 0 && arrCopy[j - 1] > arrCopy[j]) {
          if (!aliveRef.current) return;
          setComparing([j, j - 1]);
          await sleep(1);
          [arrCopy[j - 1], arrCopy[j]] = [arrCopy[j], arrCopy[j - 1]];
          setArr([...arrCopy]);
          j--;
        }
      }
      setSortedIdx(arrCopy.map((_, i) => i));
    } else if (algo === "quick") {
      async function qs(lo: number, hi: number) {
        if (lo >= hi) return;
        const pivot = arrCopy[hi];
        let i = lo;
        for (let j = lo; j < hi; j++) {
          if (!aliveRef.current) return;
          setComparing([j, hi]);
          await sleep(1);
          if (arrCopy[j] < pivot) {
            [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
            i++;
            setArr([...arrCopy]);
          }
        }
        [arrCopy[i], arrCopy[hi]] = [arrCopy[hi], arrCopy[i]];
        setArr([...arrCopy]);
        await qs(lo, i - 1);
        await qs(i + 1, hi);
      }
      await qs(0, arrCopy.length - 1);
      setSortedIdx(arrCopy.map((_, i) => i));
    } else if (algo === "merge") {
      async function merge(lo: number, mid: number, hi: number) {
        const left = arrCopy.slice(lo, mid + 1);
        const right = arrCopy.slice(mid + 1, hi + 1);
        let i = 0, j = 0, k = lo;
        while (i < left.length && j < right.length) {
          if (!aliveRef.current) return;
          setComparing([lo + i, mid + 1 + j]);
          await sleep(1);
          if (left[i] <= right[j]) arrCopy[k++] = left[i++];
          else arrCopy[k++] = right[j++];
          setArr([...arrCopy]);
        }
        while (i < left.length) { arrCopy[k++] = left[i++]; setArr([...arrCopy]); await sleep(1); }
        while (j < right.length) { arrCopy[k++] = right[j++]; setArr([...arrCopy]); await sleep(1); }
      }
      async function ms(lo: number, hi: number) {
        if (lo >= hi) return;
        const mid = Math.floor((lo + hi) / 2);
        await ms(lo, mid);
        await ms(mid + 1, hi);
        await merge(lo, mid, hi);
      }
      await ms(0, arrCopy.length - 1);
      setSortedIdx(arrCopy.map((_, i) => i));
    }

    setComparing([]);
    setRunning(false);
  }, [arr, algo, running, sleep]);

  return { arr, running, speed, setSpeed, algo, setAlgo, comparing, sortedIdx, reset, run };
}

const DIRS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

function usePathfinding() {
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [algo, setAlgo] = useState<"astar" | "dijkstra" | "bfs">("astar");
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [path, setPath] = useState<Set<string>>(new Set());
  const [mouseDown, setMouseDown] = useState(false);
  const start = START;
  const end = END;
  const aliveRef = useRef(true);
  const gridRef = useRef<CellType[][]>([]);

  const buildGrid = useCallback((): CellType[][] => {
    const g: CellType[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) =>
        Math.random() < 0.22 && !((r === START[0] && (c === START[1] || c === END[1])))
          ? "wall"
          : "empty"
      )
    );
    g[START[0]][START[1]] = "start";
    g[END[0]][END[1]] = "end";
    return g;
  }, []);

  useEffect(() => {
    const g = buildGrid();
    gridRef.current = g;
    setGrid(g);
  }, [buildGrid]);

  const reset = useCallback(() => {
    aliveRef.current = false;
    const g = buildGrid();
    gridRef.current = g;
    setGrid(g);
    setVisited(new Set());
    setPath(new Set());
    setRunning(false);
    setTimeout(() => { aliveRef.current = true; }, 30);
  }, [buildGrid]);

  const clearSearch = useCallback(() => {
    aliveRef.current = false;
    setVisited(new Set());
    setPath(new Set());
    setRunning(false);
    setTimeout(() => { aliveRef.current = true; }, 30);
  }, []);

  const toggleWall = useCallback((r: number, c: number) => {
    if (running) return;
    if ((r === START[0] && c === START[1]) || (r === END[0] && c === END[1])) return;
    setGrid((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[r][c] = copy[r][c] === "wall" ? "empty" : "wall";
      gridRef.current = copy;
      return copy;
    });
  }, [running]);

  const sleep = useCallback(async (ms: number) => {
    return new Promise<void>((resolve) => setTimeout(resolve, Math.max(1, ms * (60 / speed))));
  }, [speed]);

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setVisited(new Set());
    setPath(new Set());
    const g = gridRef.current.map((row) => [...row]);

    const key = (r: number, c: number) => `${r},${c}`;
    const [sr, sc] = START;
    const [er, ec] = END;

    const cameFrom = new Map<string, string | null>();
    let done = false;

    if (algo === "astar") {
      const gScore = new Map<string, number>();
      const fScore = new Map<string, number>();
      const open = new Map<string, number>();
      const closed = new Set<string>();
      gScore.set(key(sr, sc), 0);
      fScore.set(key(sr, sc), heuristic(sr, sc, er, ec));
      open.set(key(sr, sc), fScore.get(key(sr, sc))!);
      cameFrom.set(key(sr, sc), null);

      while (open.size > 0) {
        if (!aliveRef.current) break;
        let cur = "";
        let best = Infinity;
        for (const [k, v] of open) {
          if (v < best) { best = v; cur = k; }
        }
        open.delete(cur);
        if (cur === key(er, ec)) { done = true; break; }
        closed.add(cur);
        const [r, c] = cur.split(",").map(Number);
        setVisited((p) => new Set(p).add(cur));
        await sleep(1);

        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          if (g[nr][nc] === "wall") continue;
          const nk = key(nr, nc);
          if (closed.has(nk)) continue;
          const tentative = gScore.get(cur)! + 1;
          if (tentative < (gScore.get(nk) ?? Infinity)) {
            cameFrom.set(nk, cur);
            gScore.set(nk, tentative);
            fScore.set(nk, tentative + heuristic(nr, nc, er, ec));
            open.set(nk, fScore.get(nk)!);
          }
        }
      }
    } else if (algo === "dijkstra") {
      const dist = new Map<string, number>();
      const queue = new Map<string, number>();
      dist.set(key(sr, sc), 0);
      queue.set(key(sr, sc), 0);
      cameFrom.set(key(sr, sc), null);

      while (queue.size > 0) {
        if (!aliveRef.current) break;
        let cur = "";
        let best = Infinity;
        for (const [k, v] of queue) {
          if (v < best) { best = v; cur = k; }
        }
        queue.delete(cur);
        if (cur === key(er, ec)) { done = true; break; }
        const [r, c] = cur.split(",").map(Number);
        setVisited((p) => new Set(p).add(cur));
        await sleep(1);

        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          if (g[nr][nc] === "wall") continue;
          const nk = key(nr, nc);
          const newDist = (dist.get(cur) ?? Infinity) + 1;
          if (newDist < (dist.get(nk) ?? Infinity)) {
            dist.set(nk, newDist);
            queue.set(nk, newDist);
            cameFrom.set(nk, cur);
          }
        }
      }
    } else {
      // BFS
      const frontier: string[] = [key(sr, sc)];
      const seen = new Set<string>([key(sr, sc)]);
      cameFrom.set(key(sr, sc), null);

      while (frontier.length > 0) {
        if (!aliveRef.current) break;
        const cur = frontier.shift()!;
        if (cur === key(er, ec)) { done = true; break; }
        const [r, c] = cur.split(",").map(Number);
        setVisited((p) => new Set(p).add(cur));
        await sleep(1);

        for (const [dr, dc] of DIRS) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
          if (g[nr][nc] === "wall") continue;
          const nk = key(nr, nc);
          if (seen.has(nk)) continue;
          seen.add(nk);
          cameFrom.set(nk, cur);
          frontier.push(nk);
        }
      }
    }

    // Reconstruct path
    if (done) {
      const pathCells = new Set<string>();
      let cur: string | null = key(er, ec);
      while (cur) {
        pathCells.add(cur);
        cur = cameFrom.get(cur) ?? null;
      }
      setPath(pathCells);
    }

    setRunning(false);
  }, [algo, running, sleep]);

  return { grid, running, speed, setSpeed, algo, setAlgo, visited, path, start, end, reset, clearSearch, toggleWall, run, setMouseDown, mouseDown };
}

function heuristic(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

export default function AlgorithmsPage() {
  const [mode, setMode] = useState<Mode>("path");
  const path = usePathfinding();
  const sort = useSorting();

  return (
    <PageShell title="Algorithms" subtitle="Watch code compute — live, in your browser.">
      <section className="mb-8 thread">
        <div className="section-accent" />
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          An interactive playground. Drag to paint walls, pick an algorithm, hit run. For sorting, watch the bars fall into place.
        </p>
      </section>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setMode("path")}
          className={`text-xs font-mono px-4 py-2 rounded-lg border transition-all ${mode === "path" ? "border-neon-400/40 bg-neon-400/10 text-neon-400" : "border-white/10 text-white/40 hover:text-white/70"}`}
        >
          Pathfinding
        </button>
        <button
          onClick={() => setMode("sort")}
          className={`text-xs font-mono px-4 py-2 rounded-lg border transition-all ${mode === "sort" ? "border-neon-400/40 bg-neon-400/10 text-neon-400" : "border-white/10 text-white/40 hover:text-white/70"}`}
        >
          Sorting
        </button>
      </div>

      {mode === "path" ? <PathfindingView {...path} /> : <SortingView {...sort} />}
    </PageShell>
  );
}

interface PathfindingProps {
  grid: CellType[][];
  running: boolean;
  speed: number;
  setSpeed: (n: number) => void;
  algo: string;
  setAlgo: (a: "astar" | "dijkstra" | "bfs") => void;
  visited: Set<string>;
  path: Set<string>;
  start: [number, number];
  end: [number, number];
  reset: () => void;
  clearSearch: () => void;
  toggleWall: (r: number, c: number) => void;
  run: () => void;
  setMouseDown: (b: boolean) => void;
  mouseDown: boolean;
}

function PathfindingView({ grid, running, speed, setSpeed, algo, setAlgo, visited, path, start, end, reset, clearSearch, toggleWall, run, setMouseDown, mouseDown }: PathfindingProps) {
  return (
    <div className="neon-card border border-white/5 rounded-xl p-4 bg-terminal-900/50">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          {(["astar", "dijkstra", "bfs"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              disabled={running}
              className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all capitalize ${algo === a ? "border-neon-400/40 bg-neon-400/10 text-neon-400" : "border-white/10 text-white/40 hover:text-white/70"}`}
            >
              {a === "astar" ? "A*" : a}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30">speed</span>
          <input type="range" min={5} max={100} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-24 accent-cyan-400" />
        </div>
      </div>

      <div
        className="grid gap-px bg-white/5 mb-4"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        onMouseDown={(e) => { e.preventDefault(); setMouseDown(true); }}
        onMouseUp={() => setMouseDown(false)}
        onMouseLeave={() => setMouseDown(false)}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const isStart = r === start[0] && c === start[1];
            const isEnd = r === end[0] && c === end[1];
            const isVisited = visited.has(`${r},${c}`);
            const isPath = path.has(`${r},${c}`);
            let bg = "rgba(255,255,255,0.04)";
            if (cell === "wall") bg = "rgba(74,240,255,0.25)";
            if (isVisited) bg = "rgba(74,240,255,0.35)";
            if (isPath) bg = "rgba(255,215,0,0.8)";
            if (isStart) bg = "#00ff41";
            if (isEnd) bg = "#ff4af0";

            return (
              <div
                key={`${r}-${c}`}
                onMouseDown={() => toggleWall(r, c)}
                onMouseEnter={() => { if (mouseDown) toggleWall(r, c); }}
                className="aspect-square rounded-[2px]"
                style={{ background: bg }}
              />
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={run} disabled={running} className="btn-neon text-xs">
          {running ? "Computing…" : "Run Algorithm"}
        </button>
        <button onClick={clearSearch} disabled={running} className="btn-ghost text-xs">Clear Path</button>
        <button onClick={reset} disabled={running} className="btn-ghost text-xs">New Maze</button>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#00ff41" }} /> start</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#ff4af0" }} /> end</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "rgba(74,240,255,0.35)" }} /> visited</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "rgba(255,215,0,0.8)" }} /> path</span>
        </div>
      </div>
    </div>
  );
}

interface SortingProps {
  arr: number[];
  running: boolean;
  speed: number;
  setSpeed: (n: number) => void;
  algo: string;
  setAlgo: (a: "bubble" | "insertion" | "quick" | "merge") => void;
  comparing: number[];
  sortedIdx: number[];
  reset: () => void;
  run: () => void;
}

function SortingView({ arr, running, speed, setSpeed, algo, setAlgo, comparing, sortedIdx, reset, run }: SortingProps) {
  const max = Math.max(...arr, 100);

  return (
    <div className="neon-card border border-white/5 rounded-xl p-4 bg-terminal-900/50">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex gap-1.5">
          {(["bubble", "insertion", "quick", "merge"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              disabled={running}
              className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all capitalize ${algo === a ? "border-neon-400/40 bg-neon-400/10 text-neon-400" : "border-white/10 text-white/40 hover:text-white/70"}`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-white/30">speed</span>
          <input type="range" min={5} max={100} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-24 accent-cyan-400" />
        </div>
      </div>

      <div className="flex items-end gap-[3px] h-64 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {arr.map((value, i) => {
          const isComparing = comparing.includes(i);
          const isSorted = sortedIdx.includes(i);
          const height = (value / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-[2px] transition-all duration-75"
              style={{
                height: `${height}%`,
                background: isComparing
                  ? "#ff4af0"
                  : isSorted
                    ? "rgba(0,255,65,0.7)"
                    : "rgba(74,240,255,0.55)",
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={run} disabled={running} className="btn-neon text-xs">
          {running ? "Sorting…" : "Sort"}
        </button>
        <button onClick={reset} disabled={running} className="btn-ghost text-xs">New Array</button>
      </div>
    </div>
  );
}
