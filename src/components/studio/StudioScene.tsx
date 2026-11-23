"use client";

import { ContactShadows, Html, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { isClockGlance, nepalClock, type Weather, type WeatherKind } from "@/lib/live";
import { HOME_HOUR, PHASE_LOOK, type DayPhase, type MediaItem } from "@/lib/studio";
import { DeskClock, Keyboard, PostFX, ShadowSetup, StudioEnvironment, WeatherStation } from "./realism";
import MonitorMedia from "./MonitorMedia";
import {
  brushedMetal,
  brushedMetalRoughness,
  deskTexture,
  fabricBump,
  floorRoughness,
  floorTexture,
  paperTexture,
  plasterBump,
  plasterTexture,
  rugTexture,
  softDisc,
} from "./textures";

/** What a click on something in the room means. */
export type SceneTarget =
  | { kind: "page"; slug: string }
  | { kind: "coffee" }
  | { kind: "music" }
  | { kind: "media" }
  | { kind: "character" }
  | { kind: "weather" }
  | { kind: "clock" };

export type StudioSceneProps = {
  phase: DayPhase;
  /** BPM of the playing track, or null when the music is off. */
  musicBpm: number | null;
  /** Bumped each time the character should take a sip. */
  sipCount: number;
  coffeeLevel: number;
  /** The character has swivelled round to talk to the visitor. */
  asking: boolean;
  /** Slug being opened; the camera dives into the monitor. */
  leaving: string | null;
  /** What the visitor is typing in the terminal, mirrored on the monitor. */
  terminalText: string | null;
  /** Sindhuli's current weather, shown in the window and on the desk. */
  weather?: Weather | null;
  /** Recent real commits, typed on the monitor first. */
  gitLog?: string[] | null;
  /** What is playing on the monitor, if anything. */
  media?: MediaItem | null;
  /** Bibash is at the office: the desk is empty until six. */
  away?: boolean;
  /** Mid-commute, so the character walks to or from the door. */
  commute?: "out" | "in" | null;
  /** Bumped whenever Bibash should get up and stretch his legs. */
  roamToken?: number;
  /** 1–5am in Sindhuli: the character dozes at the desk. */
  sleeping?: boolean;
  reduced: boolean;
  onTarget: (target: SceneTarget) => void;
  /** Fired when the walk out reaches the doorway. */
  onDoor?: () => void;
  /** Fired when the walk back has sat him down again. */
  onSeated?: () => void;
};

/* ---------- layout constants (metres, y up, the character faces -z) ---------- */

const DESK_TOP = 0.76;
const SEAT = new THREE.Vector3(0, 0, 0.62);
const KEYS_L = new THREE.Vector3(-0.11, 0.8, 0.13);
const KEYS_R = new THREE.Vector3(0.11, 0.8, 0.13);
const MUG_REST = new THREE.Vector3(0.42, DESK_TOP, 0.22);
const MUG_GRIP = new THREE.Vector3(0.37, 0.82, 0.24);
const SCREEN_CENTER = new THREE.Vector3(0, 1.13, -0.27);
const CAMERA_HOME = new THREE.Vector3(2.3, 1.72, 2.4);
const CAMERA_LOOK = new THREE.Vector3(-0.05, 1.0, 0);
const CAMERA_DIVE = new THREE.Vector3(0, 1.13, 0.2);

const UPPER_ARM = 0.29;
const FOREARM = 0.27;
const SIP_SECONDS = 3.6;

/* ---------- where the character walks ---------- */

/** The doorway the commute goes through: out to the right, by the shelf. */
const DOOR = new THREE.Vector3(2.35, 0, 1.75);
/** Standing spots Bibash wanders to, and what he stops to look at there. */
const STRETCH_SPOTS: { at: THREE.Vector3; lookAt: THREE.Vector3 }[] = [
  { at: new THREE.Vector3(-0.85, 0, 1.05), lookAt: new THREE.Vector3(-1.25, 1.55, -0.74) }, // out of the window
  { at: new THREE.Vector3(1.05, 0, 1.15), lookAt: new THREE.Vector3(1.75, 0.95, -0.55) }, // along the shelf
  { at: new THREE.Vector3(-0.2, 0, 1.75), lookAt: new THREE.Vector3(0.42, 0.9, 0.22) }, // across at the desk
  { at: new THREE.Vector3(1.55, 0, 1.75), lookAt: new THREE.Vector3(0.42, 0.9, 0.22) }, // near the door
  { at: new THREE.Vector3(-1.5, 0, 1.55), lookAt: new THREE.Vector3(0.95, 1.85, -0.735) }, // at the poster
];

/** How fast Bibash walks, and how long he stays put when he gets somewhere. */
const WALK_SPEED = 1.05;
const PAUSE_SECONDS = 6;

/** Leg bones, and the direction knees fold (forward of the hips). */
const LEG_UPPER = 0.29;
const LEG_LOWER = 0.29;
const LEG_POLE = new THREE.Vector3(-0.25, 0, -1);

const SKIN = "#d9a382";
const HOODIE = "#3d4f9a";
const PANTS = "#202838";
const HAIR = "#1d1512";

/** Where each interactive object sits, for the character's gaze and the intro trail. */
const SPOT_LOOK: Record<string, [number, number, number]> = {
  about: [0.95, 1.85, -0.735],
  skills: [1.75, 1.05, -0.55],
  projects: [0, 1.13, -0.27],
  experience: [-1.25, 1.55, -0.74],
  services: [-0.55, 1.2, -0.22],
  resume: [-0.5, 0.78, -0.05],
  contact: [-0.45, 0.78, 0.18],
  coffee: [0.42, 0.82, 0.22],
  character: [0.25, 1.35, 0.55],
};

/** The order the intro light visits the objects. */
const TRAIL_ORDER = ["about", "skills", "projects", "experience", "services", "resume", "contact", "coffee"] as const;

type HoverApi = {
  set: (spot: string) => void;
  clear: (spot: string) => void;
};

const HoverContext = createContext<HoverApi | null>(null);

/* ---------- small helpers ---------- */

const UP = new THREE.Vector3(0, 1, 0);
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

/** Stretch a unit-height cylinder so it spans from a to b. */
function placeLimb(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  tmpA.subVectors(b, a);
  const length = Math.max(tmpA.length(), 0.0001);
  mesh.position.copy(a).addScaledVector(tmpA, 0.5);
  mesh.scale.set(1, length, 1);
  mesh.quaternion.setFromUnitVectors(UP, tmpA.multiplyScalar(1 / length));
}

/**
 * Two-bone IK: given a shoulder (or hip), where the hand (or foot) wants to be
 * and a pole vector saying which way the joint should point, place the joint
 * and the tip. Bones are stretched to any length, so arms and legs share it.
 */
function solveTwoBone(
  root: THREE.Vector3,
  target: THREE.Vector3,
  pole: THREE.Vector3,
  jointOut: THREE.Vector3,
  tipOut: THREE.Vector3,
  upper: number,
  lower: number
) {
  const dir = tmpB.subVectors(target, root);
  const dist = THREE.MathUtils.clamp(dir.length(), 0.05, upper + lower - 0.002);
  dir.normalize();
  const along = (upper * upper - lower * lower + dist * dist) / (2 * dist);
  const lift = Math.sqrt(Math.max(0, upper * upper - along * along));
  const bend = tmpA.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
  jointOut.copy(root).addScaledVector(dir, along).addScaledVector(bend, lift);
  tipOut.copy(root).addScaledVector(dir, dist);
}

const solveArm = (shoulder: THREE.Vector3, target: THREE.Vector3, pole: THREE.Vector3, elbowOut: THREE.Vector3, handOut: THREE.Vector3) =>
  solveTwoBone(shoulder, target, pole, elbowOut, handOut, UPPER_ARM, FOREARM);

const solveLeg = (hip: THREE.Vector3, target: THREE.Vector3, kneeOut: THREE.Vector3, footOut: THREE.Vector3) =>
  solveTwoBone(hip, target, LEG_POLE, kneeOut, footOut, LEG_UPPER, LEG_LOWER);

function smooth(t: number) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Wraps a clickable object: pointer cursor, hover label, and two-tap on touch. */
function Hotspot({
  spot,
  label,
  labelAt,
  onSelect,
  children,
}: {
  spot: string;
  label: string;
  labelAt: [number, number, number];
  onSelect: () => void;
  children: ReactNode;
}) {
  const hoverApi = useContext(HoverContext);
  const [hover, setHover] = useState(false);
  const [armed, setArmed] = useState(false);
  const armedRef = useRef(false);
  const armTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!hover) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hover]);

  useEffect(() => {
    return () => {
      if (armTimer.current) window.clearTimeout(armTimer.current);
    };
  }, []);

  const isTouch = (event: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>) => {
    const pointerType = (event.nativeEvent as PointerEvent).pointerType;
    return pointerType === "touch" || window.matchMedia?.("(hover: none)")?.matches === true;
  };

  const arm = () => {
    armedRef.current = true;
    setArmed(true);
    setHover(true);
    hoverApi?.set(spot);
    if (armTimer.current) window.clearTimeout(armTimer.current);
    armTimer.current = window.setTimeout(() => {
      armedRef.current = false;
      setArmed(false);
      setHover(false);
      hoverApi?.clear(spot);
    }, 3200);
  };

  return (
    <group
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        if (isTouch(event)) return;
        setHover(true);
        hoverApi?.set(spot);
      }}
      onPointerOut={() => {
        if (armedRef.current) return;
        setHover(false);
        hoverApi?.clear(spot);
      }}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        if (isTouch(event) && !armedRef.current) {
          arm();
          return;
        }
        if (armTimer.current) window.clearTimeout(armTimer.current);
        armedRef.current = false;
        setArmed(false);
        setHover(false);
        hoverApi?.clear(spot);
        onSelect();
      }}
    >
      {children}
      {hover && (
        <Html position={labelAt} center style={{ pointerEvents: "none" }} zIndexRange={[20, 0]}>
          <span className="studio__tag">
            {label}
            {armed && <small className="studio__tag-hint">Tap again to open</small>}
          </span>
        </Html>
      )}
    </group>
  );
}

/* ---------- the monitor: a canvas texture that types code ---------- */

