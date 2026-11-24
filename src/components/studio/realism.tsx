"use client";

/**
 * Realism layer for the studio: procedural PBR-ish textures, studio
 * reflections, a proper keyboard, post-processing (ambient occlusion, bloom,
 * filmic tone mapping) and the desk gadgets (digital clock, weather display).
 * Everything is generated in code, so nothing is downloaded at runtime.
 */

import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { formatClock, nepalClock, type Weather, type WeatherKind } from "@/lib/live";

/* ---------- procedural textures ---------- */

/** Small deterministic noise so textures look the same on every visit. */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, repeat: [number, number] = [1, 1]) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 8;
  return texture;
}

/** Oak-like grain: long wavy fibres with darker growth rings. */
function drawGrain(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, next: () => number) {
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < h / 2.2; i++) {
    const yy = y + next() * h;
    const amp = 1 + next() * 4;
    const freq = 0.004 + next() * 0.01;
    const phase = next() * 10;
    ctx.strokeStyle = `rgba(${next() < 0.5 ? "40,22,10" : "255,230,190"},${0.04 + next() * 0.09})`;
    ctx.lineWidth = 0.6 + next() * 1.6;
    ctx.beginPath();
    for (let xx = x; xx <= x + w; xx += 8) ctx.lineTo(xx, yy + Math.sin(xx * freq + phase) * amp);
    ctx.stroke();
  }
}

export function useWoodTexture(kind: "desk" | "floor") {
  return useMemo(() => {
    const next = rand(kind === "desk" ? 7 : 13);
    if (kind === "desk") {
      return canvasTexture(1024, (ctx, s) => drawGrain(ctx, 0, 0, s, s, "#9a6e48", next), [1, 1]);
    }
    // Floor: planks of varying tone with thin dark seams.
    return canvasTexture(
      1024,
      (ctx, s) => {
        const plank = s / 6;
        for (let row = 0; row < 6; row++) {
          const offset = (row % 2) * s * 0.45;
          for (let col = -1; col < 2; col++) {
            const tone = 60 + Math.floor(next() * 22);
            drawGrain(ctx, offset + col * s * 0.9, row * plank, s * 0.9, plank, `rgb(${tone + 22},${tone},${tone - 16})`, next);
            ctx.fillStyle = "rgba(10,6,3,0.7)";
            ctx.fillRect(offset + col * s * 0.9, row * plank, 3, plank);
          }
          ctx.fillStyle = "rgba(10,6,3,0.75)";
          ctx.fillRect(0, row * plank, s, 3);
        }
      },
      [3, 2.5]
    );
  }, [kind]);
}

/** Matte painted plaster: soft mottling, no visible pattern. */
export function usePlasterTexture(color: string) {
  return useMemo(
    () =>
      canvasTexture(
        512,
        (ctx, s) => {
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, s, s);
          const next = rand(3);
          for (let i = 0; i < 2600; i++) {
            ctx.fillStyle = `rgba(${next() < 0.5 ? "0,0,0" : "255,255,255"},${next() * 0.035})`;
            const r = 2 + next() * 18;
            ctx.beginPath();
            ctx.arc(next() * s, next() * s, r, 0, Math.PI * 2);
            ctx.fill();
          }
        },
        [4, 2.5]
      ),
    [color]
  );
}

/** A woven rug: fine cross-hatched fibres in two tones. */
export function useRugTexture() {
  return useMemo(
    () =>
      canvasTexture(
        512,
        (ctx, s) => {
          ctx.fillStyle = "#2b3656";
          ctx.fillRect(0, 0, s, s);
          const next = rand(21);
          for (let i = 0; i < s; i += 4) {
            ctx.fillStyle = `rgba(255,255,255,${0.02 + next() * 0.04})`;
            ctx.fillRect(i, 0, 2, s);
            ctx.fillStyle = `rgba(0,0,0,${0.05 + next() * 0.06})`;
            ctx.fillRect(0, i, s, 2);
          }
          ctx.strokeStyle = "rgba(226,196,140,0.35)";
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.arc(s / 2, s / 2, s * 0.44, 0, Math.PI * 2);
          ctx.stroke();
        },
        [1, 1]
      ),
    []
  );
}

