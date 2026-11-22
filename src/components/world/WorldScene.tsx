"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { World, WorldItem } from "@/lib/pageWorlds";

export type WorldSceneProps = {
  world: World;
  /** 0–1 scroll progress through the page, updated outside React. */
  progress: RefObject<number>;
  /** The section currently being read. */
  active: string | null;
  dark: boolean;
  reduced: boolean;
  onSelect: (target: string) => void;
};

/* ---------- canvas-texture labels (no font downloads) ---------- */

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

type LabelStyle = "tag" | "screen" | "sheet" | "card";

function makeTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** One texture per item and style; the drawing differs per surface. */
function useItemTexture(item: Pick<WorldItem, "label" | "sub" | "color">, style: LabelStyle) {
  return useMemo(() => {
    if (style === "tag") {
      return makeTexture(512, 150, (ctx) => {
        roundRect(ctx, 4, 4, 504, 142, 26);
        ctx.fillStyle = "rgba(6,10,22,0.86)";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = item.color;
        ctx.stroke();
        ctx.fillStyle = "#f1f6fb";
        ctx.font = "600 44px system-ui, sans-serif";
        ctx.fillText(wrap(ctx, item.label, 460)[0] ?? "", 26, 66);
        if (item.sub) {
          ctx.fillStyle = item.color;
          ctx.font = "500 30px ui-monospace, monospace";
          ctx.fillText(item.sub.slice(0, 30), 26, 114);
        }
      });
    }
    if (style === "screen") {
      return makeTexture(640, 380, (ctx) => {
        ctx.fillStyle = "#0a0f1e";
        ctx.fillRect(0, 0, 640, 380);
        ctx.fillStyle = item.color;
        ctx.fillRect(0, 0, 640, 14);
        ctx.globalAlpha = 0.12;
        ctx.fillRect(0, 14, 640, 366);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#f1f6fb";
        ctx.font = "700 54px system-ui, sans-serif";
        wrap(ctx, item.label, 580)
          .slice(0, 3)
          .forEach((line, i) => ctx.fillText(line, 30, 100 + i * 62));
        ctx.fillStyle = item.color;
        ctx.font = "500 30px ui-monospace, monospace";
        if (item.sub) ctx.fillText(item.sub, 30, 330);
        ctx.fillStyle = "#9fb3cc";
        ctx.fillText("open →", 500, 330);
      });
    }
    if (style === "sheet") {
      return makeTexture(420, 560, (ctx) => {
        ctx.fillStyle = "#f6f3ec";
        ctx.fillRect(0, 0, 420, 560);
        ctx.fillStyle = item.color === "#e2e8f0" ? "#334155" : item.color;
        ctx.fillRect(0, 0, 420, 10);
        ctx.fillStyle = "#64748b";
        ctx.font = "500 22px ui-monospace, monospace";
        if (item.sub) ctx.fillText(item.sub.toUpperCase().slice(0, 28), 30, 60);
        ctx.fillStyle = "#0f172a";
        ctx.font = "700 40px system-ui, sans-serif";
        const lines = wrap(ctx, item.label, 360).slice(0, 3);
        lines.forEach((line, i) => ctx.fillText(line, 30, 116 + i * 48));
        ctx.fillStyle = "#cbd5e1";
        for (let i = 0; i < 9; i++) ctx.fillRect(30, 140 + lines.length * 48 + i * 34, 360 - ((i * 53) % 120), 10);
      });
    }
    return makeTexture(640, 400, (ctx) => {
      const gradient = ctx.createLinearGradient(0, 0, 640, 400);
      gradient.addColorStop(0, "#101a33");
      gradient.addColorStop(1, "#060912");
      roundRect(ctx, 0, 0, 640, 400, 34);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = item.color;
      ctx.stroke();
      ctx.fillStyle = item.color;
      ctx.font = "800 120px system-ui, sans-serif";
      ctx.fillText("BP", 40, 150);
      ctx.fillStyle = "#f1f6fb";
      ctx.font = "700 46px system-ui, sans-serif";
      ctx.fillText(item.label, 40, 240);
      ctx.fillStyle = "#9fb3cc";
      ctx.font = "500 28px ui-monospace, monospace";
      (item.sub ?? "").split("\n").forEach((line, i) => ctx.fillText(line, 40, 296 + i * 40));
    });
  }, [item.label, item.sub, item.color, style]);
}

