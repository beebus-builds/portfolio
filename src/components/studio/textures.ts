/**
 * Procedural material maps for the studio.
 *
 * The room has no downloaded assets: every surface is painted into an
 * offscreen canvas once and cached, then handed to three as a texture. Colour
 * maps are sRGB; the grayscale maps (roughness, bump) stay linear so the light
 * responds to them correctly.
 */

import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();

/** Deterministic noise, so the room looks the same on every visit. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function sheet(width: number, height = width) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

function finish(
  canvas: HTMLCanvasElement,
  { repeat = [1, 1], srgb = true }: { repeat?: [number, number]; srgb?: boolean } = {}
) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 8;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function memo(key: string, make: () => THREE.Texture) {
  const hit = cache.get(key);
  if (hit) return hit;
  const made = make();
  cache.set(key, made);
  return made;
}

/* ---------- floorboards ---------- */

/** Warm oak boards, staggered joints, grain and a worn sheen. */
export function floorTexture(repeat: [number, number] = [2.4, 2]) {
  return memo(`floor:${repeat.join("x")}`, () => {
    const size = 512;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(7);
    const planks = 4;
    const plankHeight = size / planks;
    const tones = ["#6f4f36", "#65462f", "#7a5739", "#5f4229"];

    for (let row = 0; row < planks; row++) {
      const y = row * plankHeight;
      ctx.fillStyle = tones[row % tones.length]!;
      ctx.fillRect(0, y, size, plankHeight);

      // Grain: long, slightly wavy lines following the board.
      for (let line = 0; line < 26; line++) {
        const base = y + (line / 26) * plankHeight + rand() * 3;
        ctx.beginPath();
        ctx.moveTo(0, base);
        for (let x = 0; x <= size; x += 16) {
          ctx.lineTo(x, base + Math.sin(x / 42 + row * 2 + line) * 1.6 + (rand() - 0.5) * 0.8);
        }
        ctx.strokeStyle = `rgba(38, 24, 14, ${0.05 + rand() * 0.12})`;
        ctx.lineWidth = 0.6 + rand() * 1.4;
        ctx.stroke();
      }

      // A few darker knots.
      for (let knot = 0; knot < 2; knot++) {
        const kx = rand() * size;
        const ky = y + plankHeight * (0.25 + rand() * 0.5);
        const radius = 2 + rand() * 5;
        const gradient = ctx.createRadialGradient(kx, ky, 0, kx, ky, radius);
        gradient.addColorStop(0, "rgba(30, 18, 10, 0.5)");
        gradient.addColorStop(1, "rgba(30, 18, 10, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(kx, ky, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Board seam and a soft highlight along the top edge.
      ctx.fillStyle = "rgba(20, 12, 6, 0.55)";
      ctx.fillRect(0, y, size, 2);
      ctx.fillStyle = "rgba(255, 226, 190, 0.06)";
      ctx.fillRect(0, y + 2, size, 1.5);

      // Staggered end joints.
      const joints = row % 2 === 0 ? [0.34, 0.78] : [0.16, 0.6];
      for (const at of joints) {
        ctx.fillStyle = "rgba(20, 12, 6, 0.45)";
        ctx.fillRect(at * size, y, 2, plankHeight);
      }
    }

    return finish(canvas, { repeat });
  });
}

/** The same boards as a roughness map: worn paths are smoother, seams rougher. */
export function floorRoughness(repeat: [number, number] = [2.4, 2]) {
  return memo(`floor-rough:${repeat.join("x")}`, () => {
    const size = 256;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(11);
    ctx.fillStyle = "#c9c9c9";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const value = 150 + Math.floor(rand() * 70);
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.fillRect(rand() * size, rand() * size, 2 + rand() * 8, 1 + rand() * 3);
    }
    for (let row = 0; row <= 4; row++) {
      ctx.fillStyle = "#8f8f8f";
      ctx.fillRect(0, (row / 4) * size - 1, size, 3);
    }
    return finish(canvas, { repeat, srgb: false });
  });
}

/* ---------- desk ---------- */

/** Walnut desktop: tighter grain than the floor, a satin finish. */
export function deskTexture() {
  return memo("desk", () => {
    const { canvas, ctx } = sheet(512, 256);
    const rand = seeded(23);
    ctx.fillStyle = "#8a6243";
    ctx.fillRect(0, 0, 512, 256);
    for (let line = 0; line < 90; line++) {
      const y = rand() * 256;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 12) ctx.lineTo(x, y + Math.sin(x / 30 + line) * 2.4);
      ctx.strokeStyle = `rgba(74, 45, 26, ${0.06 + rand() * 0.16})`;
      ctx.lineWidth = 0.5 + rand() * 1.6;
      ctx.stroke();
    }
    // Sheen sweeping across the varnish.
    const sheen = ctx.createLinearGradient(0, 0, 512, 256);
    sheen.addColorStop(0, "rgba(255, 236, 208, 0.1)");
    sheen.addColorStop(0.45, "rgba(255, 236, 208, 0)");
    sheen.addColorStop(1, "rgba(255, 236, 208, 0.07)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 512, 256);
    return finish(canvas, { repeat: [1, 1] });
  });
}

/* ---------- walls ---------- */

/**
 * Nearly white plaster, tinted by the material's colour. Keeps the phase of
 * the day in charge of the wall colour while still catching the light.
 */
export function plasterTexture() {
  return memo("plaster", () => {
    const size = 256;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(31);
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2600; i++) {
      const value = 218 + Math.floor(rand() * 34);
      ctx.fillStyle = `rgba(${value},${value},${value},0.5)`;
      const r = 0.6 + rand() * 2.4;
      ctx.beginPath();
      ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return finish(canvas, { repeat: [3, 2] });
  });
}

/** Fine grain for the plaster, used as a bump map. */
export function plasterBump() {
  return memo("plaster-bump", () => {
    const size = 256;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(37);
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 4200; i++) {
      const value = 96 + Math.floor(rand() * 64);
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.fillRect(rand() * size, rand() * size, 1.5, 1.5);
    }
    return finish(canvas, { repeat: [3, 2], srgb: false });
  });
}