const SNIPPETS = [
  [
    "// portfolio/src/lib/bibash.ts",
    "export const bibash = {",
    '  role: "Creative developer",',
    '  based: "Sindhuli, Nepal",',
    '  stack: ["Next.js", "TypeScript", "Three.js"],',
    '  status: "open to work",',
    "};",
    "",
    "export function ship(idea: Idea) {",
    "  const draft = prototype(idea);",
    "  return polish(draft, { lastTenPercent: true });",
    "}",
  ],
  [
    "// coffee-driven-development.ts",
    "while (bugs.length > 0) {",
    "  const bug = bugs.shift();",
    "  if (coffee.level < 0.2) refill(coffee);",
    "  await fix(bug);",
    '  git.commit(`fix: ${bug.title}`);',
    "}",
    "",
    "deploy({ target: \"production\", fingers: \"crossed\" });",
  ],
  [
    "// visitor.tsx",
    "export default function Visitor() {",
    "  const [curious] = useState(true);",
    "  if (!curious) return null;",
    "  return (",
    '    <Terminal hint="press / and type cd projects" />',
    "  );",
    "}",
  ],
];

/** The panel drawn when the monitor plays something that is not an embed. */
function drawNowPlaying(item: MediaItem, t: number) {
  return (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = "#080c18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#101a2e";
    ctx.fillRect(0, 0, canvas.width, 44);
    ctx.fillStyle = "#7fe3ff";
    ctx.font = "600 20px monospace";
    ctx.fillText("◉ studio.tv", 26, 30);
    ctx.fillStyle = "#6b7f99";
    ctx.font = "400 18px monospace";
    ctx.fillText(item.kind === "radio" ? "lo-fi radio · synthesised in the browser" : "now playing", canvas.width - 420, 30);

    ctx.fillStyle = "#e9f6ff";
    ctx.font = "700 52px sans-serif";
    ctx.fillText(fitText(ctx, item.title, canvas.width - 60), 46, 190);
    if (item.by) {
      ctx.fillStyle = "#8fa6c4";
      ctx.font = "400 26px sans-serif";
      ctx.fillText(fitText(ctx, item.by, canvas.width - 60), 46, 240);
    }
    if (item.blurb) {
      ctx.fillStyle = "#6b7f99";
      ctx.font = "400 22px sans-serif";
      ctx.fillText(item.blurb, 46, 284);
    }

    // Equaliser: the bars dance, so the screen is never a still frame.
    const barWidth = 14;
    const bars = 40;
    for (let i = 0; i < bars; i++) {
      const level = 0.35 + Math.abs(Math.sin(t * 2.6 + i * 0.55)) * (0.35 + 0.3 * Math.sin(i * 1.7));
      const height = Math.max(6, level * 130);
      ctx.fillStyle = i % 7 === 0 ? "#ff8fc7" : "#7fe3ff";
      ctx.fillRect(46 + i * (barWidth + 6), canvas.height - 46 - height, barWidth, height);
    }
    ctx.fillStyle = "#3b4a63";
    ctx.font = "400 20px monospace";
    ctx.fillText(item.kind === "link" ? "opening in a new tab ↗" : "click the monitor for the full deck", 46, canvas.height - 16);
  };
}

/** Drawn while Bibash is at the office: the room is quiet. */
function drawAwayScreen(t: number) {
  return (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = "#070a14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#101a2e";
    ctx.fillRect(0, 0, canvas.width, 44);
    ctx.fillStyle = "#7fe3ff";
    ctx.font = "600 20px monospace";
    ctx.fillText("◉ studio.tv", 26, 30);
    ctx.fillStyle = "#6b7f99";
    ctx.font = "400 18px monospace";
    ctx.fillText("away from keyboard", canvas.width - 300, 30);

    const minutes = Math.floor((t / 60) % 60);
    ctx.fillStyle = "#e9f6ff";
    ctx.font = "700 52px sans-serif";
    ctx.fillText("Bibash is at the office", 46, 190);
    ctx.fillStyle = "#8fa6c4";
    ctx.font = "400 26px sans-serif";
    ctx.fillText(`back at the desk at ${formatHour(HOME_HOUR)} · driving ${minutes} min`, 46, 240);
    ctx.fillStyle = "#3b4a63";
    ctx.font = "400 20px monospace";
    ctx.fillText("the deck, the radio and every room still work while he’s out", 46, 296);
    ctx.fillStyle = "#1a2438";
    ctx.fillRect(46, canvas.height - 46, canvas.width - 92, 10);
    ctx.fillStyle = Math.sin(t * 1.4) > 0 ? "#7fe3ff" : "#1a2438";
    ctx.fillRect(46, canvas.height - 46, 130, 10);
  };
}

/** Clip a string to the pixel width with an ellipsis. */
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

/** 9.5 → "09:30" */
function formatHour(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function drawCodeLine(ctx: CanvasRenderingContext2D, line: string, x: number, y: number) {
  if (line.trim().startsWith("//")) {
    ctx.fillStyle = "#6b7f99";
    ctx.fillText(line, x, y);
    return;
  }
  // Paint strings, keywords and the rest in separate passes over one layout.
  const parts: { text: string; color: string }[] = [];
  let rest = line;
  const tokenizer = /("[^"]*"|`[^`]*`|\b(?:export|const|function|return|while|if|await|default|import|from|new|true|false|null)\b)/;
  while (rest.length) {
    const match = tokenizer.exec(rest);
    if (!match) {
      parts.push({ text: rest, color: "#d7e3f4" });
      break;
    }
    if (match.index > 0) parts.push({ text: rest.slice(0, match.index), color: "#d7e3f4" });
    const token = match[0];
    parts.push({ text: token, color: token.startsWith('"') || token.startsWith("`") ? "#9be28f" : "#ff8fc7" });
    rest = rest.slice(match.index + token.length);
  }
  let cursor = x;
  for (const part of parts) {
    ctx.fillStyle = part.color;
    ctx.fillText(part.text, cursor, y);
    cursor += ctx.measureText(part.text).width;
  }
}

function useScreenTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 600;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { canvas, texture };
  }, []);
}

function Monitor({
  typing,
  terminalText,
  leaving,
  liveSnippet,
  media,
  away,
  onSelect,
}: {
  typing: boolean;
  terminalText: string | null;
  leaving: string | null;
  /** Real recent commits; typed first when available. */
  liveSnippet?: string[] | null;
  /** What is playing on the monitor, if anything. */
  media?: MediaItem | null;
  /** Bibash is at the office: the screen says so instead of typing code. */
  away?: boolean;
  onSelect: () => void;
}) {
  const { canvas, texture } = useScreenTexture();
  const snippets = useMemo(() => (liveSnippet ? [liveSnippet, ...SNIPPETS] : SNIPPETS), [liveSnippet]);
  const state = useRef({ snippet: 0, chars: 0, last: 0, pauseUntil: 0 });

  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    const s = state.current;
    if (now - s.last < 1 / 14) return;
    const dt = now - s.last;
    s.last = now;

    if (s.snippet >= snippets.length) s.snippet = 0;
    let lines = snippets[s.snippet]!;
    let total = lines.join("\n").length;
    if (typing && now > s.pauseUntil) {
      if (s.chars >= total) {
        // The finished snippet has been admired long enough: start the next.
        s.snippet = (s.snippet + 1) % snippets.length;
        s.chars = 0;
        lines = snippets[s.snippet]!;
        total = lines.join("\n").length;
      } else {
        s.chars = Math.min(total, s.chars + dt * (22 + Math.random() * 18));
        if (s.chars >= total) s.pauseUntil = now + 2.5;
      }
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Bibash is out, or the monitor is busy playing something else.
    if (away) {
      drawAwayScreen(now)(ctx, canvas);
      texture.needsUpdate = true;
      return;
    }
    if (media) {
      if (media.kind === "link") {
        drawNowPlaying(media, now)(ctx, canvas);
        texture.needsUpdate = true;
        return;
      }
      if (media.kind === "radio") {
        drawNowPlaying(media, now)(ctx, canvas);
        texture.needsUpdate = true;
        return;
      }
    }

    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Title bar and a tab.
    ctx.fillStyle = "#131a2e";
    ctx.fillRect(0, 0, canvas.width, 44);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(26 + i * 24, 22, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(110, 8, 250, 36);
    ctx.font = "500 20px monospace";
    ctx.fillStyle = "#9fb3cc";
    ctx.fillText(lines[0]!.replace("// ", "").split("/").pop() ?? "", 126, 33);

    if (leaving) {
      ctx.fillStyle = "#7fe3ff";
      ctx.font = "600 52px monospace";
      ctx.fillText(`cd /${leaving}`, 70, 290);
      ctx.font = "400 26px monospace";
      ctx.fillStyle = "#9fb3cc";
      ctx.fillText("opening…", 70, 340);
      texture.needsUpdate = true;
      return;
    }

    ctx.font = "400 24px monospace";
    let remaining = Math.floor(s.chars);
    const lineHeight = 34;
    const termHeight = terminalText !== null ? 120 : 0;
    for (let i = 0; i < lines.length; i++) {
      const y = 86 + i * lineHeight;
      if (y > canvas.height - termHeight - 10) break;
      ctx.fillStyle = "#3b4a63";
      ctx.fillText(String(i + 1).padStart(2, " "), 18, y);
      const line = lines[i]!;
      const shown = line.slice(0, Math.max(0, remaining));
      drawCodeLine(ctx, shown, 70, y);
      if (remaining >= 0 && remaining <= line.length && Math.floor(now * 2) % 2 === 0) {
        ctx.fillStyle = "#7fe3ff";
        ctx.fillRect(70 + ctx.measureText(shown).width + 2, y - 22, 12, 28);
      }
      remaining -= line.length + 1;
    }

    if (terminalText !== null) {
      const top = canvas.height - termHeight;
      ctx.fillStyle = "#060912";
      ctx.fillRect(0, top, canvas.width, termHeight);
      ctx.fillStyle = "#24304a";
      ctx.fillRect(0, top, canvas.width, 3);
      ctx.font = "500 22px monospace";
      ctx.fillStyle = "#6b7f99";
      ctx.fillText("visitor@bibash:~$", 22, top + 46);
      ctx.fillStyle = "#e9f6ff";
      ctx.fillText(terminalText.slice(-40), 250, top + 46);
      if (Math.floor(now * 2) % 2 === 0) {
        ctx.fillStyle = "#7fe3ff";
        ctx.fillRect(254 + ctx.measureText(terminalText.slice(-40)).width, top + 26, 12, 26);
      }
      ctx.fillStyle = "#6b7f99";
      ctx.font = "400 18px monospace";
      ctx.fillText("try: cd projects · about · contact · help", 22, top + 92);
    }
    texture.needsUpdate = true;
  });

  return (
    <Hotspot spot="projects" label="Open the media deck ▶" labelAt={[0, 1.5, -0.26]} onSelect={onSelect}>
      <group position={[0, DESK_TOP, -0.28]}>
        <mesh position={[0, 0.012, 0.02]}>
          <boxGeometry args={[0.26, 0.024, 0.18]} />
          <meshStandardMaterial color="#1a1f2b" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[0.05, 0.32, 0.03]} />
          <meshStandardMaterial color="#1a1f2b" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, SCREEN_CENTER.y - DESK_TOP, 0]}>
          <boxGeometry args={[0.92, 0.55, 0.035]} />
          <meshStandardMaterial color="#10141f" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, SCREEN_CENTER.y - DESK_TOP, 0.019]}>
          <planeGeometry args={[0.88, 0.515]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* when a video is playing, it is on the monitor, not on top of the page */}
        {media && !away && <MonitorMedia item={media} onSelect={() => onSelect()} />}
      </group>
    </Hotspot>
  );
}

