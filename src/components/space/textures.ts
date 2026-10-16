import * as THREE from "three";

export function mulberry32(seed: number) {
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

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

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

/**
 * Bump field derived from a real colour map, packed as a tangent-space normal
 * map. Real planetary maps carry no normal channel, so relief is recovered
 * from luminance: craters, ridge lines and pressure bands all show up as light
 * and dark edges, which is exactly what a height field looks like.
 */
export function createBumpNormalMap(source: THREE.Texture, strength = 2.4): THREE.Texture | null {
  const image = source.image as
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | undefined;
  if (!image || typeof image.width !== "number" || image.width === 0) return null;

  // Half resolution is plenty for relief and keeps the derivation cheap.
  const width = Math.max(2, Math.min(1024, Math.round(image.width / 2)));
  const height = Math.max(2, Math.round(width / 2));
  const { ctx } = makeCanvas(width, height);
  ctx.drawImage(image as CanvasImageSource, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;

  const luminance = new Float32Array(width * height);
  for (let i = 0; i < luminance.length; i += 1) {
    const offset = i * 4;
    luminance[i] =
      (0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2]) / 255;
  }

  const normalCanvas = heightToNormal(luminance, width, height, strength);
  const texture = new THREE.CanvasTexture(normalCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
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

const HULL_RESOLUTION = 768;

export type HullMaps = {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
};

type Plate = { x: number; y: number; w: number; h: number; tone: number; drift: number };

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");
  return { canvas, ctx };
}

/**
 * Guillotine subdivision of the whole tile into nested plates. Real airframes
 * are plated as a few big fairings chopped by a scatter of access panels, so a
 * recursive split reads far better than the uniform grid most fake hulls use.
 */
function dividePlates(rand: () => number, size: number, minimum: number): Plate[] {
  const plates: Plate[] = [{ x: 0, y: 0, w: size, h: size, tone: rand(), drift: rand() }];
  const splittable = (plate: Plate) => plate.w >= minimum * 2 || plate.h >= minimum * 2;

  for (let pass = 0; pass < 900; pass += 1) {
    let target = -1;
    for (let attempt = 0; attempt < 14; attempt += 1) {
      const index = Math.floor(rand() * plates.length);
      if (splittable(plates[index])) {
        target = index;
        break;
      }
    }
    if (target === -1) break;

    const plate = plates[target];
    const head: Plate = { ...plate, tone: rand(), drift: rand() };
    const tail: Plate = { ...plate, tone: rand(), drift: rand() };
    // Bias the split toward the long axis so panels stay plausible shapes.
    const vertical = plate.w >= minimum * 2 && (plate.h < minimum * 2 || rand() < plate.w / (plate.w + plate.h));
    const ratio = 0.32 + rand() * 0.36;

    if (vertical) {
      const cut = Math.max(1, Math.round(plate.w * ratio));
      head.w = cut;
      tail.x = plate.x + cut;
      tail.w = plate.w - cut;
    } else {
      const cut = Math.max(1, Math.round(plate.h * ratio));
      head.h = cut;
      tail.y = plate.y + cut;
      tail.h = plate.h - cut;
    }
    plates.splice(target, 1, head, tail);
  }
  return plates;
}

/** Sobel the height field into a tangent-space normal map. */
function heightToNormal(height: Float32Array, cols: number, rows: number, strength: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(cols, rows);
  const image = ctx.createImageData(cols, rows);
  const wrapX = (value: number) => ((value % cols) + cols) % cols;
  const wrapY = (value: number) => ((value % rows) + rows) % rows;
  const at = (x: number, y: number) => height[wrapY(y) * cols + wrapX(x)];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      // Canvas rows run downward while v runs upward, so the green channel is
      // the negated vertical slope.
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));
      const nx = dx * strength;
      const ny = -dy * strength;
      const inv = 1 / Math.hypot(nx, ny, 1);
      const index = (y * cols + x) * 4;
      image.data[index] = Math.round((nx * inv * 0.5 + 0.5) * 255);
      image.data[index + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
      image.data[index + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/**
 * Painted airframe skin: per-panel paint batches, recessed seams, rivet rows,
 * rivulet grime aft of every joint, scorch near the engines, plus the matching
 * normal and roughness maps so each seam actually catches the key light.
 */
export function createHullMaps(seed: number, palette: string[], grime = 1): HullMaps {
  const size = HULL_RESOLUTION;
  const { canvas, ctx } = makeCanvas(size, size);
  const rand = mulberry32(seed);
  const noise = smoothNoise(mulberry32(seed * 7 + 13), 64);

  const albedo = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const rough = new Float32Array(size * size);
  const seamMask = new Float32Array(size * size);
  const grimeMask = new Float32Array(size * size);
  const scorchMask = new Float32Array(size * size);

  const wrap = (value: number) => ((value % size) + size) % size;

  // One shared grain field: fine mill finish plus slow panel-scale mottling.
  const grain = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / size) * 32;
      const v = (y / size) * 32;
      grain[y * size + x] = fractal(noise, u, v, 3) * 0.7 + fractal(noise, u * 4, v * 4, 2) * 0.3;
    }
  }

  // 1. Paint batches. Every plate is sprayed separately in the real world, so
  //    each gets its own tint and lightness. The layout is cut once and reused
  //    by the seam and rivet passes so the hardware lines up with the paint.
  //    Contrast stays low on purpose: at chase-camera distance a high-contrast
  //    plate grid minifies into a checkerboard rather than reading as skin.
  const plates = dividePlates(rand, size, 34);
  const colour = new THREE.Color();
  for (const plate of plates) {
    colour.set(palette[Math.floor(rand() * palette.length)]);
    colour.offsetHSL((plate.drift - 0.5) * 0.012, (plate.drift - 0.5) * 0.05, (plate.tone - 0.5) * 0.055);
    const red = colour.r * 255;
    const green = colour.g * 255;
    const blue = colour.b * 255;

    for (let y = plate.y; y < plate.y + plate.h; y += 1) {
      for (let x = plate.x; x < plate.x + plate.w; x += 1) {
        const index = wrap(y) * size + wrap(x);
        const shade = 1 + (grain[index] - 0.5) * 0.14;
        albedo.data[index * 4] = clamp(red * shade);
        albedo.data[index * 4 + 1] = clamp(green * shade);
        albedo.data[index * 4 + 2] = clamp(blue * shade);
        albedo.data[index * 4 + 3] = 255;
        rough[index] = 0.34 + (grain[index] - 0.5) * 0.16;
      }
    }
  }

  // 2. Seams and rivets. Seams are recessed and matte, rivets proud and
  //    slightly polished from being proud of the paint.
  const markSeam = (x: number, y: number) => {
    const index = wrap(y) * size + wrap(x);
    height[index] -= 1;
    seamMask[index] = 1;
  };
  const markRivet = (x: number, y: number, radius: number) => {
    for (let oy = -1; oy <= 1; oy += 1) {
      for (let ox = -1; ox <= 1; ox += 1) {
        const distance = Math.hypot(ox, oy);
        if (distance > radius) continue;
        const index = wrap(y + oy) * size + wrap(x + ox);
        height[index] += 0.85 * (1 - distance / (radius + 0.4));
        seamMask[index] = Math.max(seamMask[index], 0.35);
      }
    }
  };

  for (const plate of plates) {
    for (let i = 0; i < plate.w; i += 1) {
      markSeam(plate.x + i, plate.y);
      markSeam(plate.x + i, plate.y + plate.h - 1);
    }
    for (let i = 0; i < plate.h; i += 1) {
      markSeam(plate.x, plate.y + i);
      markSeam(plate.x + plate.w - 1, plate.y + i);
    }
  }
  for (const plate of plates) {
    const spacing = 16;
    for (let i = Math.floor(spacing / 2); i < plate.w; i += spacing) {
      markRivet(plate.x + i, plate.y + 1, 1);
      markRivet(plate.x + i, plate.y + plate.h - 2, 1);
    }
    for (let i = Math.floor(spacing / 2); i < plate.h; i += spacing) {
      markRivet(plate.x + 1, plate.y + i, 1);
      markRivet(plate.x + plate.w - 2, plate.y + i, 1);
    }
  }

  // 3. Rivulet grime. Rain of oil and fuel streaking aft of joints is what
  //    most reads as "flown" rather than "modelled".
  const streaks = Math.round(190 * grime);
  for (let s = 0; s < streaks; s += 1) {
    let x = rand() * size;
    const y0 = rand() * size;
    const length = 90 + rand() * 520;
    const width = 1.1 + rand() * 5;
    const strength = (0.05 + rand() * 0.24) * grime;
    for (let t = 0; t < length; t += 1) {
      const y = y0 + t;
      x += (rand() - 0.5) * 0.9;
      // Fade in as the streak starts and out as it dries toward the tail.
      const along = Math.min(1, t / 26) * (1 - (t / length) * 0.55);
      for (let o = -5; o <= 5; o += 1) {
        const spread = o / width;
        if (spread * spread > 1) continue;
        const index = wrap(Math.round(y)) * size + wrap(Math.round(x) + o);
        grimeMask[index] = Math.max(grimeMask[index], strength * along * (1 - spread * spread));
      }
    }
  }

  // 4. Scorch: heat discolouration blooming off the aft face.
  for (let s = 0; s < 7; s += 1) {
    const cx = rand() * size;
    const cy = rand() * size;
    const radius = 60 + rand() * 190;
    const strength = (0.12 + rand() * 0.3) * grime;
    for (let y = Math.round(cy - radius); y <= cy + radius; y += 1) {
      for (let x = Math.round(cx - radius); x <= cx + radius; x += 1) {
        const falloff = 1 - Math.hypot(x - cx, y - cy) / radius;
        if (falloff <= 0) continue;
        const index = wrap(y) * size + wrap(x);
        scorchMask[index] = Math.max(scorchMask[index], strength * falloff * falloff);
      }
    }
  }

  // 5. Composite the masks into albedo, roughness and height.
  for (let index = 0; index < size * size; index += 1) {
    const seam = seamMask[index];
    const dirt = grimeMask[index];
    const scorch = scorchMask[index];
    const speckle = (grain[index] - 0.5) * 0.07;

    const shade = 1 - seam * 0.2 - dirt * 0.5 - scorch * 0.4 + speckle;
    albedo.data[index * 4] = clamp(albedo.data[index * 4] * shade);
    albedo.data[index * 4 + 1] = clamp(albedo.data[index * 4 + 1] * shade * (1 - scorch * 0.12));
    albedo.data[index * 4 + 2] = clamp(albedo.data[index * 4 + 2] * shade);

    // Dirt and seams scatter; bare paint polishes where hands and covers go.
    const wear = Math.max(0, grain[index] - 0.62) * 0.5;
    rough[index] = Math.max(
      0.08,
      Math.min(1, rough[index] + seam * 0.34 + dirt * 0.24 + scorch * 0.18 + speckle * 1.4 - wear)
    );
    height[index] += (grain[index] - 0.5) * 0.22 - dirt * 0.35;
  }
  ctx.putImageData(albedo, 0, 0);

  const { canvas: roughCanvas, ctx: roughCtx } = makeCanvas(size, size);
  const roughImage = roughCtx.createImageData(size, size);
  for (let index = 0; index < size * size; index += 1) {
    const value = clamp(rough[index] * 255);
    roughImage.data[index * 4] = value;
    roughImage.data[index * 4 + 1] = value;
    roughImage.data[index * 4 + 2] = value;
    roughImage.data[index * 4 + 3] = 255;
  }
  roughCtx.putImageData(roughImage, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  const normalMap = new THREE.CanvasTexture(heightToNormal(height, size, size, 1.5));
  for (const texture of [map, roughnessMap, normalMap]) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
  }
  return { map, roughnessMap, normalMap };
}