/* ---------- lighting ---------- */

/**
 * Reflections for glossy surfaces (monitor, mug, metal) from a small studio
 * of light panels rendered once into an environment map. No HDR download.
 */
export function StudioEnvironment({ warm }: { warm: boolean }) {
  return (
    <Environment resolution={128} frames={1}>
      <color attach="background" args={["#0a0d16"]} />
      <Lightformer form="rect" intensity={warm ? 1.4 : 2.2} color={warm ? "#ffd7a8" : "#cfe2ff"} position={[-3, 2, -1]} scale={[2, 1.5, 1]} rotation-y={Math.PI / 2} />
      <Lightformer form="rect" intensity={0.8} color="#7fe3ff" position={[0, 1.2, 1]} scale={[1.2, 0.7, 1]} />
      <Lightformer form="ring" intensity={1.2} color="#ffcf8a" position={[2, 3, 2]} scale={1.5} />
    </Environment>
  );
}

/** Every mesh casts and receives shadows, except unlit screens and labels. */
export function ShadowSetup() {
  const scene = useThree((state) => state.scene);
  useEffect(() => {
    const apply = () =>
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const unlit = (mesh.material as THREE.Material | undefined)?.type === "MeshBasicMaterial";
        mesh.castShadow = !unlit;
        mesh.receiveShadow = !unlit;
      });
    apply();
    // Late-mounting parts (weather, labels, gadgets) get picked up too.
    const id = window.setInterval(apply, 2000);
    return () => window.clearInterval(id);
  }, [scene]);
  return null;
}

/**
 * Post-processing: ground-truth ambient occlusion in corners and contacts,
 * bloom on screens and bulbs, then filmic tone mapping. Takes over rendering
 * (frame priority 1) while mounted.
 */
export function PostFX() {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    const ao = new GTAOPass(scene, camera, size.width, size.height);
    ao.blendIntensity = 0.85;
    c.addPass(ao);
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.45, 0.55, 0.82));
    c.addPass(new OutputPass());
    return c;
    // The composer is rebuilt only if the renderer or camera change; size is applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setPixelRatio(gl.getPixelRatio());
    composer.setSize(size.width, size.height);
  }, [composer, gl, size.width, size.height]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame((_, delta) => composer.render(delta), 1);
  return null;
}

/* ---------- keyboard ---------- */

const KEY = 0.0255;
const KEY_GAP = 0.0035;