/* ---------- coffee ---------- */

function Steam({ level }: { level: number }) {
  const puffs = useRef<THREE.Sprite[]>([]);
  const disc = softDisc();
  useFrame(({ clock }) => {
    puffs.current.forEach((puff, i) => {
      if (!puff) return;
      const t = (clock.elapsedTime * 0.3 + i / 5) % 1;
      // Drift up and slightly to one side, thinning as it cools.
      puff.position.set(
        Math.sin(t * 5.2 + i * 1.7) * 0.018 * t,
        0.11 + t * 0.23,
        Math.cos(t * 3.4 + i * 1.3) * 0.012 * t
      );
      puff.scale.setScalar(0.04 + t * 0.09);
      const material = puff.material as THREE.SpriteMaterial;
      material.opacity = level > 0 ? (1 - t) * 0.42 * Math.sin(t * Math.PI) : 0;
    });
  });
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <sprite
          key={i}
          ref={(sprite) => {
            if (sprite) puffs.current[i] = sprite;
          }}
        >
          <spriteMaterial map={disc} color="#eaf3ff" transparent opacity={0} depthWrite={false} />
        </sprite>
      ))}
    </>
  );
}

function Mug({ mugRef, level }: { mugRef: React.RefObject<THREE.Group | null>; level: number }) {
  return (
    <group ref={mugRef} position={MUG_REST.toArray()}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.042, 0.038, 0.1, 20, 1, true]} />
        <meshStandardMaterial color="#f3ede4" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.038, 20]} />
        <meshStandardMaterial color="#f3ede4" />
      </mesh>
      <mesh position={[0, 0.005 + level * 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={level > 0}>
        <circleGeometry args={[0.04, 20]} />
        <meshStandardMaterial color="#3b2112" roughness={0.3} />
      </mesh>
      <mesh position={[0.045, 0.05, 0]}>
        <torusGeometry args={[0.024, 0.007, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f3ede4" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.06, -0.0425]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.03, 0.03]} />
        <meshBasicMaterial color="#e2572b" side={THREE.DoubleSide} />
      </mesh>
      <Steam level={level} />
    </group>
  );
}

/* ---------- the character ---------- */

function Character({
  musicBpm,
  sipCount,
  asking,
  mugRef,
  lookRef,
  sleeping = false,
  away = false,
  commute = null,
  roamToken = 0,
  onWalk,
  onDoor,
  onSeated,
  focusRef,
}: {
  musicBpm: number | null;
  sipCount: number;
  asking: boolean;
  mugRef: React.RefObject<THREE.Group | null>;
  lookRef: React.RefObject<[number, number, number] | null>;
  /** Small hours in Sindhuli: head down on the desk, eyes shut. */
  sleeping?: boolean;
  /** Bibash is at the office: the room is empty. */
  away?: boolean;
  /** Mid-commute: walking out of the door, or coming back through it. */
  commute?: "out" | "in" | null;
  /** Bumped by the parent whenever Bibash should stretch his legs. */
  roamToken?: number;
  /** Clicking Bibash himself: he gets up, or sits back down. */
  onWalk?: () => void;
  /** Fired once the commute walk reaches the doorway. */
  onDoor?: () => void;
  /** Fired when the commute walk has sat him back down at the desk. */
  onSeated?: () => void;
  /** The camera follows this point (Bibash's head) while he is on the move. */
  focusRef?: React.RefObject<THREE.Vector3 | null>;
}) {
  const rig = useRef<THREE.Group>(null);
  const fabric = fabricBump();
  /** Knitted cotton, shared by every piece of the hoodie. */
  const hoodie = { color: HOODIE, roughness: 0.9, bumpMap: fabric, bumpScale: 0.004 };
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const chair = useRef<THREE.Group>(null);
  const cups = useRef<THREE.MeshStandardMaterial>(null);
  const parts = useRef<Record<string, THREE.Mesh | null>>({});
  const legs = useRef<Record<string, THREE.Mesh | null>>({});
  const sipStart = useRef<number | null>(null);
  const lastSip = useRef(sipCount);
  const pendingSip = useRef(false);
  const eyes = useRef<THREE.Mesh[]>([]);
  const nextBlink = useRef(2);

  /* ---------- locomotion ---------- */
  /** Where Bibash is walking to, in world space. */
  const goal = useRef(SEAT.clone());
  /** Facing of the body: 0 looks at the monitor, as seated. */
  const heading = useRef(0);
  /** 0 = sitting in the chair, 1 = standing on his feet. */
  const stand = useRef(1);
  const walkPhase = useRef(0);
  /** Spot he stands at while stretching, and how long he stays. */
  const roamSpot = useRef<{ at: THREE.Vector3; lookAt: THREE.Vector3 } | null>(null);
  const roamUntil = useRef(0);
  const lastRoam = useRef(roamToken);
  const commuteDone = useRef<"in" | "out" | null>(null);
  const setLeg = (name: keyof typeof legs.current) => (mesh: THREE.Mesh | null) => {
    legs.current[name] = mesh;
  };

  // Live hand positions in rig space; they ease toward each frame's target.
  const hands = useMemo(
    () => ({ l: new THREE.Vector3(-0.11, 0.8, -0.49), r: new THREE.Vector3(0.11, 0.8, -0.49) }),
    []
  );
  const scratch = useMemo(
    () => ({
      targetL: new THREE.Vector3(),
      targetR: new THREE.Vector3(),
      elbow: new THREE.Vector3(),
      hand: new THREE.Vector3(),
      shoulderL: new THREE.Vector3(-0.19, 1.0, -0.05),
      shoulderR: new THREE.Vector3(0.19, 1.0, -0.05),
      poleL: new THREE.Vector3(-1, -0.7, 0.5).normalize(),
      poleR: new THREE.Vector3(1, -0.7, 0.5).normalize(),
      world: new THREE.Vector3(),
      mouth: new THREE.Vector3(),
      look: new THREE.Vector3(),
      move: new THREE.Vector3(),
      view: new THREE.Vector3(),
      hip: new THREE.Vector3(),
      foot: new THREE.Vector3(),
      knee: new THREE.Vector3(),
      toe: new THREE.Vector3(),
    }),
    []
  );

  useEffect(() => {
    if (sipCount !== lastSip.current) {
      lastSip.current = sipCount;
      pendingSip.current = true;
    }
  }, [sipCount]);

  // A stretch begins: pick somewhere to go and stand up — or, if he is already
  // out of the chair, walk it off and sit back down.
  if (roamToken !== lastRoam.current) {
    lastRoam.current = roamToken;
    if (!away && !commute && !sleeping) {
      if (stand.current > 0.5 || roamSpot.current) {
        roamSpot.current = null;
        roamUntil.current = 0;
        goal.current.copy(SEAT);
      } else {
        roamSpot.current = STRETCH_SPOTS[Math.floor(Math.random() * STRETCH_SPOTS.length)] ?? STRETCH_SPOTS[0]!;
        roamUntil.current = 0;
      }
    }
  }

  useFrame(({ clock, pointer }, delta) => {
    const t = clock.elapsedTime;
    const group = rig.current;
    if (!group || !head.current || !torso.current) return;
    const k = 1 - Math.exp(-delta * 9);

    /* ---------- walking: commute, stretch, or seated at the desk ---------- */

    if (commute === "out") {
      goal.current.copy(DOOR);
      if (group.position.distanceTo(DOOR) < 0.12 && commuteDone.current !== "out") {
        commuteDone.current = "out";
        onDoor?.();
      }
    } else if (commute === "in") {
      // Comes back in through the door and sits down again.
      if (group.position.distanceTo(SEAT) < 0.12) {
        if (commuteDone.current !== "in") {
          commuteDone.current = "in";
          onSeated?.();
        }
      } else {
        goal.current.copy(SEAT);
      }
    } else if (roamSpot.current) {
      // Walking, pausing at the spot, then heading back to the chair.
      if (roamUntil.current === 0 && group.position.distanceTo(roamSpot.current.at) < 0.12) roamUntil.current = t + PAUSE_SECONDS;
      if (roamUntil.current && t > roamUntil.current) {
        roamSpot.current = null;
        roamUntil.current = 0;
      } else {
        goal.current.copy(roamSpot.current.at);
      }
    } else if (group.position.distanceTo(SEAT) > 0.09) {
      goal.current.copy(SEAT); // coming home to the chair
    }

    const toGoal = scratch.move.subVectors(goal.current, group.position);
    const distance = toGoal.length();
    const moving = distance > 0.09;
    if (moving) {
      toGoal.divideScalar(Math.max(distance, 0.0001));
      group.position.addScaledVector(toGoal, Math.min(WALK_SPEED * delta, distance));
      heading.current = Math.atan2(-toGoal.x, -toGoal.z);
    } else if (roamSpot.current) {
      // Arrived: turn and take the view in.
      const view = scratch.view.subVectors(roamSpot.current.lookAt, group.position);
      heading.current = Math.atan2(-view.x, -view.z);
    } else if (commute !== "in") {
      // Sitting at the desk: square up to the monitor again.
      group.position.lerp(SEAT, 1 - Math.exp(-delta * 8));
      heading.current += (0 - heading.current) * (1 - Math.exp(-delta * 2.5));
    }

    // Standing he is tall; sitting he settles onto the cushion.
    const onTheMove = moving || !!roamSpot.current || !!commute;
    const seated = !onTheMove && group.position.distanceTo(SEAT) < 0.09;
    stand.current += ((seated ? 0 : 1) - stand.current) * (1 - Math.exp(-delta * 5));

    // The chair swivels to greet the visitor while he is sitting in it.
    const chairYaw = seated ? (asking ? -0.85 : Math.sin(t * 0.25) * 0.03) : heading.current;
    group.rotation.y += (chairYaw - group.rotation.y) * (1 - Math.exp(-delta * (seated ? 3 : 7)));
    group.updateMatrixWorld();

    // The legs swing only while he is actually moving; standing still they
    // hold a natural, slightly-uneven stance.
    walkPhase.current += delta * (moving ? 8 : 1.2);
    const stride = moving ? 0.17 : 0;
    const hipHeight = THREE.MathUtils.lerp(0.53, 0.61, stand.current);
    const footBase = THREE.MathUtils.lerp(-0.33, -0.05, stand.current);

    for (const side of ["L", "R"] as const) {
      const swing = Math.sin(walkPhase.current + (side === "L" ? 0 : Math.PI));
      const hip = scratch.hip.set(side === "L" ? -0.09 : 0.09, hipHeight, THREE.MathUtils.lerp(0.02, 0.05, stand.current));
      const foot = scratch.foot.set(
        (side === "L" ? -0.11 : 0.11) + swing * stride * 0.45,
        0.075 + Math.max(0, swing) * (moving ? 0.05 : 0.008),
        footBase + swing * stride
      );
      solveLeg(hip, foot, scratch.knee, scratch.toe);
      if (legs.current[`thigh${side}`]) placeLimb(legs.current[`thigh${side}`]!, hip, scratch.knee);
      if (legs.current[`shin${side}`]) placeLimb(legs.current[`shin${side}`]!, scratch.knee, scratch.toe);
      legs.current[`foot${side}`]?.position.copy(scratch.toe);
    }

    // The chair is sat on, not carried: it stays where it is.
    if (chair.current) chair.current.visible = stand.current < 0.6;

    const hovering = stand.current > 0.5 || away;

    // Blink every few seconds, now and then twice in a row.
    if (t > nextBlink.current + 0.14) nextBlink.current = t + (Math.random() < 0.2 ? 0.25 : 2.5 + Math.random() * 3.5);
    const lid = sleeping || t > nextBlink.current ? 0.1 : 1;
    for (const eye of eyes.current) if (eye) eye.scale.y = lid;

    // Start a queued sip only while facing the desk.
    if (pendingSip.current && !asking && sipStart.current === null) {
      pendingSip.current = false;
      sipStart.current = t;
    }
    const sipT = sipStart.current === null ? -1 : (t - sipStart.current) / SIP_SECONDS;
    if (sipT >= 1) sipStart.current = null;
    const sipping = sipT >= 0 && sipT < 1;

    const toRig = (v: THREE.Vector3, out: THREE.Vector3) => group.worldToLocal(out.copy(v));

    // Out walking, he never types: hands swing at his sides instead.
    const swingL = Math.sin(walkPhase.current);
    const swingR = Math.sin(walkPhase.current + Math.PI);
    if (hovering) {
      const hang = THREE.MathUtils.lerp(1.0, hipHeight, stand.current) + 0.08;
      scratch.targetL.set(-0.16 + swingL * 0.11, hang + Math.abs(swingL) * 0.03, swingL * 0.12);
      scratch.targetR.set(0.16 + swingR * 0.11, hang + Math.abs(swingR) * 0.03, swingR * 0.12);
    }

    // Default: both hands on the keys, fingers pattering.
    const typingL = toRig(KEYS_L, scratch.targetL);
    const typingR = toRig(KEYS_R, scratch.targetR);
    typingL.y += Math.max(0, Math.sin(t * 15.3)) * 0.016;
    typingL.x += Math.sin(t * 2.1) * 0.02;
    typingR.y += Math.max(0, Math.sin(t * 13.7 + 1.3)) * 0.016;
    typingR.x += Math.sin(t * 1.7 + 2) * 0.02;

    // Idle: drift with the visitor's cursor, so the room feels aware of them.
    let headPitch = -0.06 + pointer.y * 0.08 + (musicBpm ? Math.sin(t * (musicBpm / 60) * Math.PI * 2) * 0.07 : 0);
    let headYaw = Math.sin(t * 0.4) * 0.08 - pointer.x * 0.32;
    let mugHeld = false;

    if (sleeping && !asking) {
      // Arms folded on the desk in front of the keyboard, head resting on them.
      toRig(scratch.world.set(KEYS_L.x - 0.05, KEYS_L.y - 0.01, KEYS_L.z - 0.08), scratch.targetL);
      toRig(scratch.world.set(KEYS_R.x + 0.05, KEYS_R.y - 0.01, KEYS_R.z - 0.08), scratch.targetR);
      headPitch = -0.6 + Math.sin(t * 1.1) * 0.02;
      headYaw = 0.2;
    } else if (asking) {
      scratch.targetL.set(-0.1, 0.6, -0.2);
      scratch.targetR.set(0.32 + Math.sin(t * 9) * 0.06, 1.42, -0.1);
      headYaw = -0.95;
      headPitch = 0.1;
    } else if (sipping) {
      // reach → lift → drink → lower → back to the keys
      const grip = toRig(MUG_GRIP, scratch.world);
      const mouth = scratch.mouth.set(0.07, 1.08, -0.21);
      const keysR = scratch.targetR.clone();
      if (sipT < 0.18) scratch.targetR.lerpVectors(keysR, grip, smooth(sipT / 0.18));
      else if (sipT < 0.36) scratch.targetR.lerpVectors(grip, mouth, smooth((sipT - 0.18) / 0.18));
      else if (sipT < 0.62) scratch.targetR.copy(mouth);
      else if (sipT < 0.8) scratch.targetR.lerpVectors(mouth, grip, smooth((sipT - 0.62) / 0.18));
      else scratch.targetR.lerpVectors(grip, keysR, smooth((sipT - 0.8) / 0.2));
      mugHeld = sipT > 0.17 && sipT < 0.81;
      const drink = sipT > 0.34 && sipT < 0.66 ? Math.sin(((sipT - 0.34) / 0.32) * Math.PI) : 0;
      headPitch = -0.02 + drink * 0.32;
      headYaw = 0.1;
    } else if (seated && !asking && !sipping && !sleeping) {
      // Idle at the desk: right hand taps on the surface now and then.
      const tap = Math.abs(Math.sin(t * 3)) > 0.95 ? 0.015 : 0;
      scratch.targetR.set(0.16, 0.82 + tap * 0.5, 0.13 + tap);
      scratch.targetL.set(-0.11, 0.8, 0.13);
    }

    hands.l.lerp(scratch.targetL, k);
    hands.r.lerp(scratch.targetR, asking ? 1 - Math.exp(-delta * 14) : k);

    // Upper body: lean in to type, sit back to talk, stand up straight to walk.
    // The torso pivots at the hips, so carry the shoulders and head with it.
    const lean = seated ? (asking ? 0.02 : sleeping ? -0.42 : -0.08) : 0.02;
    torso.current.rotation.x += (lean - torso.current.rotation.x) * k;
    const bounce = musicBpm ? Math.abs(Math.sin(t * (musicBpm / 60) * Math.PI)) * 0.006 : 0;
    const torsoHeight = THREE.MathUtils.lerp(0.52, 0.61, stand.current);
    const shoulderHeight = THREE.MathUtils.lerp(1.0, 1.09, stand.current);
    const headHeight = THREE.MathUtils.lerp(1.2, 1.29, stand.current);
    const tilt = Math.sin(torso.current.rotation.x);
    torso.current.position.y = torsoHeight + bounce;
    scratch.shoulderL.set(-0.19, shoulderHeight + bounce, -0.05 + tilt * 0.48);
    scratch.shoulderR.set(0.19, shoulderHeight + bounce, -0.05 + tilt * 0.48);
    parts.current.lShoulder?.position.copy(scratch.shoulderL);
    parts.current.rShoulder?.position.copy(scratch.shoulderR);
    head.current.position.set(0, headHeight + bounce, -0.06 + tilt * 0.68);

    // While he is out walking, the camera keeps him in frame; sitting still it lets go.
    if (focusRef) {
      if (stand.current > 0.5) focusRef.current?.copy(head.current.position).add(group.position);
      else focusRef.current = null;
    }

    // Glance at whatever the visitor is hovering, so the room feels responsive.
    const lookAt = lookRef.current;
    // On each quarter hour, glance up at the wall clock.
    if (!lookAt && !sleeping && !sipping && !asking && isClockGlance(nepalClock(Date.now()))) {
      headYaw = 0;
      headPitch = 0.55;
    }
    if (lookAt && !sipping && !asking && !sleeping) {
      const target = group.worldToLocal(scratch.look.set(...lookAt));
      const dx = target.x - head.current.position.x;
      const dy = target.y - head.current.position.y;
      const dz = target.z - head.current.position.z;
      headYaw = THREE.MathUtils.clamp(Math.atan2(-dx, -dz), -1.1, 1.1);
      headPitch = THREE.MathUtils.clamp(Math.atan2(dy, Math.hypot(dx, dz)), -0.5, 0.5);
    }

    // Arms.
    for (const side of ["l", "r"] as const) {
      const shoulder = side === "l" ? scratch.shoulderL : scratch.shoulderR;
      const pole = side === "l" ? scratch.poleL : scratch.poleR;
      solveArm(shoulder, hands[side], pole, scratch.elbow, scratch.hand);
      const upper = parts.current[`${side}Upper`];
      const fore = parts.current[`${side}Fore`];
      const elbow = parts.current[`${side}Elbow`];
      const hand = parts.current[`${side}Hand`];
      if (upper) placeLimb(upper, shoulder, scratch.elbow);
      if (fore) placeLimb(fore, scratch.elbow, scratch.hand);
      elbow?.position.copy(scratch.elbow);
      hand?.position.copy(scratch.hand);
    }

    // Mug follows the right hand while held.
    const mug = mugRef.current;
    if (mug) {
      if (mugHeld) {
        const handWorld = group.localToWorld(scratch.world.copy(hands.r));
        mug.position.set(handWorld.x - 0.035, handWorld.y - 0.06, handWorld.z - 0.02);
        const drinkTilt = sipT > 0.34 && sipT < 0.66 ? Math.sin(((sipT - 0.34) / 0.32) * Math.PI) * 0.9 : 0;
        mug.rotation.set(0, 0, drinkTilt * 0.6);
        mug.rotation.x = drinkTilt * 0.5;
      } else {
        mug.position.lerp(MUG_REST, 0.5);
        mug.rotation.set(0, 0, 0);
      }
    }

    head.current.rotation.x += (headPitch - head.current.rotation.x) * k;
    head.current.rotation.y += (headYaw - head.current.rotation.y) * (1 - Math.exp(-delta * 4));

    if (cups.current) cups.current.emissiveIntensity = musicBpm ? 1.4 + Math.sin(t * 6) * 0.4 : 0.15;
  });

  const setPart = (name: string) => (mesh: THREE.Mesh | null) => {
    parts.current[name] = mesh;
  };

  // At the office: the desk is empty until he comes back.
  if (away) return null;

  // Clicking Bibash himself is the easiest way to make him get up and walk.
  return (
    <Hotspot
      spot="character"
      label={stand.current > 0.5 ? "Sit back down" : "Get up and look around"}
      labelAt={[0.3, 1.55, 0.6]}
      onSelect={() => onWalk?.()}
    >
    <group ref={rig} position={SEAT.toArray()}>
      {/* the chair stays in the room, whether or not he is sitting in it */}
      <group ref={chair}>
      <RoundedBox args={[0.46, 0.06, 0.44]} radius={0.02} smoothness={3} position={[0, 0.46, 0]} castShadow>
        <meshStandardMaterial color="#232a3a" bumpMap={fabric} bumpScale={0.006} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[0.44, 0.48, 0.05]} radius={0.02} smoothness={3} position={[0, 0.74, 0.21]} rotation={[0.06, 0, 0]} castShadow>
        <meshStandardMaterial color="#232a3a" bumpMap={fabric} bumpScale={0.006} roughness={0.85} />
      </RoundedBox>
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.42, 10]} />
        <meshStandardMaterial color="#3d4457" metalness={0.6} roughness={0.45} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos((i / 5) * Math.PI * 2) * 0.16, 0.03, Math.sin((i / 5) * Math.PI * 2) * 0.16]} rotation={[0, -(i / 5) * Math.PI * 2, 0]}>
          <boxGeometry args={[0.32, 0.025, 0.035]} />
          <meshStandardMaterial color="#59627a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      </group>

      {/* legs: posed every frame by the walk cycle, so they can carry him */}
      {(["L", "R"] as const).map((side) => (
        <group key={side}>
          <mesh ref={setLeg(`thigh${side}`)}>
            <cylinderGeometry args={[0.068, 0.062, 1, 14]} />
            <meshStandardMaterial color={PANTS} roughness={0.82} />
          </mesh>
          <mesh ref={setLeg(`shin${side}`)}>
            <cylinderGeometry args={[0.058, 0.05, 1, 12]} />
            <meshStandardMaterial color={PANTS} roughness={0.82} />
          </mesh>
          <mesh ref={setLeg(`foot${side}`)} position={[side === "L" ? -0.11 : 0.11, 0.075, -0.33]}>
            <boxGeometry args={[0.1, 0.07, 0.22]} />
            <meshStandardMaterial color="#e8e8ea" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* upper body: the torso leans from the hips; head and arms follow in useFrame */}
      <group ref={torso} position={[0, 0.52, 0]}>
        <group>
          <mesh position={[0, 0.27, -0.03]} scale={[1.2, 1, 0.8]}>
            <capsuleGeometry args={[0.15, 0.26, 6, 14]} />
            <meshStandardMaterial {...hoodie} />
          </mesh>
          {/* hood bunched at the back of the neck */}
          <mesh position={[0, 0.5, 0.05]} rotation={[0.3, 0, 0]} scale={[1.2, 0.6, 0.8]}>
            <torusGeometry args={[0.08, 0.035, 8, 16]} />
            <meshStandardMaterial {...hoodie} />
          </mesh>
          {/* drawstrings */}
          {[-0.04, 0.04].map((x) => (
            <mesh key={x} position={[x, 0.36, -0.15]}>
              <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
              <meshStandardMaterial color="#f0f0f0" />
            </mesh>
          ))}
          <mesh position={[0, 0.56, -0.04]}>
            <cylinderGeometry args={[0.045, 0.05, 0.08, 10]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>
      </group>

        <group ref={head} position={[0, 1.2, -0.06]}>
          <mesh>
            <sphereGeometry args={[0.115, 24, 20]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.035, 0.022]} scale={[1.02, 0.95, 1]}>
            <sphereGeometry args={[0.118, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
          </mesh>
          {[-0.04, 0.04].map((x, i) => (
            <mesh
              key={x}
              ref={(mesh) => {
                if (mesh) eyes.current[i] = mesh;
              }}
              position={[x, 0.005, -0.107]}
            >
              <sphereGeometry args={[0.012, 10, 10]} />
              <meshStandardMaterial color="#1a1a1a" />
            </mesh>
          ))}
          {/* glasses */}
          {[-0.042, 0.042].map((x) => (
            <mesh key={`g${x}`} position={[x, 0.005, -0.112]}>
              <torusGeometry args={[0.026, 0.004, 6, 18]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          ))}
          <mesh position={[0, -0.025, -0.115]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial color="#c98f6f" />
          </mesh>
          <mesh position={[0, -0.06, -0.103]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.022, 0.004, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#8a4b3b" />
          </mesh>
          {/* headphones */}
          <mesh position={[0, 0.01, 0.005]}>
            <torusGeometry args={[0.132, 0.011, 8, 28, Math.PI]} />
            <meshStandardMaterial color="#15171d" metalness={0.4} roughness={0.4} />
          </mesh>
          {[-0.128, 0.128].map((x) => (
            <group key={x} position={[x, 0, 0.005]} rotation={[0, 0, Math.PI / 2]}>
              <mesh>
                <cylinderGeometry args={[0.048, 0.048, 0.035, 18]} />
                <meshStandardMaterial color="#15171d" metalness={0.4} roughness={0.4} />
              </mesh>
              <mesh position={[0, x > 0 ? 0.019 : -0.019, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.004, 18]} />
                <meshStandardMaterial ref={x > 0 ? cups : undefined} color="#7fe3ff" emissive="#7fe3ff" emissiveIntensity={0.15} />
              </mesh>
            </group>
          ))}
        </group>

        {/* arms: positioned every frame by the IK */}
        {(["l", "r"] as const).map((side) => (
          <group key={side}>
            <mesh ref={setPart(`${side}Shoulder`)} position={[side === "l" ? -0.19 : 0.19, 1.0, -0.05]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial {...hoodie} />
            </mesh>
            <mesh ref={setPart(`${side}Upper`)}>
              <cylinderGeometry args={[0.048, 0.044, 1, 12]} />
              <meshStandardMaterial {...hoodie} />
            </mesh>
            <mesh ref={setPart(`${side}Elbow`)}>
              <sphereGeometry args={[0.044, 12, 12]} />
              <meshStandardMaterial {...hoodie} />
            </mesh>
            <mesh ref={setPart(`${side}Fore`)}>
              <cylinderGeometry args={[0.04, 0.036, 1, 12]} />
              <meshStandardMaterial {...hoodie} />
            </mesh>
            <mesh ref={setPart(`${side}Hand`)} scale={[1, 0.75, 1.2]}>
              <sphereGeometry args={[0.036, 12, 12]} />
              <meshStandardMaterial color={SKIN} roughness={0.7} />
            </mesh>
          </group>
        ))}
    </group>
    </Hotspot>
  );
}

/* ---------- the room ---------- */

function useSkyTexture(phase: DayPhase) {
  return useMemo(() => {
    const look = PHASE_LOOK[phase];
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, 256);
      gradient.addColorStop(0, look.sky[0]);
      gradient.addColorStop(1, look.sky[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      if (look.stars) {
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 70; i++) {
          ctx.globalAlpha = 0.3 + ((i * 37) % 70) / 100;
          ctx.fillRect((i * 97) % 256, (i * 53) % 170, 1.6, 1.6);
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = look.orb;
      ctx.shadowColor = look.orb;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(phase === "evening" ? 70 : 180, phase === "evening" ? 190 : 70, phase === "night" ? 20 : 26, 0, Math.PI * 2);
      ctx.fill();
      // Distant hills: Sindhuli is in the mountains.
      ctx.shadowBlur = 0;
      ctx.fillStyle = phase === "night" ? "#0a0f22" : phase === "evening" ? "#2b1e45" : "#4d7a8c";
      ctx.beginPath();
      ctx.moveTo(0, 256);
      for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, 200 - Math.sin(x / 30) * 18 - Math.sin(x / 11) * 6);
      ctx.lineTo(256, 256);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, [phase]);
}

function usePosterTexture() {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 340;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#101829";
      ctx.fillRect(0, 0, 256, 340);
      ctx.fillStyle = "#7fe3ff";
      ctx.font = "700 92px sans-serif";
      ctx.fillText("BP", 40, 150);
      ctx.fillStyle = "#ff8fc7";
      ctx.fillRect(40, 175, 120, 8);
      ctx.fillStyle = "#d7e3f4";
      ctx.font = "500 22px monospace";
      ctx.fillText("about.me", 40, 230);
      ctx.fillStyle = "#6b7f99";
      ctx.font = "400 17px monospace";
      ctx.fillText("creative developer", 40, 262);
      ctx.fillText("sindhuli · nepal", 40, 288);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

const BOOK_COLORS = ["#e2572b", "#3d8bfd", "#f4c14d", "#46b98a", "#a974ff", "#ef6f9c", "#4cc3d9", "#d8d0c0"];

function Room({
  phase,
  quality,
  weather,
  onTarget,
}: {
  phase: DayPhase;
  quality: "high" | "low";
  weather?: Weather | null;
  onTarget: (target: SceneTarget) => void;
}) {
  const sky = useSkyTexture(phase);
  const poster = usePosterTexture();
  const look = PHASE_LOOK[phase];
  const wall = phase === "night" ? "#1b2233" : "#2a3247";

  // Real materials, painted procedurally: boards underfoot, walnut on the
  // desk, plaster on the walls, wool under the chair.
  const boards = floorTexture();
  const boardsRough = floorRoughness();
  const walnut = deskTexture();
  const plaster = plasterTexture();
  const plasterRelief = plasterBump();
  const wool = rugTexture();
  const paper = paperTexture();
  const metal = brushedMetal();
  const metalRough = brushedMetalRoughness();
  const fabric = fabricBump();

  const night = phase === "night" || phase === "evening";

  return (
    <>
      {/* floor, rug, walls */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.5]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial map={boards} roughnessMap={boardsRough} metalness={0.05} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.006, 0.75]} receiveShadow>
        <circleGeometry args={[1.05, 56]} />
        <meshStandardMaterial map={wool} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[0, 1.6, -0.75]} receiveShadow>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial
          map={plaster}
          bumpMap={plasterRelief}
          bumpScale={0.014}
          color={wall}
          roughness={0.97}
        />
      </mesh>
      <mesh position={[-2.2, 1.6, 0.6]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[3, 3.2]} />
        <meshStandardMaterial
          map={plaster}
          bumpMap={plasterRelief}
          bumpScale={0.014}
          color={wall}
          roughness={0.97}
        />
      </mesh>

      {/* skirting boards: the small join that makes a wall read as a room */}
      <mesh position={[0, 0.055, -0.735]}>
        <boxGeometry args={[6, 0.11, 0.025]} />
        <meshStandardMaterial color="#171c27" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[-2.185, 0.055, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[3, 0.11, 0.025]} />
        <meshStandardMaterial color="#171c27" roughness={0.55} metalness={0.15} />
      </mesh>

      {/* window → experience */}
      <Hotspot
        spot="experience"
        label="Experience ↗"
        labelAt={[-1.25, 2.08, -0.7]}
        onSelect={() => onTarget({ kind: "page", slug: "experience" })}
      >
        <group position={[-1.25, 1.55, -0.74]}>
          <mesh>
            <planeGeometry args={[0.95, 0.85]} />
            <meshBasicMaterial map={sky} toneMapped={false} />
          </mesh>
          {/* glass: a faint reflection so the pane exists */}
          <mesh position={[0, 0, 0.008]}>
            <planeGeometry args={[0.93, 0.83]} />
            <meshPhysicalMaterial
              color="#cfe3ff"
              transparent
              opacity={0.13}
              roughness={0.08}
              metalness={0.1}
              clearcoat={1}
              clearcoatRoughness={0.08}
            />
          </mesh>
          {[
            [0, 0.44, 1.01, 0.04],
            [0, -0.44, 1.01, 0.04],
            [-0.49, 0, 0.04, 0.92],
            [0.49, 0, 0.04, 0.92],
            [0, 0, 0.025, 0.86],
            [0, 0, 0.96, 0.025],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x!, y!, 0.015]}>
              <boxGeometry args={[w!, h!, 0.03]} />
              <meshStandardMaterial color="#e9e4da" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, -0.47, 0.06]}>
            <boxGeometry args={[1.08, 0.03, 0.12]} />
            <meshStandardMaterial color="#e9e4da" roughness={0.6} />
          </mesh>
          {/* curtain rod and two heavy panels */}
          <mesh position={[0, 0.56, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 1.5, 12]} />
            <meshStandardMaterial color="#2a2f3c" metalness={0.8} roughness={0.35} />
          </mesh>
          {[-0.6, 0.6].map((x) => (
            <mesh key={x} position={[x, 0.02, 0.1]} castShadow>
              <boxGeometry args={[0.24, 1.06, 0.05]} />
              <meshStandardMaterial
                color="#3c4a70"
                bumpMap={fabric}
                bumpScale={0.02}
                roughness={0.95}
              />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* poster → about */}
      <Hotspot spot="about" label="About me ↗" labelAt={[0.95, 2.18, -0.7]} onSelect={() => onTarget({ kind: "page", slug: "about" })}>
        <group position={[0.95, 1.85, -0.735]}>
          <mesh>
            <planeGeometry args={[0.42, 0.56]} />
            <meshBasicMaterial map={poster} toneMapped={false} />
          </mesh>
          {/* thin frame, lit from above */}
          {[
            [0, 0.288, 0.46, 0.022],
            [0, -0.288, 0.46, 0.022],
            [-0.219, 0, 0.022, 0.6],
            [0.219, 0, 0.022, 0.6],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} position={[x!, y!, 0.011]}>
              <boxGeometry args={[w!, h!, 0.022]} />
              <meshStandardMaterial color="#1a1f2b" metalness={0.35} roughness={0.45} />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* bookshelf → skills */}
      <Hotspot spot="skills" label="Skills ↗" labelAt={[1.75, 1.95, -0.5]} onSelect={() => onTarget({ kind: "page", slug: "skills" })}>
        <group position={[1.75, 0, -0.55]}>
          {[0.02, 0.5, 0.98, 1.46].map((y) => (
            <mesh key={y} position={[0, y + 0.01, 0]}>
              <boxGeometry args={[0.7, 0.03, 0.32]} />
              <meshStandardMaterial color="#6b4a33" roughness={0.8} />
            </mesh>
          ))}
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 0.75, 0]}>
              <boxGeometry args={[0.03, 1.5, 0.32]} />
              <meshStandardMaterial color="#6b4a33" roughness={0.8} />
            </mesh>
          ))}
          {[0.03, 0.51, 0.99].map((shelf, row) =>
            Array.from({ length: 8 }, (_, i) => {
              const h = 0.24 + ((i * 7 + row * 3) % 5) * 0.035;
              return (
                <mesh key={`${row}-${i}`} position={[-0.28 + i * 0.075, shelf + h / 2 + 0.015, 0]} rotation={[0, 0, i === 6 ? 0.18 : 0]}>
                  <boxGeometry args={[0.06, h, 0.22]} />
                  <meshStandardMaterial color={BOOK_COLORS[(i + row * 3) % BOOK_COLORS.length]} roughness={0.7} />
                </mesh>
              );
            })
          )}
          {/* a plant on top */}
          <mesh position={[0.15, 1.56, 0]}>
            <cylinderGeometry args={[0.07, 0.055, 0.12, 14]} />
            <meshStandardMaterial color="#c86b4a" roughness={0.8} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0.15 + Math.cos(i * 1.3) * 0.05, 1.7 + (i % 2) * 0.05, Math.sin(i * 1.3) * 0.05]} rotation={[Math.cos(i) * 0.6, i, Math.sin(i) * 0.6]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <meshStandardMaterial color="#3f9a5a" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* desk */}
      <RoundedBox
        args={[1.8, 0.05, 0.85]}
        radius={0.012}
        smoothness={4}
        position={[0, DESK_TOP - 0.025, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial map={walnut} roughness={0.42} metalness={0.06} />
      </RoundedBox>
      {/* apron and cable channel under the top */}
      <mesh position={[0, DESK_TOP - 0.075, 0.405]}>
        <boxGeometry args={[1.72, 0.06, 0.025]} />
        <meshStandardMaterial map={walnut} roughness={0.55} />
      </mesh>
      <mesh position={[0, DESK_TOP - 0.075, -0.405]}>
        <boxGeometry args={[1.72, 0.06, 0.025]} />
        <meshStandardMaterial map={walnut} roughness={0.55} />
      </mesh>
      {[
        [-0.85, -0.38],
        [0.85, -0.38],
        [-0.85, 0.38],
        [0.85, 0.38],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x!, (DESK_TOP - 0.05) / 2, z!]} castShadow>
          <boxGeometry args={[0.05, DESK_TOP - 0.05, 0.05]} />
          <meshStandardMaterial
            map={metal}
            roughnessMap={metalRough}
            color="#8d939e"
            metalness={0.85}
            roughness={0.35}
          />
        </mesh>
      ))}

      {/* keyboard + mouse */}
      <RoundedBox args={[0.72, 0.005, 0.3]} radius={0.004} smoothness={2} position={[0.04, DESK_TOP + 0.0025, 0.11]}>
        <meshStandardMaterial color="#12161f" roughness={0.94} />
      </RoundedBox>
      <Keyboard position={[0, DESK_TOP, 0.12]} />
      <RoundedBox
        args={[0.062, 0.032, 0.1]}
        radius={0.014}
        smoothness={3}
        position={[0.27, DESK_TOP + 0.021, 0.04]}
        castShadow
      >
        <meshStandardMaterial color="#1c2130" roughness={0.45} metalness={0.2} />
      </RoundedBox>

      {/* live desk gadgets: Sindhuli's clock and the weather outside */}
      <Hotspot spot="clock" label="Sindhuli time ↗" labelAt={[0.6, 1.0, 0.31]} onSelect={() => onTarget({ kind: "clock" })}>
        <DeskClock position={[0.6, DESK_TOP + 0.002, 0.31]} rotationY={-0.22} />
      </Hotspot>
      <Hotspot spot="weather" label="Sindhuli weather ↗" labelAt={[0.8, 1.0, 0.14]} onSelect={() => onTarget({ kind: "weather" })}>
        <WeatherStation position={[0.8, DESK_TOP + 0.002, 0.14]} rotationY={-0.42} weather={weather ?? null} />
      </Hotspot>

      {/* desk lamp → services */}
      <Hotspot
        spot="services"
        label="Services ↗"
        labelAt={[0.9, 1.42, -0.24]}
        onSelect={() => onTarget({ kind: "page", slug: "services" })}
      >
        <group position={[0.72, DESK_TOP, -0.26]}>
          {/* weighted base */}
          <mesh position={[0, 0.011, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.086, 0.022, 24]} />
            <meshStandardMaterial color="#232833" metalness={0.65} roughness={0.32} />
          </mesh>
          {/* stem */}
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.009, 0.011, 0.38, 12]} />
            <meshStandardMaterial color="#a7b0bf" metalness={0.9} roughness={0.28} />
          </mesh>
          {/* elbow */}
          <mesh position={[0, 0.39, 0]}>
            <sphereGeometry args={[0.017, 14, 10]} />
            <meshStandardMaterial color="#232833" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* arm reaching out over the desk */}
          <mesh position={[0, 0.39, 0.11]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.22, 10]} />
            <meshStandardMaterial color="#a7b0bf" metalness={0.9} roughness={0.28} />
          </mesh>
          {/* shade, hanging from the arm with its mouth toward the desk */}
          <group position={[0, 0.355, 0.22]}>
            <mesh castShadow>
              <coneGeometry args={[0.062, 0.1, 26, 1, true]} />
              <meshStandardMaterial
                color="#b8481f"
                side={THREE.DoubleSide}
                metalness={0.45}
                roughness={0.42}
              />
            </mesh>
            {/* rolled rim */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.062, 0.0045, 8, 26]} />
              <meshStandardMaterial color="#8e3a1c" metalness={0.55} roughness={0.4} />
            </mesh>
            {/* the bulb, warm and small */}
            <mesh position={[0, -0.028, 0]}>
              <sphereGeometry args={[0.019, 14, 12]} />
              <meshStandardMaterial
                color="#fff3d6"
                emissive="#ffdca8"
                emissiveIntensity={night ? 1.6 : 0.3}
                toneMapped={false}
              />
            </mesh>
            <pointLight
              position={[0, -0.06, 0.02]}
              intensity={night ? 1 : 0.35}
              distance={1.7}
              color="#ffcf8a"
              castShadow={false}
            />
          </group>
        </group>
      </Hotspot>

      {/* phone → contact */}
      <Hotspot spot="contact" label="Contact ↗" labelAt={[-0.45, 0.95, 0.18]} onSelect={() => onTarget({ kind: "page", slug: "contact" })}>
        <mesh position={[-0.45, DESK_TOP + 0.006, 0.18]} rotation={[0, 0.25, 0]}>
          <boxGeometry args={[0.075, 0.012, 0.15]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh position={[-0.45, DESK_TOP + 0.013, 0.18]} rotation={[-Math.PI / 2, 0, 0.25]}>
          <planeGeometry args={[0.065, 0.135]} />
          <meshBasicMaterial color="#2bd4a0" toneMapped={false} />
        </mesh>
      </Hotspot>

      {/* notebook → resume */}
      <Hotspot spot="resume" label="Resume ↗" labelAt={[-0.5, 0.95, -0.05]} onSelect={() => onTarget({ kind: "page", slug: "resume" })}>
        <group position={[-0.5, DESK_TOP, -0.05]} rotation={[0, -0.3, 0]}>
          <RoundedBox args={[0.2, 0.02, 0.27]} radius={0.003} smoothness={2} position={[0, 0.01, 0]} castShadow>
            <meshStandardMaterial color="#e0b544" roughness={0.75} />
          </RoundedBox>
          <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.17, 0.24]} />
            <meshStandardMaterial map={paper} roughness={0.92} />
          </mesh>
        </group>
      </Hotspot>

      {/* window light, room fill */}
      <ambientLight intensity={look.ambient * 0.6} />
      <hemisphereLight args={[look.sky[0], "#2a1c14", 0.5]} />
      <directionalLight
        position={[-2.6, 3.4, 0.8]}
        intensity={night ? 0.55 : 1.45}
        color={look.sun}
        castShadow={quality === "high"}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={9}
      />
      {/* cool rim from the window, to lift the character off the wall */}
      <directionalLight position={[-1.2, 2.2, -1.6]} intensity={night ? 0.5 : 0.35} color="#9dc4ff" />
      <pointLight position={SCREEN_CENTER.clone().add(new THREE.Vector3(0, 0, 0.35)).toArray()} intensity={1.05} distance={1.7} color="#7fe3ff" />
    </>
  );
}

