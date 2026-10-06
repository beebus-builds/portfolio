"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

type Rock = { x: number; y: number; r: number; vy: number; spin: number; angle: number };

const WIDTH = 520;
const HEIGHT = 560;
const SHIP_R = 13;

/** 2D asteroid dodge: steer with A/D or drag, survive for score. */
export default function Arcade({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const [over, setOver] = useState(false);
  const keys = useRef<Record<string, boolean>>({});
  const pointerX = useRef<number | null>(null);
  const state = useRef({ shipX: WIDTH / 2, rocks: [] as Rock[], score: 0, running: true, spawn: 0 });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/highscore")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setBest(Number(data.best ?? 0));
      })
      .catch(() => {
        /* best score simply stays unknown */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveScore = useCallback((value: number) => {
    fetch("/api/highscore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: value }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.score) setBest((current) => Math.max(current ?? 0, Number(data.score)));
      })
      .catch(() => {
        /* best effort */
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    const spawnRock = (): Rock => {
      const r = 12 + Math.random() * 26;
      return {
        x: Math.random() * WIDTH,
        y: -r * 2,
        r,
        vy: 70 + Math.random() * 130 + state.current.score / 40,
        spin: (Math.random() - 0.5) * 2,
        angle: Math.random() * Math.PI,
      };
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;

      if (s.running) {
        const steer = (keys.current["ArrowRight"] || keys.current["KeyD"] ? 1 : 0) - (keys.current["ArrowLeft"] || keys.current["KeyA"] ? 1 : 0);
        if (steer) s.shipX += steer * 380 * dt;
        else if (pointerX.current !== null) s.shipX += (pointerX.current - s.shipX) * Math.min(1, dt * 9);
        s.shipX = Math.max(SHIP_R, Math.min(WIDTH - SHIP_R, s.shipX));

        s.spawn -= dt;
        if (s.spawn <= 0) {
          s.spawn = Math.max(0.22, 0.85 - s.score / 900);
          s.rocks.push(spawnRock());
        }

        for (const rock of s.rocks) {
          rock.y += rock.vy * dt;
          rock.angle += rock.spin * dt;
        }
        s.rocks = s.rocks.filter((rock) => rock.y < HEIGHT + rock.r * 2);

        s.score += dt * 10;
        for (const rock of s.rocks) {
          const dx = rock.x - s.shipX;
          const dy = rock.y - HEIGHT - 70;
          if (dx * dx + dy * dy < (rock.r + SHIP_R) ** 2) {
            s.running = false;
            const final = Math.floor(s.score);
            setScore(final);
            setOver(true);
            saveScore(final);
            break;
          }
        }
      }

      ctx.fillStyle = "#01030a";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let x = 0; x < WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
      }

      for (const rock of s.rocks) {
        ctx.save();
        ctx.translate(rock.x, rock.y);
        ctx.rotate(rock.angle);
        ctx.fillStyle = "#5b6b86";
        ctx.beginPath();
        ctx.moveTo(rock.r, 0);
        for (let i = 1; i < 9; i += 1) {
          const angle = (i / 8) * Math.PI * 2;
          const radius = rock.r * (0.72 + Math.random() * 0.28);
          ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const shipY = HEIGHT - 70;
      ctx.fillStyle = "#8ad6ff";
      ctx.beginPath();
      ctx.moveTo(s.shipX, shipY - SHIP_R);
      ctx.lineTo(s.shipX - SHIP_R, shipY + SHIP_R);
      ctx.lineTo(s.shipX + SHIP_R, shipY + SHIP_R);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(138,214,255,0.35)";
      ctx.fillRect(s.shipX - 3, shipY + SHIP_R, 6, 14 + Math.sin(now / 90) * 5);

      setScore(Math.floor(s.score));
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [saveScore]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current[event.code] = true;
    };
    const up = (event: KeyboardEvent) => {
      keys.current[event.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <motion.div
      className="arcade"
      role="dialog"
      aria-label="Asteroid field mini-game"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
    >
      <header className="arcade__bar">
        <b>ASTEROID FIELD</b>
        <span>
          SCORE {score}
          {best !== null && ` · BEST ${Math.max(best, score)}`}
        </span>
        <button type="button" onClick={onClose} aria-label="Close mini-game">
          ✕
        </button>
      </header>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointerX.current = ((event.clientX - rect.left) / rect.width) * WIDTH;
        }}
        onPointerMove={(event) => {
          if (event.buttons === 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          pointerX.current = ((event.clientX - rect.left) / rect.width) * WIDTH;
        }}
      />
      <footer className="arcade__hint">
        {over ? (
          <>
            <b>Score {score}</b>
            <button
              type="button"
              onClick={() => {
                state.current = { shipX: WIDTH / 2, rocks: [], score: 0, running: true, spawn: 0.4 };
                setScore(0);
                setOver(false);
              }}
            >
              Fly again
            </button>
          </>
        ) : (
          <>A / D or drag to steer · survive as long as you can</>
        )}
      </footer>
    </motion.div>
  );
}