/** Radiator panel face: header manifolds, coolant channels and thermal
 *  mottling. Coolant runs along the panel, so the pattern is banded. */
export function createRadiatorTexture(): THREE.Texture {
  const size = 512;
  const { canvas, ctx } = makeCanvas(size, size);
  const noise = smoothNoise(mulberry32(88), 32);
  const image = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const v = y / size;
      // Coolant channels run down the panel with a header manifold across it.
      const channel = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 30);
      const header = v < 0.05 || v > 0.95 ? 1 : 0;
      const mottle = fractal(noise, (u * size) / 64, (v * size) / 24, 3);
      const value = 12 + channel * 18 + header * 26 + mottle * 16;
      const index = (y * size + x) * 4;
      image.data[index] = clamp(value * 0.88);
      image.data[index + 1] = clamp(value * 0.96);
      image.data[index + 2] = clamp(value * 1.12);
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Rocket bell: clean alloy at the throat, carbon soot toward the exit. The
 * noise is deliberately anisotropic — high frequency around the bell, low
 * along it — so soot reads as streaks running with the flow instead of the
 * marbled blotches isotropic noise produces on a lathe.
 */
export function createNozzleTexture(): THREE.Texture {
  const width = 256;
  const height = 128;
  const { canvas, ctx } = makeCanvas(width, height);
  const noise = smoothNoise(mulberry32(31), 32);
  const image = ctx.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    // v = 0 is the throat, v = 1 the exit plane.
    const v = y / (height - 1);
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const soot = v ** 0.7;
      // Slow variation around the bell, faster along it: enough grain to stop
      // the metal reading as plastic, not so much that the lathe UVs moire.
      const grain = fractal(noise, u * 7, v * 5, 3);
      const streak = fractal(noise, u * 3, v * 16, 2);
      const value = 96 * (1 - soot) + 22 * soot + grain * 26 + streak * 16 * (0.3 + soot);
      const index = (y * width + x) * 4;
      image.data[index] = clamp(value * 1.03);
      image.data[index + 1] = clamp(value * 0.97);
      image.data[index + 2] = clamp(value * 0.93);
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

/** Diagonal caution striping for the rescue-path and hazard decals. */
export function createHazardTexture(): THREE.Texture {
  const size = 128;
  const { canvas, ctx } = makeCanvas(size, size);
  ctx.fillStyle = "#1b1b1c";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#e8b12a";
  ctx.lineWidth = 14;
  for (let offset = -size; offset < size * 2; offset += 30) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + size, size);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
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