export function Keyboard({ position }: { position: [number, number, number] }) {
  const caps = useRef<THREE.InstancedMesh>(null);
  const layout = useMemo(() => {
    // Five rows of a 60% board, plus a wide space bar.
    const rows = [14, 14, 13, 12, 0];
    const keys: { x: number; z: number; w: number }[] = [];
    rows.forEach((count, row) => {
      const width = count * (KEY + KEY_GAP);
      for (let i = 0; i < count; i++) keys.push({ x: -width / 2 + i * (KEY + KEY_GAP) + KEY / 2 + (row % 2) * 0.004, z: -0.052 + row * (KEY + KEY_GAP), w: KEY });
    });
    keys.push({ x: 0, z: -0.052 + 4 * (KEY + KEY_GAP), w: KEY * 6.5 });
    return keys;
  }, []);

  useEffect(() => {
    const mesh = caps.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    layout.forEach((key, i) => {
      m.compose(new THREE.Vector3(key.x, 0, key.z), new THREE.Quaternion(), new THREE.Vector3(key.w / KEY, 1, 1));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [layout]);

  return (
    <group position={position}>
      <RoundedBox args={[0.43, 0.018, 0.15]} radius={0.006} smoothness={3} position={[0, 0.009, 0]}>
        <meshStandardMaterial color="#1a1e29" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      {/* soft underglow between the keys */}
      <mesh position={[0, 0.0185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.41, 0.135]} />
        <meshBasicMaterial color="#5fc9e8" transparent opacity={0.35} />
      </mesh>
      <instancedMesh ref={caps} args={[undefined, undefined, layout.length]} position={[0, 0.025, 0]}>
        <boxGeometry args={[KEY, 0.011, KEY]} />
        <meshStandardMaterial color="#2a3040" roughness={0.55} />
      </instancedMesh>
    </group>
  );
}

/* ---------- desk gadgets ---------- */

function useGadgetScreen(width: number, height: number) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { canvas, texture };
  }, [width, height]);
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** A small LED desk clock on Sindhuli time. */
export function DeskClock({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  const { canvas, texture } = useGadgetScreen(512, 200);
  const last = useRef("");
  useFrame(() => {
    const now = Date.now();
    const clock = nepalClock(now);
    const colon = Math.floor(clock.seconds) % 2 === 0;
    const key = `${formatClock(clock)}${colon}`;
    if (key === last.current) return;
    last.current = key;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Date in Nepal: shift the timestamp, then read it as UTC.
    const nepal = new Date(now + (5 * 60 + 45) * 60_000);
    ctx.fillStyle = "#05070c";
    ctx.fillRect(0, 0, 512, 200);
    ctx.fillStyle = "#7fe3ff";
    ctx.shadowColor = "#7fe3ff";
    ctx.shadowBlur = 18;
    ctx.font = "700 112px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    const [hh, mm] = formatClock(clock).split(":");
    ctx.fillText(`${hh}${colon ? ":" : " "}${mm}`, 256, 122);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#4b7f93";
    ctx.font = "600 30px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText(`${DAYS[nepal.getUTCDay()]} ${nepal.getUTCDate()} ${MONTHS[nepal.getUTCMonth()]} · SINDHULI`, 256, 176);
    texture.needsUpdate = true;
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.17, 0.075, 0.055]} radius={0.012} smoothness={3} position={[0, 0.0375, 0]}>
        <meshStandardMaterial color="#14171f" metalness={0.3} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.04, 0.0281]}>
        <planeGeometry args={[0.15, 0.058]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function drawWeatherIcon(ctx: CanvasRenderingContext2D, kind: WeatherKind, isDay: boolean, x: number, y: number) {
  const cloud = (cx: number, cy: number, scale: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx - 22 * scale, cy, 18 * scale, 0, Math.PI * 2);
    ctx.arc(cx, cy - 12 * scale, 24 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 24 * scale, cy, 18 * scale, 0, Math.PI * 2);
    ctx.fillRect(cx - 22 * scale, cy, 46 * scale, 18 * scale);
    ctx.fill();
  };
  if (kind === "clear" || kind === "cloudy") {
    if (isDay) {
      ctx.fillStyle = "#ffd36a";
      ctx.beginPath();
      ctx.arc(x - (kind === "cloudy" ? 18 : 0), y - (kind === "cloudy" ? 14 : 0), 26, 0, Math.PI * 2);
      ctx.fill();
      if (kind === "clear") {
        ctx.strokeStyle = "#ffd36a";
        ctx.lineWidth = 5;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * 34, y + Math.sin(a) * 34);
          ctx.lineTo(x + Math.cos(a) * 46, y + Math.sin(a) * 46);
          ctx.stroke();
        }
      }
    } else {
      ctx.fillStyle = "#e8eeff";
      ctx.beginPath();
      ctx.arc(x - (kind === "cloudy" ? 16 : 0), y - (kind === "cloudy" ? 12 : 0), 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#05070c";
      ctx.beginPath();
      ctx.arc(x - (kind === "cloudy" ? 4 : 12), y - (kind === "cloudy" ? 20 : 8), 22, 0, Math.PI * 2);
      ctx.fill();
    }
    if (kind === "cloudy") cloud(x + 8, y + 10, 1, "#c7d2e2");
    return;
  }
  if (kind === "fog") {
    ctx.fillStyle = "#c7d2e2";
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 44 + (i % 2) * 10, y - 26 + i * 16, 80, 8);
    return;
  }
  cloud(x, y - 6, 1, kind === "storm" ? "#8995aa" : "#c7d2e2");
  if (kind === "snow") {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 5; i++) ctx.fillRect(x - 30 + i * 15, y + 30 + (i % 2) * 10, 6, 6);
  } else {
    ctx.strokeStyle = "#7fc4ff";
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(x - 24 + i * 16, y + 26);
      ctx.lineTo(x - 30 + i * 16, y + 42);
      ctx.stroke();
    }
    if (kind === "storm") {
      ctx.fillStyle = "#ffd36a";
      ctx.beginPath();
      ctx.moveTo(x + 2, y + 18);
      ctx.lineTo(x - 10, y + 42);
      ctx.lineTo(x + 2, y + 42);
      ctx.lineTo(x - 6, y + 62);
      ctx.lineTo(x + 16, y + 34);
      ctx.lineTo(x + 4, y + 34);
      ctx.closePath();
      ctx.fill();
    }
  }
}

