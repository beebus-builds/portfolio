"use client";

import { useEffect, useRef } from "react";

const CODE_FRAGMENTS = [
  "git commit -m 'fix bug'",
  "sudo rm -rf /",
  "SELECT * FROM users WHERE active = true;",
  "const [state, setState] = useState(null);",
  "pthread_create(&thread, NULL, worker, NULL);",
  "Runtime: O(n log n)",
  "Network: 10.0.0.1 Connected",
  "malloc(sizeof(Node))",
  "async function initNeuralNet()",
  "01000010 01001001 01000010 01000001 01000011 01001000",
  "ssh bibash@himalayas.dev",
  "docker-compose up --build",
  "BinaryTree* root = insert(null, val);",
  "WebSocket.onmessage = (e) => parse(e);",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
}

interface ClickSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  life: number;
  maxLife: number;
  color: string;
}

export default function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 220, isDown: false };
    const sparks: ClickSpark[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
      }
    };

    const handleClick = (e: MouseEvent) => {
      const chars = ["0", "1", "{ }", "</>", "⚡", "404", "sudo", "git", "λ", "ptr", "NULL"];
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          char: chars[Math.floor(Math.random() * chars.length)],
          life: 0,
          maxLife: Math.random() * 40 + 30,
          color: Math.random() > 0.5 ? "#54e6d4" : "#00ff41",
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("click", handleClick);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    let particles: Particle[] = [];

    const initParticles = () => {
      const count = Math.floor((width * height) / 14000);
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          size: Math.random() * 2 + 1,
          baseAlpha: Math.random() * 0.4 + 0.2,
        });
      }
    };

    initParticles();

    // Floating Code lines
    const codeLines = Array.from({ length: Math.floor(width / 220) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.2 + Math.random() * 0.3,
      text: CODE_FRAGMENTS[Math.floor(Math.random() * CODE_FRAGMENTS.length)],
      opacity: Math.random() * 0.15 + 0.03,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation (easing)
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      const isLightMode = document.documentElement.getAttribute("data-theme") === "light";
      const primaryColor = isLightMode ? "16, 21, 22" : "84, 230, 212";
      const accentColor = isLightMode ? "0, 150, 136" : "0, 255, 65";

      // 1. Draw glowing cyberpunk grid lines
      ctx.strokeStyle = isLightMode ? "rgba(16, 21, 22, 0.02)" : "rgba(84, 230, 212, 0.025)";
      ctx.lineWidth = 1;
      const gridSize = 60;
      const offsetX = (mouse.x * 0.02) % gridSize;
      const offsetY = (mouse.y * 0.02) % gridSize;

      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw floating code lines
      ctx.font = "11px var(--font-anon), monospace";
      for (const cl of codeLines) {
        cl.y -= cl.speed;
        if (cl.y < -20) {
          cl.y = height + 20;
          cl.x = Math.random() * width;
          cl.text = CODE_FRAGMENTS[Math.floor(Math.random() * CODE_FRAGMENTS.length)];
        }
        ctx.fillStyle = isLightMode ? `rgba(16, 21, 22, ${cl.opacity})` : `rgba(84, 230, 212, ${cl.opacity})`;
        ctx.fillText(cl.text, cl.x, cl.y);
      }

      // 3. Update & Draw Particles (Constellation mesh)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction (repulsion & attraction)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          p.x -= (dx / dist) * force * 2.5;
          p.y -= (dy / dist) * force * 2.5;
        }

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = dist < mouse.radius ? `rgba(${accentColor}, 0.9)` : `rgba(${primaryColor}, ${p.baseAlpha})`;
        ctx.fill();

        // Connect to mouse if close
        if (dist < mouse.radius) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${accentColor}, ${(1 - dist / mouse.radius) * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Connect neighboring particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const ndx = p2.x - p.x;
          const ndy = p2.y - p.y;
          const ndist = Math.sqrt(ndx * ndx + ndy * ndy);

          if (ndist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${primaryColor}, ${(1 - ndist / 110) * 0.15})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // 4. Render click sparks / code fragments
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life++;

        const progress = s.life / s.maxLife;
        const alpha = 1 - progress;

        if (s.life >= s.maxLife) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.font = "bold 12px monospace";
        ctx.fillStyle = s.color === "#54e6d4" ? `rgba(84, 230, 212, ${alpha})` : `rgba(0, 255, 65, ${alpha})`;
        ctx.fillText(s.char, s.x, s.y);
      }

      // 5. Draw radar scanner / cursor aura circle
      if (mouse.x > 0 && mouse.y > 0) {
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.strokeStyle = isLightMode ? "rgba(16, 21, 22, 0.04)" : "rgba(84, 230, 212, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-90 transition-opacity duration-500"
      aria-hidden
    />
  );
}
