"use client";

import { useEffect, useRef, useState } from "react";
import { playTick } from "@/lib/audio";

export default function AsciiEngine() {
  const preRef = useRef<HTMLPreElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rotationRef = useRef({ A: 0, B: 0 });
  const dragRef = useRef({ isDragging: false, lastX: 0, lastY: 0 });

  useEffect(() => {
    let animationId: number;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Torus (Donut) parameters
    const R1 = 1;      // Inner radius
    const R2 = 2;      // Outer radius
    const K2 = 5;      // Distance from camera
    // Screen projection scalers
    const screenWidth = 40;
    const screenHeight = 22;
    const K1 = (screenWidth * K2 * 3) / (8 * (R1 + R2));

    const renderFrame = () => {
      // Automatic rotation when not being actively dragged (skipped under reduced motion — drag still works)
      if (!dragRef.current.isDragging && !reducedMotion) {
        rotationRef.current.A += isHovered ? 0.04 : 0.015;
        rotationRef.current.B += isHovered ? 0.025 : 0.01;
      }

      const A = rotationRef.current.A;
      const B = rotationRef.current.B;

      const cosA = Math.cos(A), sinA = Math.sin(A);
      const cosB = Math.cos(B), sinB = Math.sin(B);

      // Initialize buffer grids
      const b: string[] = Array(screenWidth * screenHeight).fill(" ");
      const z: number[] = Array(screenWidth * screenHeight).fill(0);

      // theta loops around the cross-sectional circle of a torus
      for (let theta = 0; theta < 2 * Math.PI; theta += 0.07) {
        const costheta = Math.cos(theta), sintheta = Math.sin(theta);

        // phi loops around the center of revolution of a torus
        for (let phi = 0; phi < 2 * Math.PI; phi += 0.02) {
          const cosphi = Math.cos(phi), sinphi = Math.sin(phi);

          // 3D coordinates of the torus before projection rotation
          const circleX = R2 + R1 * costheta;
          const circleY = R1 * sintheta;

          // 3D coordinate transformations over angles A and B
          const x = circleX * (cosB * cosphi + sinA * sinB * sinphi) - circleY * cosA * sinB;
          const y = circleX * (sinB * cosphi - sinA * cosB * sinphi) + circleY * cosA * cosB;
          const z3D = K2 + cosA * circleX * sinphi + circleY * sinA;
          const ooz = 1 / z3D; // One over Z depth buffer

          // Projected 2D pixel coordinates on screen buffer
          const xp = Math.floor(screenWidth / 2 + K1 * ooz * x * 2); // multiplied by 2 for aspect ratio spacing
          const yp = Math.floor(screenHeight / 2 - K1 * ooz * y);

          // Luminance mapping
          const L = cosphi * costheta * sinB - cosA * costheta * sinphi - sinA * sintheta + cosB * (cosA * sintheta - costheta * sinA * sinphi);

          if (xp >= 0 && xp < screenWidth && yp >= 0 && yp < screenHeight) {
            const idx = xp + yp * screenWidth;
            if (ooz > z[idx]) {
              z[idx] = ooz;
              // Translate luminance into 12 ASCII intensity segments
              const luminanceIdx = Math.floor(L * 8);
              const chars = ".,-~:;=!*#$@";
              b[idx] = chars[Math.max(0, Math.min(chars.length - 1, luminanceIdx))] || ".";
            }
          }
        }
      }

      // Format buffer into readable rows
      let output = "";
      for (let k = 0; k < b.length; k++) {
        output += b[k];
        if ((k + 1) % screenWidth === 0) output += "\n";
      }

      if (preRef.current) {
        preRef.current.textContent = output;
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

  // Drag interaction physics
  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = {
      isDragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    playTick();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    const deltaX = e.clientX - dragRef.current.lastX;
    const deltaY = e.clientY - dragRef.current.lastY;

    rotationRef.current.B += deltaX * 0.01;
    rotationRef.current.A -= deltaY * 0.01;

    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    if (Math.random() < 0.25) playTick(); // Tactile auditory feedback on spin
  };

  const handleMouseUpOrLeave = () => {
    dragRef.current.isDragging = false;
  };

  return (
    <div 
      className="term-window overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseEnter={() => { setIsHovered(true); playTick(); }}
      onMouseLeave={() => { setIsHovered(false); handleMouseUpOrLeave(); }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
    >
      <div className="term-titlebar bg-terminal-950/50">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-path">~/core_3d_renderer.o</span>
      </div>
      <div className="term-body flex flex-col items-center justify-center p-4 bg-terminal-950/20">
        <pre 
          ref={preRef} 
          className="font-mono text-[9px] sm:text-[10px] leading-[0.9] text-neon-400 bg-transparent tracking-[1px] select-none"
        />
        <p className="text-[10px] font-mono text-white/20 mt-3 uppercase tracking-wider">
          Click &amp; Drag to manipulate vectors
        </p>
      </div>
    </div>
  );
}