const WEATHER_LABEL: Record<WeatherKind, string> = {
  clear: "Clear",
  cloudy: "Cloudy",
  fog: "Fog",
  rain: "Rain",
  storm: "Thunderstorm",
  snow: "Snow",
};

/** A small weather display showing live Sindhuli conditions. */
export function WeatherStation({ position, rotationY, weather }: { position: [number, number, number]; rotationY: number; weather: Weather | null }) {
  const { canvas, texture } = useGadgetScreen(512, 340);
  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, 340);
    gradient.addColorStop(0, "#0d1426");
    gradient.addColorStop(1, "#05070c");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 340);
    ctx.fillStyle = "#6b7a96";
    ctx.font = "600 26px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillText("SINDHULI · LIVE", 32, 52);
    if (!weather) {
      ctx.fillStyle = "#9db0c6";
      ctx.font = "500 34px system-ui, sans-serif";
      ctx.fillText("Fetching the sky…", 32, 190);
    } else {
      drawWeatherIcon(ctx, weather.kind, weather.isDay, 120, 170);
      ctx.fillStyle = "#f3f7fb";
      ctx.font = "700 120px system-ui, sans-serif";
      ctx.fillText(weather.tempC !== null ? `${weather.tempC}°` : "—", 230, 210);
      ctx.fillStyle = "#9db0c6";
      ctx.font = "500 34px system-ui, sans-serif";
      ctx.fillText(WEATHER_LABEL[weather.kind], 236, 262);
      ctx.fillStyle = "#6b7a96";
      ctx.font = "500 24px ui-monospace, Menlo, Consolas, monospace";
      const extras = [
        weather.humidity !== undefined && weather.humidity !== null ? `HUM ${weather.humidity}%` : null,
        weather.windKph !== undefined && weather.windKph !== null ? `WIND ${weather.windKph} km/h` : null,
      ].filter(Boolean);
      ctx.fillText(extras.join("   "), 32, 312);
    }
    texture.needsUpdate = true;
  }, [canvas, texture, weather]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* a small stand holding the screen at a reading angle */}
      <RoundedBox args={[0.09, 0.012, 0.06]} radius={0.004} smoothness={2} position={[0, 0.006, 0]}>
        <meshStandardMaterial color="#1a1e29" metalness={0.6} roughness={0.35} />
      </RoundedBox>
      <group position={[0, 0.07, -0.01]} rotation={[-0.22, 0, 0]}>
        <RoundedBox args={[0.19, 0.13, 0.012]} radius={0.008} smoothness={3}>
          <meshStandardMaterial color="#0f121a" metalness={0.4} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0065]}>
          <planeGeometry args={[0.172, 0.114]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- peripherals ---------- */

/** High-end mechanical keyboard with RGB backlight */
export function KeyboardPeripheral({ position }: { position: [number, number, number] }) {
  const keys = useMemo(() => {
    const rows = [17, 17, 16, 16, 11]; // 60% keyboard style
    const keys: { x: number; z: number; w: number; h: number }[] = [];
    rows.forEach((count, row) => {
      const width = count * (KEY + KEY_GAP);
      for (let i = 0; i < count; i++) {
        keys.push({ 
          x: -width / 2 + i * (KEY + KEY_GAP) + KEY / 2 + (row % 2) * 0.002, 
          z: -0.055 + row * (KEY + KEY_GAP), 
          w: KEY,
          h: row === 4 ? KEY * 1.2 : KEY // Space bar wider
        });
      }
    });
    return keys;
  }, []);

  const caps = useRef<THREE.InstancedMesh>(null);
  const rgbColors = useMemo(() => {
    // Create gradient RGB pattern
    return keys.map((_, i) => {
      const hue = (i % 360) / 360;
      return `hsl(${hue * 360}, 80%, 60%)`;
    });
  }, [keys]);

  useEffect(() => {
    const mesh = caps.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    keys.forEach((key, i) => {
      m.compose(
        new THREE.Vector3(key.x, 0, key.z), 
        new THREE.Quaternion(), 
        new THREE.Vector3(key.w / KEY, 1, key.h / KEY)
      );
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, new THREE.Color(rgbColors[i]!));
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
  }, [keys, rgbColors]);

  return (
    <group position={position}>
      {/* Keyboard base */}
      <RoundedBox args={[0.48, 0.014, 0.18]} radius={0.007} smoothness={3} position={[0, 0.007, 0]}>
        <meshStandardMaterial color="#2a2e38" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* Keycaps with RGB backlight */}
      <instancedMesh ref={caps} args={[undefined, undefined, keys.length]} position={[0, 0.015, 0]}>
        <boxGeometry args={[KEY, 0.008, KEY]} />
        <meshStandardMaterial 
          color="#3a3f4b" 
          metalness={0.2} 
          roughness={0.6}
          emissive="#2a5258"
          emissiveIntensity={0.3}
        />
      </instancedMesh>
      {/* RGB backlight glow */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.44, 0.15]} />
        <meshBasicMaterial 
          color="#2a5258" 
          transparent 
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Keyboard stand/legs */}
      {[-0.18, 0.18].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.007, 0.095]}>
            <cylinderGeometry args={[0.006, 0.006, 0.012, 12]} />
            <meshStandardMaterial color="#2a2e38" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** High-end gaming mouse */