/* ---------- first-visit light trail ---------- */

const TRAIL_START = 1.1;
const TRAIL_STEP = 0.6;
const TRAIL_DWELL = 0.18;
const TRAIL_MOVE = TRAIL_STEP - TRAIL_DWELL;
const TRAIL_FADE = 0.5;

/** Remembered so the tour only plays for a visitor who has never seen it. */
const TRAIL_KEY = "studio:trail-seen";

function hasSeenTrail() {
  try {
    return window.localStorage.getItem(TRAIL_KEY) === "1";
  } catch {
    // Storage can be blocked (private mode, hardened browsers): show it anyway.
    return false;
  }
}

function rememberTrail() {
  try {
    window.localStorage.setItem(TRAIL_KEY, "1");
  } catch {
    // Nothing to do; the visitor simply sees the tour again next time.
  }
}

/** A single cool firefly drifts from object to object once, then disappears. */
function DiscoveryTrail() {
  const light = useRef<THREE.PointLight>(null);
  const orb = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const [state, setState] = useState<"checking" | "playing" | "done">("checking");
  const started = useRef<number | null>(null);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const next = useMemo(() => new THREE.Vector3(), []);

  const spots = useMemo(
    () =>
      TRAIL_ORDER.map((key) => {
        const [x, y, z] = SPOT_LOOK[key]!;
        return new THREE.Vector3(x, y, z + 0.12);
      }),
    []
  );

  // Only the first visit gets the tour; afterwards the room is left to speak
  // for itself.
  useEffect(() => {
    setState(hasSeenTrail() ? "done" : "playing");
  }, []);

  useFrame(({ clock }) => {
    if (state !== "playing") return;
    const now = clock.elapsedTime;
    if (started.current === null) started.current = now;
    const elapsed = now - started.current - TRAIL_START;
    if (elapsed < 0) {
      if (light.current) light.current.intensity = 0;
      if (orb.current) orb.current.visible = false;
      if (halo.current) halo.current.visible = false;
      return;
    }

    const total = spots.length * TRAIL_STEP + TRAIL_FADE;
    if (elapsed >= total) {
      rememberTrail();
      setState("done");
      return;
    }

    const index = Math.min(Math.floor(elapsed / TRAIL_STEP), spots.length - 1);
    const within = elapsed - index * TRAIL_STEP;
    pos.copy(spots[index]!);
    if (within > TRAIL_DWELL && index < spots.length - 1) {
      next.copy(spots[index + 1]!);
      pos.lerp(next, smooth((within - TRAIL_DWELL) / TRAIL_MOVE));
    }

    const strength = smooth(elapsed / 0.35) * (1 - smooth((elapsed - (total - TRAIL_FADE)) / TRAIL_FADE));
    const pulse = 1 + Math.sin(now * 5) * 0.12;

    if (light.current) {
      light.current.position.copy(pos);
      light.current.intensity = 2 * strength;
    }
    if (orb.current) {
      orb.current.visible = strength > 0.01;
      orb.current.position.copy(pos);
      orb.current.scale.setScalar(pulse);
    }
    if (halo.current) {
      halo.current.visible = strength > 0.01;
      halo.current.position.copy(pos);
      halo.current.scale.setScalar(pulse);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.16 * strength;
    }
  });

  if (state !== "playing") return null;

  return (
    <>
      <pointLight ref={light} color="#7fe3ff" intensity={0} distance={1.3} decay={2} />
      <mesh ref={orb} visible={false}>
        <sphereGeometry args={[0.014, 10, 10]} />
        <meshBasicMaterial color="#e8fbff" toneMapped={false} transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <mesh ref={halo} visible={false}>
        <sphereGeometry args={[0.045, 14, 14]} />
        <meshBasicMaterial color="#7fe3ff" toneMapped={false} transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

/* ---------- wall clock (Sindhuli time) ---------- */

/** Where the clock hangs; the character looks here on the quarter hours. */
export const CLOCK_POSITION: [number, number, number] = [0.05, 2.12, -0.735];

function Hand({ handRef, length, width, color }: { handRef: React.RefObject<THREE.Group | null>; length: number; width: number; color: string }) {
  return (
    <group ref={handRef}>
      <mesh position={[0, length / 2 - 0.015, 0]}>
        <boxGeometry args={[width, length, 0.004]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    </group>
  );
}

function WallClock() {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const second = useRef<THREE.Group>(null);
  useFrame(() => {
    const { hours, minutes, seconds } = nepalClock(Date.now());
    // Hands turn clockwise as seen from the room: negative z rotation.
    if (second.current) second.current.rotation.z = -(seconds / 60) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -((minutes + seconds / 60) / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(((hours % 12) + minutes / 60) / 12) * Math.PI * 2;
  });
  return (
    <group position={CLOCK_POSITION}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.03, 48]} />
        <meshStandardMaterial color="#20242e" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <circleGeometry args={[0.152, 48]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.6} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const major = i % 3 === 0;
        return (
          <mesh key={i} position={[Math.sin(a) * 0.128, Math.cos(a) * 0.128, 0.018]} rotation={[0, 0, -a]}>
            <boxGeometry args={[major ? 0.012 : 0.006, major ? 0.03 : 0.018, 0.002]} />
            <meshStandardMaterial color="#1c2130" />
          </mesh>
        );
      })}
      <group position={[0, 0, 0.02]}>
        <Hand handRef={hour} length={0.08} width={0.011} color="#1c2130" />
      </group>
      <group position={[0, 0, 0.023]}>
        <Hand handRef={minute} length={0.12} width={0.007} color="#1c2130" />
      </group>
      <group position={[0, 0, 0.026]}>
        <Hand handRef={second} length={0.13} width={0.003} color="#e2572b" />
      </group>
      <mesh position={[0, 0, 0.029]}>
        <circleGeometry args={[0.009, 16]} />
        <meshStandardMaterial color="#e2572b" />
      </mesh>
    </group>
  );
}

