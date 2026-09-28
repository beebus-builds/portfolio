import * as THREE from "three";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothNoise(rand: () => number, size: number) {
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i += 1) grid[i] = rand();
  const sample = (x: number, y: number) => grid[((y % size) + size) % size * size + (((x % size) + size) % size)];
  return (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = x - x0;
    const ty = y - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const n00 = sample(x0, y0);
    const n10 = sample(x0 + 1, y0);
    const n01 = sample(x0, y0 + 1);
    const n11 = sample(x0 + 1, y0 + 1);
    return (n00 * (1 - sx) + n10 * sx) * (1 - sy) + (n01 * (1 - sx) + n11 * sx) * sy;
  };
}

function fractal(noise: (x: number, y: number) => number, x: number, y: number, octaves = 4) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i += 1) {
    value += noise(x * frequency, y * frequency) * amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

export type PlanetStyle = "ocean" | "bands" | "rocky" | "gaseous" | "crystalline";

/** Equirectangular surface map, drawn once per planet into an offscreen canvas. */
export function createPlanetTexture(
  color: string,
  bandColor: string,
  seed: number,
  style: PlanetStyle
): THREE.Texture {
  const width = 768;
  const height = 384;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");

  const rand = mulberry32(seed);
  const noise = smoothNoise(rand, 64);
  const image = ctx.createImageData(width, height);
  const base = new THREE.Color(color);
  const band = new THREE.Color(bandColor);
  const highlight = base.clone().lerp(new THREE.Color("#ffffff"), 0.45);
  const shadow = band.clone().lerp(new THREE.Color("#000000"), 0.55);
  const tmp = new THREE.Color();

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      let mixAmount: number;

      if (style === "bands" || style === "gaseous") {
        const warp = fractal(noise, u * 6, v * 22, 3) - 0.5;
        const stripes = Math.sin((v + warp * 0.12) * Math.PI * 14) * 0.5 + 0.5;
        const turbulence = fractal(noise, u * 9 + 3, v * 16, 4);
        mixAmount = Math.max(0, Math.min(1, stripes * 0.65 + turbulence * 0.6 - 0.15));
      } else if (style === "ocean") {
        const land = fractal(noise, u * 5, v * 5, 5);
        const detail = fractal(noise, u * 16 + 11, v * 16 + 7, 3);
        mixAmount = land * 0.8 + detail * 0.3 - 0.42;
        mixAmount = Math.max(0, Math.min(1, mixAmount * 2.4));
      } else if (style === "crystalline") {
        const cracks = Math.abs(fractal(noise, u * 8, v * 8, 4) - 0.5) * 2;
        mixAmount = Math.max(0, Math.min(1, 1 - cracks * 1.8));
      } else {
        const crater = fractal(noise, u * 7, v * 7, 5);
        const grit = fractal(noise, u * 30, v * 30, 2);
        mixAmount = Math.max(0, Math.min(1, crater * 0.9 + grit * 0.25 - 0.25));
      }

      tmp.copy(band).lerp(base, mixAmount);
      if (mixAmount > 0.72) tmp.lerp(highlight, (mixAmount - 0.72) * 1.6);
      if (mixAmount < 0.18) tmp.lerp(shadow, (0.18 - mixAmount) * 1.8);

      const index = (y * width + x) * 4;
      image.data[index] = Math.round(tmp.r * 255);
      image.data[index + 1] = Math.round(tmp.g * 255);
      image.data[index + 2] = Math.round(tmp.b * 255);
      image.data[index + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Soft white cloud shell with alpha holes. */
export function createCloudTexture(seed: number): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size / 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");

  const rand = mulberry32(seed);
  const noise = smoothNoise(rand, 32);
  const image = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const value = fractal(noise, (x / canvas.width) * 7, (y / canvas.height) * 4, 5);
      const alpha = Math.max(0, Math.min(1, (value - 0.46) * 2.6)) * 255;
      const index = (y * canvas.width + x) * 4;
      image.data[index] = 255;
      image.data[index + 1] = 255;
      image.data[index + 2] = 255;
      image.data[index + 3] = alpha;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Radial falloff sprite used for stars, glows and dust. */
export function createGlowTexture(inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)"): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Ring system strip: bright banded annulus with a Cassini-style gap. */
export function createRingTexture(color: string): THREE.Texture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");

  const rand = mulberry32(9182);
  const base = new THREE.Color(color);
  for (let x = 0; x < size; x += 1) {
    const t = x / size;
    const inner = Math.min(1, Math.max(0, (t - 0.06) / 0.06));
    const outer = Math.min(1, Math.max(0, (0.98 - t) / 0.08));
    const gap = t > 0.52 && t < 0.6 ? 0.12 : 1;
    const grain = 0.65 + rand() * 0.35;
    const density = inner * outer * gap * grain;
    const shade = base.clone().lerp(new THREE.Color("#ffffff"), 0.25 + grain * 0.2);
    ctx.fillStyle = `rgba(${Math.round(shade.r * 255)},${Math.round(shade.g * 255)},${Math.round(shade.b * 255)},${density.toFixed(3)})`;
    ctx.fillRect(x, 0, 1, 4);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}