export function Mouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Mouse body */}
      <mesh castShadow receiveShadow>
        <RoundedBox args={[0.065, 0.028, 0.11]} radius={0.012} smoothness={4} />
        <meshStandardMaterial 
          color="#181c24" 
          metalness={0.6} 
          roughness={0.25}
        />
      </mesh>
      {/* Mouse buttons */}
      <mesh position={[-0.018, 0.018, 0]} castShadow receiveShadow>
        <RoundedBox args={[0.032, 0.012, 0.035]} radius={0.006} />
        <meshStandardMaterial color="#0f141b" metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Scroll wheel */}
      <mesh position={[0.02, 0.022, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.006, 16]} />
        <meshStandardMaterial 
          color="#2d3a4f" 
          metalness={0.4} 
          roughness={0.35}
        />
      </mesh>
      {/* Side buttons */}
      {[-0.018, 0.018].map((z, i) => (
        <mesh key={i} position={[z > 0 ? 0.032 : -0.032, 0.014, -0.032]} castShadow receiveShadow>
          <RoundedBox args={[0.008, 0.006, 0.014]} radius={0.003} />
          <meshStandardMaterial color="#181c24" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
      {/* Mouse RGB light (left side) */}
      <mesh position={[-0.038, 0.018, -0.02]}>
        <cylinderGeometry args={[0.015, 0.015, 0.008, 12]} />
        <meshBasicMaterial 
          color="#ff0055"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/** Mid-tower PC case with RGB */
export function PCTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main case */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.36, 0.42]} />
        <meshStandardMaterial 
          color="#14181f" 
          metalness={0.5} 
          roughness={0.2}
          emissive="#0a101a"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Transparent side panel (tempered glass effect) */}
      <mesh position={[0.115, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.002, 0.36, 0.42]} />
        <meshStandardMaterial 
          color="#e0e8f0" 
          metalness={0.1} 
          roughness={0.05}
          transparent
          opacity={0.35}
          emissive="#7fe3ff"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Top cover */}
      <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.02, 0.42]} />
        <meshStandardMaterial color="#14181f" metalness={0.5} roughness={0.25} />
      </mesh>
      {/* RGB strip at top */}
      <mesh position={[0, 0.205, 0]}>
        <boxGeometry args={[0.22, 0.008, 0.018]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* PSU shroud at bottom */}
      <mesh position={[-0.123, -0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.34, 0.14]} />
        <meshStandardMaterial color="#14181f" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* USB ports on front */}
      <mesh position={[0, -0.165, 0.205]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.015, 0.025]} />
        <meshStandardMaterial color="#0f141b" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* GPU shroud */}
      <mesh position={[0.115, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.02, 0.28, 0.12]} />
        <meshStandardMaterial color="#14181f" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* GPU RGB light */}
      <mesh position={[0.12, -0.12, 0.06]}>
        <boxGeometry args={[0.04, 0.02, 0.008]} />
        <meshBasicMaterial 
          color="#ff0066"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Ventilation grills */}
      <mesh position={[-0.12, 0.12, 0.2]}>
        <boxGeometry args={[0.08, 0.008, 0.02]} />
        <meshStandardMaterial color="#0f141b" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-0.12, -0.2, 0.2]}>
        <boxGeometry args={[0.08, 0.008, 0.02]} />
        <meshStandardMaterial color="#0f141b" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** External GPU enclosure */