function Tag({ item, position, width = 2.1 }: { item: WorldItem; position: [number, number, number]; width?: number }) {
  const texture = useItemTexture(item, "tag");
  return (
    <sprite position={position} scale={[width, width * (150 / 512), 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </sprite>
  );
}

/* ---------- interaction ---------- */

function Pickable({
  target,
  onSelect,
  children,
  hovered,
}: {
  target: string;
  onSelect: (target: string) => void;
  children: ReactNode;
  hovered?: (on: boolean) => void;
}) {
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (!hover) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);
  return (
    <group
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHover(true);
        hovered?.(true);
      }}
      onPointerOut={() => {
        setHover(false);
        hovered?.(false);
      }}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(target);
      }}
    >
      {children}
    </group>
  );
}

/** Eases a group's scale toward 1, or larger while lit or hovered. */
function useLift(lit: boolean) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const goal = hover ? 1.12 : lit ? 1.06 : 1;
    const k = 1 - Math.exp(-delta * 8);
    ref.current.scale.setScalar(THREE.MathUtils.lerp(ref.current.scale.x, goal, k));
  });
  return { ref, setHover, hover };
}

const isLit = (item: WorldItem, active: string | null) => !!active && item.sections.includes(active);

/* ---------- layouts ---------- */

type LayoutProps = { world: World; active: string | null; reduced: boolean; onSelect: (target: string) => void; progress: RefObject<number> };

function Monitor({ item, lit, onSelect }: { item: WorldItem; lit: boolean; onSelect: (t: string) => void }) {
  const texture = useItemTexture(item, "screen");
  const { ref, setHover, hover } = useLift(lit);
  return (
    <Pickable target={item.target} onSelect={onSelect} hovered={setHover}>
      <group ref={ref}>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[2.1, 1.3, 0.1]} />
          <meshStandardMaterial color="#141a28" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh>
          <planeGeometry args={[2, 1.19]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.95, -0.06]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#141a28" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, -1.26, -0.06]}>
          <boxGeometry args={[0.7, 0.04, 0.4]} />
          <meshStandardMaterial color="#141a28" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.12]}>
          <planeGeometry args={[2.5, 1.7]} />
          <meshBasicMaterial color={item.color} transparent opacity={hover || lit ? 0.35 : 0.08} toneMapped={false} />
        </mesh>
      </group>
    </Pickable>
  );
}

