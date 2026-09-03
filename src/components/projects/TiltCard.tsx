"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

/**
 * TiltCard — zero-dependency 3D tilt wrapper.
 * Mouse-tracked rotateX/rotateY + moving spotlight + glare.
 * Respects prefers-reduced-motion, disabled on touch.
 */
export default function TiltCard({
  children,
  accent = "#b8ff4d",
  max = 10,
  className = "",
}: {
  children: ReactNode;
  accent?: string;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, glow: 0 });

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setStyle({
      rx: (0.5 - py) * max * 1.4,
      ry: (px - 0.5) * max * 1.6,
      gx: px * 100,
      gy: py * 100,
      glow: 1,
    });
  };

  const onLeave = () => setStyle({ rx: 0, ry: 0, gx: 50, gy: 50, glow: 0 });

  return (
    <div style={{ perspective: 1100 }}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={className}
        style={{
          transform: `rotateX(${style.rx}deg) rotateY(${style.ry}deg) translateZ(0)`,
          transition: style.glow ? "transform 0.08s linear" : "transform 0.6s cubic-bezier(.2,.75,.2,1)",
          transformStyle: "preserve-3d",
          position: "relative",
        }}
      >
        {children}
        {/* spotlight */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: style.glow ? 1 : 0,
            transition: "opacity .35s",
            background: `radial-gradient(circle at ${style.gx}% ${style.gy}%, ${accent}26, transparent 55%)`,
            mixBlendMode: "screen",
          }}
        />
        {/* glare edge */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            opacity: style.glow ? 0.9 : 0,
            transition: "opacity .35s",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.12), 0 24px 60px -20px ${accent}44`,
          }}
        />
      </div>
    </div>
  );
}