export function GPU({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main case */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.16, 0.28, 0.32]} />
        <meshStandardMaterial 
          color="#14181f" 
          metalness={0.6} 
          roughness={0.18}
          emissive="#0a101a"
          emissiveIntensity={0.1}
        />
      </mesh>
      {/* Transparent side panel */}
      <mesh position={[0.08, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.002, 0.28, 0.32]} />
        <meshStandardMaterial 
          color="#e0e8f0" 
          metalness={0.1} 
          roughness={0.05}
          transparent
          opacity={0.3}
          emissive="#00ffff"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* LED logo at top front */}
      <mesh position={[0, 0.12, 0.15]}>
        <boxGeometry args={[0.12, 0.02, 0.01]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Connection port */}
      <mesh position={[0, -0.12, -0.15]} castShadow receiveShadow>
        <boxGeometry args={[0.06, 0.012, 0.012]} />
        <meshStandardMaterial color="#181c24" metalness={0.6} roughness={0.25} />
      </mesh>
      {/* Ventilation */}
      {[-0.06, 0.06].map((z) => (
        <mesh key={z} position={[z, 0, 0.12]}>
          <boxGeometry args={[0.006, 0.2, 0.012]} />
          <meshStandardMaterial color="#0f141b" metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** Studio monitor arms (dual monitor setup) */
export function MonitorArms({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base plate */}
      <mesh castShadow receiveShadow>
        <RoundedBox args={[0.22, 0.012, 0.22]} radius={0.006} />
        <meshStandardMaterial color="#1a1e25" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Left arm pole */}
      <mesh position={[-0.078, 0.108, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.216, 12]} />
        <meshStandardMaterial color="#1a1e25" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Right arm pole */}
      <mesh position={[0.078, 0.108, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.216, 12]} />
        <meshStandardMaterial color="#1a1e25" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Left articulated arm */}
      <mesh position={[-0.078, 0.29, 0]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 12]} />
        <meshStandardMaterial color="#1a1e25" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Right articulated arm */}
      <mesh position={[0.078, 0.29, 0]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.08, 12]} />
        <meshStandardMaterial color="#1a1e25" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Left monitor pivot */}
      <mesh position={[-0.078, 0.35, 0.07]}>
        <cylinderGeometry args={[0.012, 0.012, 0.012, 16]} />
        <meshStandardMaterial color="#1a1e25" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Right monitor pivot */}
      <mesh position={[0.078, 0.35, -0.07]}>
        <cylinderGeometry args={[0.012, 0.012, 0.012, 16]} />
        <meshStandardMaterial color="#1a1e25" metalness={0.7} roughness={0.25} />
      </mesh>
    </group>
  );
}