/* ---------- live weather in the window ---------- */

const WINDOW_CENTER: [number, number, number] = [-1.25, 1.55, -0.737];
const WINDOW_HALF = { x: 0.46, y: 0.41 };

/** Sindhuli's real weather, drawn between the sky and the window frame. */
function WindowWeather({ kind, reduced }: { kind: WeatherKind; reduced: boolean }) {
  const wet = kind === "rain" || kind === "storm";
  const count = kind === "snow" ? 60 : wet ? 90 : 0;
  const drops = useRef<THREE.LineSegments>(null);
  const flakes = useRef<THREE.Points>(null);
  const flash = useRef<THREE.MeshBasicMaterial>(null);
  const bolt = useRef<THREE.PointLight>(null);
  const seeds = useMemo(
    () => Array.from({ length: count }, () => ({ x: (Math.random() * 2 - 1) * WINDOW_HALF.x, y: Math.random() * 2 - 1, speed: 0.7 + Math.random() * 0.6 })),
    [count]
  );
  const lineGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    return g;
  }, [count]);
  const pointGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);

  useFrame(({ clock }, delta) => {
    const step = reduced ? 0 : delta;
    if (wet && drops.current) {
      const p = lineGeometry.attributes.position as THREE.BufferAttribute;
      seeds.forEach((s, i) => {
        s.y -= step * s.speed * 1.6;
        if (s.y < -1) s.y += 2;
        const y = s.y * WINDOW_HALF.y;
        p.setXYZ(i * 2, s.x, y, 0);
        p.setXYZ(i * 2 + 1, s.x - 0.008, Math.max(-WINDOW_HALF.y, y - 0.06), 0);
      });
      p.needsUpdate = true;
    }
    if (kind === "snow" && flakes.current) {
      const p = pointGeometry.attributes.position as THREE.BufferAttribute;
      seeds.forEach((s, i) => {
        s.y -= step * s.speed * 0.18;
        if (s.y < -1) s.y += 2;
        const x = THREE.MathUtils.clamp(s.x + Math.sin(clock.elapsedTime + i) * 0.02, -WINDOW_HALF.x, WINDOW_HALF.x);
        p.setXYZ(i, x, s.y * WINDOW_HALF.y, 0);
      });
      p.needsUpdate = true;
    }
    // Lightning: a bright double pulse every several seconds.
    if (kind === "storm" && flash.current && !reduced) {
      const cycle = clock.elapsedTime % 7;
      const lit = cycle < 0.08 || (cycle > 0.16 && cycle < 0.22);
      flash.current.opacity = lit ? 0.55 : 0;
      // The lightning lights the room too, not just the glass.
      if (bolt.current) bolt.current.intensity = lit ? 9 : 0;
    }
  });

  const haze = kind === "fog" ? 0.55 : kind === "cloudy" ? 0.28 : wet ? 0.35 : kind === "snow" ? 0.2 : 0;
  return (
    <group position={WINDOW_CENTER}>
      {haze > 0 && (
        <mesh>
          <planeGeometry args={[WINDOW_HALF.x * 2, WINDOW_HALF.y * 2]} />
          <meshBasicMaterial color={kind === "fog" ? "#c9d3df" : "#6b7688"} transparent opacity={haze} depthWrite={false} />
        </mesh>
      )}
      {wet && (
        <lineSegments ref={drops} geometry={lineGeometry} position={[0, 0, 0.002]}>
          <lineBasicMaterial color="#bcd4ee" transparent opacity={0.6} />
        </lineSegments>
      )}
      {kind === "snow" && (
        <points ref={flakes} geometry={pointGeometry} position={[0, 0, 0.002]}>
          <pointsMaterial color="#ffffff" size={0.012} sizeAttenuation />
        </points>
      )}
      {kind === "storm" && <pointLight ref={bolt} position={[0.3, 0, 0.8]} intensity={0} distance={5} color="#dfe8ff" />}
      {kind === "storm" && (
        <mesh position={[0, 0, 0.003]}>
          <planeGeometry args={[WINDOW_HALF.x * 2, WINDOW_HALF.y * 2]} />
          <meshBasicMaterial ref={flash} color="#eef4ff" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/* ---------- camera ---------- */

/**
 * Where the camera glides when an object is clicked, before the room morphs
 * into that page. Phone and notebook are approached from above and to the
 * left so the camera never passes through the character.
 */
const DIVES: Record<string, { position: THREE.Vector3; look: THREE.Vector3 }> = {
  projects: { position: CAMERA_DIVE, look: SCREEN_CENTER },
  about: { position: new THREE.Vector3(1.05, 1.85, 0.05), look: new THREE.Vector3(0.95, 1.85, -0.735) },
  skills: { position: new THREE.Vector3(1.9, 1.25, 0.55), look: new THREE.Vector3(1.75, 0.95, -0.55) },
  contact: { position: new THREE.Vector3(-0.75, 1.3, 0.65), look: new THREE.Vector3(-0.45, 0.77, 0.18) },
  resume: { position: new THREE.Vector3(-0.8, 1.35, 0.4), look: new THREE.Vector3(-0.5, 0.77, -0.05) },
  // Window → experience: step up to the glass and look out at the hills.
  experience: { position: new THREE.Vector3(-1.2, 1.55, 0.15), look: new THREE.Vector3(-1.25, 1.55, -0.74) },
  // Desk lamp → services.
  services: { position: new THREE.Vector3(-0.85, 1.45, 0.45), look: new THREE.Vector3(-0.55, 1.15, -0.2) },
};

function CameraRig({
  leaving,
  reduced,
  focus,
}: {
  leaving: string | null;
  reduced: boolean;
  /** Bibash's head, while he is out of the chair: the camera goes with him. */
  focus: React.RefObject<THREE.Vector3 | null>;
}) {
  const { camera, size, pointer } = useThree();
  const look = useRef(CAMERA_LOOK.clone());
  const home = useMemo(() => new THREE.Vector3(), []);
  const goal = useMemo(() => new THREE.Vector3(), []);
  const lookGoal = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    // Portrait screens need to stand further back to fit the desk.
    const aspect = size.width / Math.max(size.height, 1);
    const pull = aspect < 1 ? 1.75 : aspect < 1.4 ? 1.25 : 1;
    home.copy(CAMERA_HOME).sub(CAMERA_LOOK).multiplyScalar(pull).add(CAMERA_LOOK);

    if (leaving) {
      const dive = DIVES[leaving] ?? DIVES.projects!;
      goal.copy(dive.position);
      lookGoal.copy(dive.look);
    } else if (focus.current) {
      // Follow Bibash around the room, keeping a comfortable distance.
      goal.copy(home).lerp(new THREE.Vector3(focus.current.x + 2.6, 1.55, focus.current.z + 2.6), 0.55);
      lookGoal.copy(focus.current);
    } else {
      goal.copy(home);
      if (!reduced) goal.add(new THREE.Vector3(pointer.x * 0.25, pointer.y * 0.12, -pointer.x * 0.2));
      lookGoal.copy(CAMERA_LOOK);
    }
    const k = 1 - Math.exp(-delta * (leaving ? 4.2 : 2.2));
    if (reduced && !leaving) {
      camera.position.copy(goal);
      look.current.copy(lookGoal);
    } else {
      camera.position.lerp(goal, k);
      look.current.lerp(lookGoal, k);
    }
    camera.lookAt(look.current);
  });
  return null;
}

export default function StudioScene(props: StudioSceneProps) {
  const {
    phase,
    musicBpm,
    sipCount,
    coffeeLevel,
    asking,
    leaving,
    terminalText,
    reduced,
    onTarget,
    weather,
    gitLog,
    media = null,
    away = false,
    commute = null,
    roamToken = 0,
    sleeping = false,
    onDoor,
    onSeated,
  } = props;
  const weatherKind = weather?.kind ?? null;
  // Start sharp; drop resolution (and the soft shadows) if the device struggles.
  const [quality, setQuality] = useState<"high" | "low">("high");
  const mugRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef<string | null>(null);
  const lookRef = useRef<[number, number, number] | null>(null);
  /** Bibash's head, updated every frame: the camera follows him while walking. */
  const focusRef = useRef<THREE.Vector3 | null>(null);
  const hoverApi = useMemo<HoverApi>(
    () => ({
      set: (spot: string) => {
        hoveredRef.current = spot;
        lookRef.current = SPOT_LOOK[spot] ?? null;
      },
      clear: (spot: string) => {
        if (hoveredRef.current !== spot) return;
        hoveredRef.current = null;
        lookRef.current = null;
      },
    }),
    []
  );
  // Bad weather outside makes the room moodier: a greyer backdrop and fog
  // that closes in, thickest on a foggy day.
  const gloomy = weatherKind === "rain" || weatherKind === "storm" || weatherKind === "fog" || weatherKind === "snow";
  const bg = phase === "night" ? (gloomy ? "#06080f" : "#070a14") : gloomy ? "#141a26" : "#0d1222";
  const fog: [number, number] = weatherKind === "fog" ? [2.4, 6.5] : gloomy ? [3.6, 8] : [4.5, 9];

  return (
    <Canvas
      camera={{ position: CAMERA_HOME.toArray(), fov: 40, near: 0.05, far: 30 }}
      dpr={quality === "high" ? [1, 1.75] : 1}
      shadows={quality === "high"}
      gl={{ antialias: quality === "high", powerPreference: "high-performance", toneMappingExposure: 1.06 }}
      onPointerMissed={() => {
        document.body.style.cursor = "";
        hoveredRef.current = null;
        lookRef.current = null;
      }}
    >
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, fog[0], fog[1]]} />
      <PerformanceMonitor onDecline={() => setQuality("low")} onIncline={() => setQuality("high")} flipflops={2} onFallback={() => setQuality("low")} />
      <HoverContext.Provider value={hoverApi}>
        <StudioEnvironment warm={phase === "night" || phase === "evening"} />
        <ShadowSetup />
        <Room phase={phase} quality={quality} weather={weather} onTarget={onTarget} />
        <Monitor
          typing={!asking && !leaving && !sleeping}
          terminalText={terminalText}
          leaving={leaving}
          liveSnippet={gitLog}
          media={media}
          away={away}
          onSelect={() => onTarget({ kind: "media" })}
        />
        <Hotspot spot="coffee" label={coffeeLevel > 0 ? "Take a sip ☕" : "Refill ☕"} labelAt={[0.42, 1.0, 0.22]} onSelect={() => onTarget({ kind: "coffee" })}>
          <Mug mugRef={mugRef} level={coffeeLevel} />
        </Hotspot>
        <Character
          musicBpm={musicBpm}
          sipCount={sipCount}
          asking={asking}
          mugRef={mugRef}
          lookRef={lookRef}
          sleeping={sleeping}
          away={away}
          commute={commute}
          roamToken={roamToken}
          onWalk={() => onTarget({ kind: "character" })}
          focusRef={focusRef}
          onDoor={onDoor}
          onSeated={onSeated}
        />
        <Hotspot spot="clock" label="Wall clock ↗" labelAt={[0.12, 2.5, -0.7]} onSelect={() => onTarget({ kind: "clock" })}>
          <WallClock />
        </Hotspot>
        {sleeping && !asking && (
          <Html position={[0.12, 1.38, 0.42]} center style={{ pointerEvents: "none" }} zIndexRange={[5, 0]}>
            <span className="studio__zzz" aria-hidden="true">
              z<span>z</span>
              <span>z</span>
            </span>
          </Html>
        )}
        {!reduced && !leaving && <DiscoveryTrail />}
        {weatherKind && weatherKind !== "clear" && <WindowWeather kind={weatherKind} reduced={reduced} />}
        {quality === "high" && (
          <ContactShadows position={[0, 0.006, 0.3]} scale={4.5} blur={2.2} far={1.8} opacity={0.55} resolution={256} color="#000000" />
        )}
        <CameraRig leaving={leaving} reduced={reduced} focus={focusRef} />
        {quality === "high" && <PostFX />}
      </HoverContext.Provider>
    </Canvas>
  );
}