function Gallery({ world, active, reduced, onSelect, progress }: LayoutProps) {
  const ring = useRef<THREE.Group>(null);
  const radius = Math.max(4.2, world.items.length * 0.62);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const spin = (reduced ? 0 : clock.elapsedTime * 0.05) + (progress.current ?? 0) * Math.PI * 1.6;
    ring.current.rotation.y = spin;
  });
  return (
    <group ref={ring} position={[0, 0.4, -radius + 2]}>
      {world.items.map((item, i) => {
        const angle = (i / world.items.length) * Math.PI * 2;
        return (
          <group key={item.target + i} position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]} rotation={[0, angle, 0]}>
            <Monitor item={item} lit={isLit(item, active)} onSelect={onSelect} />
          </group>
        );
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <ringGeometry args={[radius - 0.3, radius + 0.3, 64]} />
        <meshBasicMaterial color={world.accent} transparent opacity={0.18} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Pillar({ item, index, x, z, lit, onSelect }: { item: WorldItem; index: number; x: number; z: number; lit: boolean; onSelect: (t: string) => void }) {
  const body = useRef<THREE.Group>(null);
  const height = 0.4 + (item.value ?? 0.5) * 3.4;
  const born = useRef<number | null>(null);
  const { ref, setHover, hover } = useLift(lit);
  useFrame(({ clock }) => {
    if (!body.current) return;
    born.current ??= clock.elapsedTime;
    const grow = THREE.MathUtils.clamp((clock.elapsedTime - born.current - index * 0.08) / 1.1, 0, 1);
    body.current.scale.y = 0.001 + (1 - Math.pow(1 - grow, 3));
  });
  return (
    <group position={[x, -1.4, z]}>
      <Pickable target={item.target} onSelect={onSelect} hovered={setHover}>
        <group ref={ref}>
          <group ref={body}>
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[0.62, height, 0.62]} />
              <meshStandardMaterial color="#17203a" metalness={0.3} roughness={0.5} emissive={item.color} emissiveIntensity={hover || lit ? 0.35 : 0.08} />
            </mesh>
            <mesh position={[0, height + 0.04, 0]}>
              <boxGeometry args={[0.66, 0.08, 0.66]} />
              <meshBasicMaterial color={item.color} toneMapped={false} />
            </mesh>
          </group>
          <Tag item={item} position={[0, height + 0.5 + (index % 2) * 0.55, 0]} width={1.25} />
        </group>
      </Pickable>
    </group>
  );
}

function Pillars({ world, active, onSelect }: LayoutProps) {
  const count = world.items.length;
  return (
    <group>
      {world.items.map((item, i) => {
        const x = (i - (count - 1) / 2) * 1.15;
        return <Pillar key={item.target} item={item} index={i} x={x} z={-Math.abs(x) * 0.35} lit={isLit(item, active)} onSelect={onSelect} />;
      })}
    </group>
  );
}

const ROAD_STEP = 6.5;

function roadX(z: number) {
  return Math.sin(z * 0.18) * 1.6;
}

function Road({ world, active, onSelect }: LayoutProps) {
  const dashes = useMemo(() => {
    const length = (world.items.length + 1) * ROAD_STEP;
    return Array.from({ length: Math.ceil(length / 0.9) }, (_, i) => -i * 0.9 + 4);
  }, [world.items.length]);
  return (
    <group position={[0, -1.4, 0]}>
      {dashes.map((z) => (
        <group key={z} position={[roadX(z), 0, z]} rotation={[0, Math.cos(z * 0.18) * 0.28, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.4, 0.95]} />
            <meshStandardMaterial color="#141b2d" roughness={0.9} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <planeGeometry args={[0.08, 0.45]} />
            <meshBasicMaterial color={world.accent} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {world.items.map((item, i) => {
        const z = -i * ROAD_STEP - 1;
        const side = i % 2 === 0 ? 1.9 : -1.9;
        return <Milestone key={item.target} item={item} position={[roadX(z) + side, 0, z]} lit={isLit(item, active)} onSelect={onSelect} />;
      })}
    </group>
  );
}

function Milestone({ item, position, lit, onSelect }: { item: WorldItem; position: [number, number, number]; lit: boolean; onSelect: (t: string) => void }) {
  const { ref, setHover } = useLift(lit);
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + position[2]) * 0.12);
  });
  return (
    <group position={position}>
      <Pickable target={item.target} onSelect={onSelect} hovered={setHover}>
        <group ref={ref}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 1.8, 10]} />
            <meshStandardMaterial color="#59627a" metalness={0.6} roughness={0.3} />
          </mesh>
          <Tag item={item} position={[0, 2.1, 0]} width={2.6} />
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.35, 0.48, 32]} />
            <meshBasicMaterial color={item.color} transparent opacity={0.8} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      </Pickable>
    </group>
  );
}

