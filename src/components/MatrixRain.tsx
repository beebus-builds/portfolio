"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "アィウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/\\#$%&*";

export default function MatrixRain({
  density = 1,
  className = "",
}: {
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cols = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      cols = Math.floor((canvas.width / 16) * density);
      drops = Array.from({ length: cols }, () => Math.floor(Math.random() * (canvas.height / 18)));
    };
    resize();
    window.addEventListener("resize", resize);

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 50) return; // ~20fps, classic matrix feel
      last = t;

      ctx.fillStyle = "rgba(10, 10, 30, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "16px 'Anonymous Pro', monospace";

      for (let i = 0; i < cols; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * 16;
        const y = drops[i] * 18;

        if (Math.random() > 0.975) {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
        } else if (Math.random() > 0.5) {
          // Use --color-neon-400
          const color = getComputedStyle(document.documentElement).getPropertyValue('--color-neon-400').trim();
          ctx.fillStyle = `rgba(${color}, 0.6)`; // This might not work if color is hex
        } else {
          ctx.fillStyle = "rgba(0,255,65,0.5)";
        }

        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > 0.985) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`matrix-rain ${className}`} aria-hidden />;
}
