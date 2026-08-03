"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageShell from "@/components/PageShell";

const PALETTES = [
  { name: "Neon", colors: [0x0a, 0x0f, 0x2a, 74, 240, 255, 255, 215, 0, 255, 74, 240] },
  { name: "Hacker", colors: [0, 0, 0, 0, 255, 65, 74, 240, 255, 255, 255, 255] },
  { name: "Fire", colors: [10, 10, 30, 255, 80, 0, 255, 215, 0, 255, 255, 255] },
];

const MAX_ITER = 200;

export default function FractalsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"mandelbrot" | "julia">("mandelbrot");
  const [palette, setPalette] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ re: -0.7, im: 0 });
  const [juliaConst, setJuliaConst] = useState({ re: -0.7, im: 0.27015 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.createImageData(w, h);
    const data = img.data;

    const pal = PALETTES[palette].colors;
    const halfW = (2.5 / zoom) / 2;
    const halfH = (2.5 / zoom) / 2 * (h / w);
    const reMin = center.re - halfW;
    const imMin = center.im - halfH;

    const cr = juliaConst.re;
    const ci = juliaConst.im;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        let x0 = reMin + (px / w) * (halfW * 2);
        let y0 = imMin + (py / h) * (halfH * 2);

        let x = x0, y = y0;
        if (mode === "julia") {
          x = x0; y = y0;
          x0 = cr; y0 = ci;
        }

        let iter = 0;
        while (x * x + y * y <= 4 && iter < MAX_ITER) {
          const xt = x * x - y * y + x0;
          y = 2 * x * y + y0;
          x = xt;
          iter++;
        }

        const idx = (py * w + px) * 4;
        if (iter === MAX_ITER) {
          data[idx] = pal[0];
          data[idx + 1] = pal[1];
          data[idx + 2] = pal[2];
          data[idx + 3] = 255;
        } else {
          const t = iter / MAX_ITER;
          const seg = t * 3;
          const s = Math.floor(seg);
          const f = seg - s;
          const c1 = s * 3;
          const c2 = (s + 1) * 3;
          data[idx] = Math.round(pal[c1] + (pal[c2] - pal[c1]) * f);
          data[idx + 1] = Math.round(pal[c1 + 1] + (pal[c2 + 1] - pal[c1 + 1]) * f);
          data[idx + 2] = Math.round(pal[c1 + 2] + (pal[c2 + 2] - pal[c1 + 2]) * f);
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(img, 0, 0);
  }, [mode, palette, zoom, center, juliaConst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = Math.min(600, parent.clientWidth * 0.6) * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${Math.min(600, parent.clientWidth * 0.6)}px`;
      render();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [render]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const px = (e.clientX - rect.left) / w;
    const py = (e.clientY - rect.top) / h;

    const halfW = (2.5 / zoom) / 2;
    const halfH = (2.5 / zoom) / 2 * (h / w);
    const reMin = center.re - halfW;
    const imMin = center.im - halfH;

    const clickRe = reMin + px * (halfW * 2);
    const clickIm = imMin + py * (halfH * 2);

    if (mode === "julia") {
      setJuliaConst({ re: clickRe, im: clickIm });
    } else {
      setZoom((z) => z * 2.5);
      setCenter({ re: clickRe, im: clickIm });
    }
  }

  function reset() {
    setZoom(1);
    setCenter({ re: -0.7, im: 0 });
    setJuliaConst({ re: -0.7, im: 0.27015 });
  }

  return (
    <PageShell title="Fractals" subtitle="Infinite complexity from one equation.">
      <section className="mb-8 thread">
        <div className="section-accent" />
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          {mode === "mandelbrot"
            ? "Click anywhere to zoom in 2.5x. Drag to pan. 200 iterations per pixel, rendered live."
            : "Click to set the Julia constant and watch the set morph in real time."}
        </p>
      </section>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode("mandelbrot")}
            className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all capitalize ${mode === "mandelbrot" ? "border-neon-400/40 bg-neon-400/10 text-neon-400" : "border-white/10 text-white/40 hover:text-white/70"}`}
          >
            Mandelbrot
          </button>
          <button
            onClick={() => setMode("julia")}
            className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all capitalize ${mode === "julia" ? "border-neon-400/40 bg-neon-400/10 text-neon-400" : "border-white/10 text-white/40 hover:text-white/70"}`}
          >
            Julia Set
          </button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {PALETTES.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setPalette(i)}
              className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border transition-all ${palette === i ? "border-neon-400/40 text-neon-400" : "border-white/10 text-white/40 hover:text-white/70"}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="neon-card border border-white/5 rounded-xl p-3 bg-terminal-900/50">
        <div className="relative">
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onMouseDown={(e) => setDragStart({ x: e.clientX, y: e.clientY })}
            onMouseUp={(e) => {
              if (!dragStart) return;
              const dx = e.clientX - dragStart.x;
              const dy = e.clientY - dragStart.y;
              if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const rect = canvas.getBoundingClientRect();
                const halfW = (2.5 / zoom) / 2;
                const halfH = (2.5 / zoom) / 2 * (rect.height / rect.width);
                const reShift = (-dx / rect.width) * (halfW * 2);
                const imShift = (-dy / rect.height) * (halfH * 2);
                setCenter((c) => ({ re: c.re + reShift, im: c.im + imShift }));
              }
              setDragStart(null);
            }}
            className="w-full rounded-lg cursor-crosshair select-none"
            style={{ touchAction: "none" }}
          />
          <div className="dark-surface absolute bottom-3 left-3 flex items-center gap-3 text-[10px] font-mono text-white/40 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5 pointer-events-none">
            <span>zoom ×{zoom.toFixed(1)}</span>
            {mode === "julia" && (
              <span>c = {juliaConst.re.toFixed(4)} {juliaConst.im >= 0 ? "+" : "−"} {Math.abs(juliaConst.im).toFixed(4)}i</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={reset} className="btn-ghost text-xs">Reset View</button>
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-white/25">z → z² + c · max {MAX_ITER} iters</span>
      </div>
    </PageShell>
  );
}