function Peaks({ world, active, reduced, onSelect }: LayoutProps) {
  const card = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const idTexture = useItemTexture({ label: world.title, sub: "Creative developer\nSindhuli, Nepal", color: world.accent }, "card");
  const mountains = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (i - 2) * 2.7 + Math.sin(i * 7.3) * 0.8,
        z: -9 - (i % 3) * 2,
        h: 3 + ((i * 37) % 5) * 0.9,
        r: 2.2 + ((i * 13) % 4) * 0.4,
      })),
    []
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (card.current) {
      card.current.rotation.y = reduced ? 0 : Math.sin(t * 0.4) * 0.35;
      card.current.position.y = 1.1 + (reduced ? 0 : Math.sin(t * 0.8) * 0.08);
    }
    if (orbit.current && !reduced) orbit.current.rotation.y = t * 0.18;
  });
  return (
    <group>
      {mountains.map((m, i) => (
        <group key={i} position={[m.x, -1.5, m.z]}>
          <mesh position={[0, m.h / 2, 0]}>
            <coneGeometry args={[m.r, m.h, 5]} />
            <meshStandardMaterial color={i % 2 ? "#26304f" : "#1d2540"} flatShading roughness={0.9} />
          </mesh>
          <mesh position={[0, m.h * 0.84, 0]}>
            <coneGeometry args={[m.r * 0.33, m.h * 0.32, 5]} />
            <meshStandardMaterial color="#e8eef8" flatShading roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[4.5, 4.2, -12]}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshBasicMaterial color="#fff1c9" toneMapped={false} />
      </mesh>
      <group ref={card} position={[0, 1.1, 0]}>
        <mesh>
          <planeGeometry args={[3.2, 2]} />
          <meshBasicMaterial map={idTexture} transparent side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      <group ref={orbit} position={[0, 1.1, 0]}>
        {world.items.map((item, i) => {
          const angle = (i / world.items.length) * Math.PI * 2;
          return (
            <Gem key={item.label} item={item} position={[Math.sin(angle) * 3.5, Math.sin(angle * 2) * 0.5, Math.cos(angle) * 3.5]} lit={isLit(item, active)} onSelect={onSelect} />
          );
        })}
      </group>
    </group>
  );
}

function Gem({ item, position, lit, onSelect }: { item: WorldItem; position: [number, number, number]; lit: boolean; onSelect: (t: string) => void }) {
  const gem = useRef<THREE.Mesh>(null);
  const { ref, setHover, hover } = useLift(lit);
  useFrame((_, delta) => {
    if (gem.current) gem.current.rotation.y += delta * 0.9;
  });
  return (
    <group position={position}>
      <Pickable target={item.target} onSelect={onSelect} hovered={setHover}>
        <group ref={ref}>
          <mesh ref={gem}>
            <octahedronGeometry args={[0.38, 0]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={hover || lit ? 0.9 : 0.35} flatShading />
          </mesh>
          <Tag item={item} position={[0, 0.75, 0]} width={1.4} />
        </group>
      </Pickable>
    </group>
  );
}

function Orbit({ world, active, reduced, onSelect }: LayoutProps) {
  const core = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (core.current) {
      core.current.rotation.y += delta * 0.4;
      core.current.rotation.x += delta * 0.15;
    }
    if (ring.current && !reduced) ring.current.rotation.y = clock.elapsedTime * 0.12;
  });
  return (
    <group position={[0, 0.6, 0]}>
      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[1.1, 1]} />
          <meshStandardMaterial color={world.accent} wireframe emissive={world.accent} emissiveIntensity={0.6} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.62, 32, 32]} />
          <meshStandardMaterial color={world.accent} emissive={world.accent} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      </group>
      <group ref={ring}>
        {world.items.map((item, i) => {
          const angle = (i / world.items.length) * Math.PI * 2;
          return <Block key={item.target} item={item} position={[Math.sin(angle) * 3.1, Math.cos(angle * 2) * 0.6, Math.cos(angle) * 3.1]} lit={isLit(item, active)} onSelect={onSelect} />;
        })}
      </group>
    </group>
  );
}

function Block({ item, position, lit, onSelect }: { item: WorldItem; position: [number, number, number]; lit: boolean; onSelect: (t: string) => void }) {
  const cube = useRef<THREE.Mesh>(null);
  const { ref, setHover, hover } = useLift(lit);
  useFrame((_, delta) => {
    if (cube.current) {
      cube.current.rotation.x += delta * 0.5;
      cube.current.rotation.y += delta * 0.7;
    }
  });
  return (
    <group position={position}>
      <Pickable target={item.target} onSelect={onSelect} hovered={setHover}>
        <group ref={ref}>
          <mesh ref={cube}>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial color="#141b2d" emissive={item.color} emissiveIntensity={hover || lit ? 0.8 : 0.25} metalness={0.3} roughness={0.4} />
          </mesh>
          <Tag item={item} position={[0, 0.9, 0]} width={1.7} />
        </group>
      </Pickable>
    </group>
  );
}

