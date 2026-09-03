"use client";

import { useEffect, useRef } from "react";

interface P {
  x: number; y: number; z: number;
  tx: number; ty: number; tz: number;
  vx: number; vy: number;
  c: string; s: number;
}

const COLORS = ["#b8ff4d", "#4af0ff", "#ff4af0", "#ffd700", "#ffffff"];

/** Sample pixel targets for text offscreen. */
function sampleText(text: string, w: number, h: number, density = 4): { x: number; y: number }[] {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.font = `800 ${Math.floor(h * 0.32)}px ui-monospace, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts: { x: number; y: number }[] = [];
  for (let y = 0; y < h; y += density) {
    for (let x = 0; x < w; x += density) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x: x - w / 2, y: h / 2 - y });
    }
  }
  return pts;
}

function shapeTargets(mode: number, n: number, w: number, h: number): { x: number; y: number; z: number }[] {
  const out: { x: number; y: number; z: number }[] = [];
  if (mode === 1) {
    // sphere
    for (let i = 0; i < n; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = Math.min(w, h) * 0.32;
      out.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi) * 0.9,
        z: r * Math.sin(phi) * Math.sin(theta) * 0.6,
      });
    }
  } else if (mode === 2) {
    // wave / hills of Sindhuli
    for (let i = 0; i < n; i++) {
      const x = (i / n - 0.5) * w * 0.9;
      const y = Math.sin(x * 0.02) * h * 0.08 + Math.sin(x * 0.055 + 1) * h * 0.04;
      out.push({ x, y: y + (Math.random() - 0.5) * 8, z: (Math.random() - 0.5) * 120 });
    }
  } else {
    // text
    const pts = sampleText("BIBASH", Math.floor(w), Math.floor(h * 0.6));
    for (let i = 0; i < n; i++) {
      const p = pts.length ? pts[i % pts.length] : { x: 0, y: 0 };
      out.push({ x: p.x * 1.1, y: p.y * 1.1, z: (Math.random() - 0.5) * 40 });
    }
  }
  return out;
}

export default function ParticleMorph({ height = 420, compact = false }: { height?: number; compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(0);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const N = compact ? 700 : 1400;
    const parts: P[] = [];
    const mouse = { x: 9999, y: 9999 };

    const LABELS = ["BIBASH — name", "SPHERE — core", "HILLS — sindhuli"];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(280, rect.width);
      h = height;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      retarget();
    };

    const retarget = () => {
      const targets = shapeTargets(modeRef.current, N, w, h);
      if (!parts.length) {
        for (let i = 0; i < N; i++) {
          const t = targets[i];
          parts.push({
            x: (Math.random() - 0.5) * w, y: (Math.random() - 0.5) * h, z: (Math.random() - 0.5) * 200,
            tx: t.x, ty: t.y, tz: t.z,
            vx: 0, vy: 0,
            c: COLORS[i % COLORS.length], s: 0.6 + Math.random() * 1.6,
          });
        }
      } else {
        for (let i = 0; i < N; i++) {
          const t = targets[i % targets.length];
          parts[i].tx = t.x;
          parts[i].ty = t.y;
          parts[i].tz = t.z;
        }
      }
      if (labelRef.current) labelRef.current.textContent = `◉ ${LABELS[modeRef.current]} — click to morph`;
    };

    const step = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const t = performance.now() * 0.001;
      for (const p of parts) {
        // ease to target
        p.x += (p.tx - p.x) * 0.045;
        p.y += (p.ty - p.y) * 0.045;
        p.z += (p.tz - p.z) * 0.045;
        // gentle float
        const fx = Math.sin(t * 1.4 + p.ty * 0.02) * 0.3;
        const fy = Math.cos(t * 1.1 + p.tx * 0.02) * 0.3;
        // mouse repel
        const dx = cx + p.x + fx - mouse.x;
        const dy = cy - (p.y + fy) - mouse.y;
        // note: canvas y is flipped vs math y; convert
        const d2 = dx * dx + dy * dy;
        let ox = 0;
        let oy = 0;
        if (d2 < 120 * 120) {
          const d = Math.sqrt(d2) || 1;
          const f = ((120 - d) / 120) * 14;
          ox = (dx / d) * f;
          oy = (dy / d) * f;
        }
        const depth = 1 - p.z / 600; // pseudo-3D scale
        const sx = cx + (p.x + fx) * depth + ox;
        const sy = cy - (p.y + fy) * depth + oy;
        const alpha = Math.max(0.15, Math.min(1, depth + 0.25));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.c;
        const r = Math.max(0.4, p.s * depth);
        ctx.fillRect(sx, sy, r, r);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.x = 9999;
      mouse.y = 9999;
    };
    const onClick = () => {
      modeRef.current = (modeRef.current + 1) % 3;
      retarget();
    };

    const io = new IntersectionObserver(([e]) => {
      const vis = e.isIntersecting;
      if (vis && !running) {
        running = true;
        raf = requestAnimationFrame(step);
      } else if (!vis && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    resize();
    if (reduced) {
      // single static render
      step();
      cancelAnimationFrame(raf);
      running = false;
    } else {
      raf = requestAnimationFrame(step);
    }
    const cyc = reduced ? 0 : window.setInterval(() => {
      if (document.hidden) return;
      modeRef.current = (modeRef.current + 1) % 3;
      retarget();
    }, 4500);

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearInterval(cyc);
      io.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      window.removeEventListener("resize", resize);
    };
  }, [height, compact]);

  return (
    <div className="term-window overflow-hidden">
      <div className="term-titlebar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-path">~/particle-lab — morph engine</span>
        <span ref={labelRef} className="ml-auto text-[9px] font-mono text-white/30 hidden sm:block">◉ loading…</span>
      </div>
      <div style={{ position: "relative", height, background: "radial-gradient(ellipse at 50% 110%, #141b0e 0%, #05050a 62%)", cursor: "crosshair" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} aria-label="Interactive particle morph: name, sphere, hills. Click to morph." />
        <div style={{ position: "absolute", left: 14, bottom: 12, fontFamily: "ui-monospace,monospace", fontSize: 10, color: "rgba(255,255,255,.35)", letterSpacing: ".08em", pointerEvents: "none" }}>
          move mouse to repel · click to morph
        </div>
      </div>
    </div>
  );
}