/* ---------- rug ---------- */

/** A woven rug: concentric bands of indigo and rust. */
export function rugTexture() {
  return memo("rug", () => {
    const size = 512;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(41);
    ctx.fillStyle = "#26314e";
    ctx.fillRect(0, 0, size, size);
    const palette = ["#26314e", "#33416a", "#4a5f8f", "#8a4b3b", "#33416a"];
    for (let ring = 0; ring < 26; ring++) {
      const radius = (ring / 26) * (size * 0.72);
      ctx.strokeStyle = palette[ring % palette.length]!;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Weave: short crosshatched fibres over the whole face.
    for (let i = 0; i < 5200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
      ctx.fillRect(x, y, 3, 1.5);
    }
    return finish(canvas, { repeat: [1, 1] });
  });
}

/* ---------- fabrics ---------- */

/** Knitted cotton bump for the hoodie and the chair. */
export function fabricBump() {
  return memo("fabric-bump", () => {
    const size = 256;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(53);
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) {
      for (let x = 0; x < size; x += 4) {
        const value = 110 + Math.floor(rand() * 60);
        ctx.fillStyle = `rgb(${value},${value},${value})`;
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return finish(canvas, { repeat: [4, 4], srgb: false });
  });
}

/** Lined paper for the notebook. */
export function paperTexture() {
  return memo("paper", () => {
    const { canvas, ctx } = sheet(256, 320);
    ctx.fillStyle = "#f8f4ea";
    ctx.fillRect(0, 0, 256, 320);
    ctx.strokeStyle = "rgba(70, 90, 130, 0.28)";
    ctx.lineWidth = 1;
    for (let y = 40; y < 320; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(200, 80, 70, 0.35)";
    ctx.beginPath();
    ctx.moveTo(34, 0);
    ctx.lineTo(34, 320);
    ctx.stroke();
    // A little handwriting so it reads as used, not a prop.
    ctx.strokeStyle = "rgba(40, 50, 70, 0.5)";
    ctx.lineWidth = 1.4;
    const rand = seeded(61);
    for (let line = 0; line < 9; line++) {
      let x = 42;
      const y = 40 + line * 22;
      while (x < 210) {
        const word = 8 + rand() * 26;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + word / 2, y - 3 - rand() * 3, x + word, y);
        ctx.stroke();
        x += word + 6;
      }
    }
    return finish(canvas, { repeat: [1, 1] });
  });
}

/* ---------- soft sprites ---------- */

/** A soft white disc, for steam and other particles that should never read as geometry. */
export function softDisc() {
  return memo("soft-disc", () => {
    const size = 128;
    const { canvas, ctx } = sheet(size);
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.42)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  });
}

/* ---------- metal ---------- */

/** Brushed aluminium for the monitor stand and desk legs. */
export function brushedMetal() {
  return memo("brushed", () => {
    const size = 256;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(67);
    ctx.fillStyle = "#9aa0aa";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 2400; i++) {
      const value = 120 + Math.floor(rand() * 90);
      ctx.fillStyle = `rgba(${value},${value},${value + 4},0.4)`;
      ctx.fillRect(0, rand() * size, size, 0.6 + rand());
    }
    return finish(canvas, { repeat: [2, 2] });
  });
}

/** Roughness companion for the brushed metal. */
export function brushedMetalRoughness() {
  return memo("brushed-rough", () => {
    const size = 256;
    const { canvas, ctx } = sheet(size);
    const rand = seeded(71);
    ctx.fillStyle = "#6a6a6a";
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1800; i++) {
      const value = 70 + Math.floor(rand() * 80);
      ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.fillRect(0, rand() * size, size, 0.8 + rand() * 1.4);
    }
    return finish(canvas, { repeat: [2, 2], srgb: false });
  });
}