function Sheet({ item, index, count, lit, onSelect }: { item: WorldItem; index: number; count: number; lit: boolean; onSelect: (t: string) => void }) {
  const texture = useItemTexture(item, "sheet");
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const mid = (count - 1) / 2;
  const base = useMemo(() => new THREE.Vector3((index - mid) * 0.62, 0.3 - Math.abs(index - mid) * 0.05, -Math.abs(index - mid) * 0.12), [index, mid]);
  const goal = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const k = 1 - Math.exp(-delta * 7);
    const up = hover ? 0.9 : lit ? 0.6 : 0;
    ref.current.position.lerp(goal.set(base.x, base.y + up, base.z + up * 0.6), k);
  });
  return (
    <group ref={ref} rotation={[0, 0, -(index - mid) * 0.05]}>
      <Pickable target={item.target} onSelect={onSelect} hovered={setHover}>
        <mesh>
          <planeGeometry args={[1.5, 2]} />
          <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      </Pickable>
    </group>
  );
}

function Papers({ world, active, onSelect }: LayoutProps) {
  return (
    <group position={[0, 0, 0]}>
      {world.items.map((item, i) => (
        <Sheet key={item.target} item={item} index={i} count={world.items.length} lit={isLit(item, active)} onSelect={onSelect} />
      ))}
    </group>
  );
}

function Mail({ world, active, reduced, onSelect }: LayoutProps) {
  const plane = useRef<THREE.Group>(null);
  const flap = useRef<THREE.Mesh>(null);
  const sats = useRef<THREE.Group>(null);
  const planeGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // A folded paper plane: two wings meeting at a keel.
    const v = [0, 0, 0.7, -0.45, 0.02, -0.4, 0, -0.08, -0.35, 0, 0, 0.7, 0, -0.08, -0.35, 0.45, 0.02, -0.4];
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const flapGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-1.2, 0);
    shape.lineTo(1.2, 0);
    shape.lineTo(0, -0.85);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, []);
  useFrame(({ clock }) => {
    const t = reduced ? 1 : clock.elapsedTime;
    if (plane.current) {
      // A figure-eight loop around the envelope.
      const a = t * 0.6;
      const p = new THREE.Vector3(Math.sin(a) * 3.4, 1.2 + Math.sin(a * 2) * 0.7, Math.sin(a * 2) * 1.6);
      const ahead = new THREE.Vector3(Math.sin(a + 0.05) * 3.4, 1.2 + Math.sin((a + 0.05) * 2) * 0.7, Math.sin((a + 0.05) * 2) * 1.6);
      plane.current.position.copy(p);
      plane.current.lookAt(ahead);
    }
    if (flap.current) flap.current.rotation.x = -0.4 - Math.sin(t * 0.7) * 0.25;
    if (sats.current && !reduced) sats.current.rotation.y = t * 0.25;
  });
  return (
    <group position={[0, 0.2, 0]}>
      <mesh>
        <boxGeometry args={[2.4, 1.5, 0.08]} />
        <meshStandardMaterial color="#f3ede4" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0.02]}>
        <planeGeometry args={[2, 0.9]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh ref={flap} position={[0, 0.75, 0.05]} geometry={flapGeometry}>
        <meshStandardMaterial color="#e7ddcd" side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <circleGeometry args={[0.16, 24]} />
        <meshStandardMaterial color={world.accent} emissive={world.accent} emissiveIntensity={0.5} />
      </mesh>
      <group ref={plane}>
        <mesh geometry={planeGeometry}>
          <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} flatShading />
        </mesh>
      </group>
      <group ref={sats}>
        {world.items.map((item, i) => {
          const angle = (i / world.items.length) * Math.PI * 2 + 0.6;
          return <Gem key={item.label} item={item} position={[Math.sin(angle) * 2.9, -1 + i * 0.45, Math.cos(angle) * 2.9]} lit={isLit(item, active)} onSelect={onSelect} />;
        })}
      </group>
    </group>
  );
}

const LAYOUTS = { gallery: Gallery, pillars: Pillars, road: Road, peaks: Peaks, orbit: Orbit, papers: Papers, mail: Mail };

/* ---------- ambience ---------- */

function Dust({ color, reduced }: { color: string; reduced: boolean }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      p[i * 3] = (Math.random() - 0.5) * 34;
      p[i * 3 + 1] = Math.random() * 12 - 3;
      p[i * 3 + 2] = (Math.random() - 0.5) * 34 - 6;
    }
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  useFrame((_, delta) => {
    if (points.current && !reduced) points.current.rotation.y += delta * 0.01;
  });
  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial color={color} size={0.05} transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---------- camera ---------- */

function CameraRig({ world, progress, reduced }: { world: World; progress: RefObject<number>; reduced: boolean }) {
  const { camera, size, pointer } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.5, 0));
  const goal = useMemo(() => new THREE.Vector3(), []);
  const lookGoal = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const p = THREE.MathUtils.clamp(progress.current ?? 0, 0, 1);
    // The window is usually taller than wide; step back so the room still fits.
    const aspect = size.width / Math.max(size.height, 1);
    const narrow = aspect < 0.8 ? 1.55 : aspect < 1.2 ? 1.3 : 1;

    if (world.layout === "road") {
      const travel = (world.items.length - 1) * ROAD_STEP + 2;
      const z = 7 - p * travel;
      goal.set(roadX(z) * 0.6, 1.4, z);
      lookGoal.set(roadX(z - 6), 0, z - 7);
    } else if (world.layout === "papers") {
      const span = (world.items.length - 1) * 0.62;
      goal.set(THREE.MathUtils.lerp(-span / 2, span / 2, p) * 0.8, 0.8, 7.5 * narrow);
      lookGoal.set(THREE.MathUtils.lerp(-span / 2, span / 2, p) * 0.8, 0.3, 0);
    } else if (world.layout === "pillars") {
      const angle = THREE.MathUtils.lerp(-0.45, 0.45, p);
      goal.set(Math.sin(angle) * 11 * narrow, 2.6 - p * 1.2, Math.cos(angle) * 11 * narrow);
      lookGoal.set(0, 0.6, -1);
    } else {
      // Orbit gently around the centrepiece as the page scrolls.
      const angle = THREE.MathUtils.lerp(-0.35, 0.6, p);
      const distance = (world.layout === "gallery" ? 10.5 : world.layout === "peaks" ? 9.5 : 11) * narrow;
      goal.set(Math.sin(angle) * distance, 1.8 + Math.sin(p * Math.PI) * 1.4, Math.cos(angle) * distance);
      lookGoal.set(0, world.layout === "peaks" ? 1 : 0.4, 0);
    }
    if (!reduced) goal.add(new THREE.Vector3(pointer.x * 0.5, pointer.y * 0.25, 0));

    const k = reduced ? 1 : 1 - Math.exp(-delta * 3);
    camera.position.lerp(goal, k);
    look.current.lerp(lookGoal, k);
    camera.lookAt(look.current);
  });
  return null;
}

export default function WorldScene({ world, progress, active, dark, reduced, onSelect }: WorldSceneProps) {
  const Layout = LAYOUTS[world.layout];
  const fog = dark ? "#04050c" : "#f2f6fa";
  return (
    <Canvas
      camera={{ position: [0, 2, 10], fov: 45, near: 0.1, far: 80 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => {
        document.body.style.cursor = "";
      }}
    >
      <fog attach="fog" args={[fog, 12, 34]} />
      <ambientLight intensity={dark ? 0.55 : 0.9} />
      <hemisphereLight args={["#bcd7ff", "#1a1024", 0.5]} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} />
      <pointLight position={[0, 3, 3]} intensity={30} distance={14} color={world.accent} />
      <Dust color={dark ? world.accent : "#475569"} reduced={reduced} />
      <gridHelper args={[60, 60, dark ? "#16304a" : "#cbd5e1", dark ? "#0b1828" : "#e2e8f0"]} position={[0, -1.5, 0]} />
      <Layout world={world} active={active} reduced={reduced} onSelect={onSelect} progress={progress} />
      <CameraRig world={world} progress={progress} reduced={reduced} />
    </Canvas>
  );
}
