import * as THREE from "three";
import { mergeGeometries, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "./textures";

/**
 * Procedural airframe for the interceptor. Nothing is loaded from disk: the
 * hull is a lofted superellipse section, the flying surfaces are lofted NACA
 * profiles, the bells are de Laval contours, and every cover, pipe and thruster
 * is placed by parameterising the hull surface. Local axes are +Z forward,
 * +Y up, +X starboard, matching the flight simulation.
 */

/** One cross-section of the centre hull. `power` drives the superellipse. */
type Station = { z: number; hw: number; hh: number; power: number; dorsal: number };

/* Tail to nose, monotonic in z so the loft winds outward. `dorsal` raises a
   spine above the tube: nothing in front of the cockpit, a tall fairing aft. */
const HULL_STATIONS: Station[] = [
  { z: -4.95, hw: 0.800, hh: 0.575, power: 3.3, dorsal: 0.3 },
  { z: -4.20, hw: 0.860, hh: 0.640, power: 3.6, dorsal: 0.44 },
  { z: -3.10, hw: 0.935, hh: 0.715, power: 4.0, dorsal: 0.56 },
  { z: -1.80, hw: 1.000, hh: 0.735, power: 4.3, dorsal: 0.62 },
  { z: -0.40, hw: 1.020, hh: 0.700, power: 4.4, dorsal: 0.6 },
  { z: 0.30, hw: 0.995, hh: 0.660, power: 4.3, dorsal: 0.34 },
  { z: 0.90, hw: 0.965, hh: 0.640, power: 4.2, dorsal: 0.1 },
  { z: 1.60, hw: 0.900, hh: 0.580, power: 3.9, dorsal: 0.0 },
  { z: 2.10, hw: 0.840, hh: 0.545, power: 3.7, dorsal: 0.0 },
  { z: 3.20, hw: 0.640, hh: 0.430, power: 3.2, dorsal: 0.0 },
  { z: 4.10, hw: 0.400, hh: 0.300, power: 2.7, dorsal: 0.0 },
  { z: 4.85, hw: 0.185, hh: 0.155, power: 2.3, dorsal: 0.0 },
  { z: 5.30, hw: 0.030, hh: 0.030, power: 2.0, dorsal: 0.0 },
];

const HULL_RING = 44;

/** Superellipse point: `power` 2 is a smooth tube, 4+ a flat-sided section. */
function superellipse(t: number, hw: number, hh: number, power: number): [number, number] {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const e = 2 / power;
  return [hw * Math.sign(c) * Math.abs(c) ** e, hh * Math.sign(s) * Math.abs(s) ** e];
}

function hullProfileAt(z: number): Station {
  const first = HULL_STATIONS[0];
  const last = HULL_STATIONS[HULL_STATIONS.length - 1];
  if (z <= first.z) return first;
  if (z >= last.z) return last;
  for (let i = 0; i < HULL_STATIONS.length - 1; i += 1) {
    const a = HULL_STATIONS[i];
    const b = HULL_STATIONS[i + 1];
    if (z < a.z || z > b.z) continue;
    const t = (z - a.z) / (b.z - a.z);
    // Smoothstep between stations keeps the taper free of facet creases.
    const s = t * t * (3 - 2 * t);
    return {
      z,
      hw: a.hw + (b.hw - a.hw) * s,
      hh: a.hh + (b.hh - a.hh) * s,
      power: a.power + (b.power - a.power) * s,
      dorsal: a.dorsal + (b.dorsal - a.dorsal) * s,
    };
  }
  return first;
}

/** Deck height on the centreline at a given station. */
export function hullDeckY(z: number): number {
  const profile = hullProfileAt(z);
  return profile.hh + profile.dorsal;
}

/** Deck height out at a given half-span, so glasswork can follow the hull. */
function hullTopY(z: number, x: number): number {
  const profile = hullProfileAt(z);
  const ratio = Math.min(1, Math.abs(x) / profile.hw);
  const cos = ratio ** (profile.power / 2);
  const sin = Math.sqrt(Math.max(0, 1 - cos * cos));
  return profile.hh * sin ** (2 / profile.power) + profile.dorsal * sin * sin;
}

function hullPoint(z: number, t: number, out: THREE.Vector3): THREE.Vector3 {
  const profile = hullProfileAt(z);
  const [x, y] = superellipse(t, profile.hw, profile.hh, profile.power);
  const s = Math.sin(t);
  return out.set(x, y + profile.dorsal * Math.max(0, s) ** 2, z);
}

const scratchT = new THREE.Vector3();
const scratchZ = new THREE.Vector3();

/**
 * Position and outward normal on the hull skin, by central difference on the
 * loft parameters. Every greeble is mounted through this, so hardware sits
 * flush on the tapered surface instead of floating over it.
 */
export function hullSurface(z: number, t: number, point: THREE.Vector3, normal: THREE.Vector3): void {
  hullPoint(z, t, point);
  hullPoint(z, t + 0.02, scratchT).sub(point);
  hullPoint(z + 0.02, t, scratchZ).sub(point);
  normal.crossVectors(scratchT, scratchZ).normalize();
  if (normal.lengthSq() < 0.5) normal.set(point.x, point.y, 0).normalize();
  // Resolve the sign against the radial direction: robust at every station.
  if (normal.x * point.x + normal.y * point.y < 0) normal.negate();
}

type LoftOptions = {
  /** Reverse the ring traversal. Needed whenever the section winds the other
   *  way relative to the span direction, which is most of them. */
  flipRing?: boolean;
  capStart?: boolean;
  capEnd?: boolean;
  /** Texture repeats per world unit on each axis. */
  uScale?: number;
  vScale?: number;
};

/** Skin a stack of equal-length rings into an indexed surface. */
function loftRings(rings: Float32Array[], options: LoftOptions = {}): THREE.BufferGeometry {
  const { flipRing = false, capStart = false, capEnd = false, uScale = 1, vScale = 1 } = options;
  const ringCount = rings.length;
  const points = rings[0].length / 3;

  // Arc length between rings keeps texel density even across a hard taper.
  const lengths = [0];
  const mid = (points >> 1) * 3;
  for (let r = 1; r < ringCount; r += 1) {
    lengths[r] =
      lengths[r - 1] +
      Math.hypot(
        rings[r][mid] - rings[r - 1][mid],
        rings[r][mid + 1] - rings[r - 1][mid + 1],
        rings[r][mid + 2] - rings[r - 1][mid + 2]
      );
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const at = (p: number) => (flipRing ? points - 1 - p : p);

  for (let r = 0; r < ringCount; r += 1) {
    const ring = rings[r];
    for (let p = 0; p < points; p += 1) {
      const k = at(p) * 3;
      positions.push(ring[k], ring[k + 1], ring[k + 2]);
      uvs.push((p / points) * uScale, lengths[r] / vScale);
    }
  }
  for (let r = 0; r < ringCount - 1; r += 1) {
    for (let p = 0; p < points; p += 1) {
      const q = (p + 1) % points;
      const a = r * points + p;
      const b = r * points + q;
      const c = (r + 1) * points + q;
      const d = (r + 1) * points + p;
      // span x ring winding, so the computed normals face outward.
      indices.push(a, c, b, a, d, c);
    }
  }

  const addCap = (ringIndex: number, forward: boolean) => {
    const ring = rings[ringIndex];
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (let p = 0; p < points; p += 1) {
      cx += ring[p * 3];
      cy += ring[p * 3 + 1];
      cz += ring[p * 3 + 2];
    }
    const centre = positions.length / 3;
    positions.push(cx / points, cy / points, cz / points);
    uvs.push(0.5, 0.5);
    const base = positions.length / 3;
    for (let p = 0; p < points; p += 1) {
      const k = at(p) * 3;
      positions.push(ring[k], ring[k + 1], ring[k + 2]);
      uvs.push((p / points) * uScale, forward ? 0 : lengths[ringIndex] / vScale);
    }
    for (let p = 0; p < points; p += 1) {
      const q = (p + 1) % points;
      // The cap at the far end faces along the span; the start cap opposes it.
      if (forward) indices.push(centre, base + q, base + p);
      else indices.push(centre, base + p, base + q);
    }
  };
  if (capStart) addCap(0, false);
  if (capEnd) addCap(ringCount - 1, true);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Hard-surface shading: crease every edge sharper than the given angle. */
function crease(geometry: THREE.BufferGeometry, angle: number): THREE.BufferGeometry {
  const result = toCreasedNormals(geometry, angle);
  if (result !== geometry) geometry.dispose();
  return result;
}

/** NACA symmetric half-thickness, closed trailing edge. */
function nacaThickness(chord: number, ratio: number, c: number): number {
  const t = Math.max(0, Math.min(1, c));
  const yt =
    5 * ratio * (0.2969 * Math.sqrt(t) - 0.126 * t - 0.3516 * t * t + 0.2843 * t ** 3 - 0.1036 * t ** 4);
  return yt * chord;
}

type SurfaceStation = {
  /** Distance out along the span axis. */
  span: number;
  /** Longitudinal position of the leading edge. */
  leZ: number;
  chord: number;
  /** Section thickness as a fraction of chord. */
  thickness: number;
  /** Dihedral offset along +Y, used by the wings. */
  lift: number;
};

/**
 * Loft a wing or fin through NACA sections. `axis` picks the span direction:
 * "x" builds a wing with thickness in Y, "y" builds a fin with thickness in X.
 */
function airfoilGeometry(stations: SurfaceStation[], axis: "x" | "y", samples = 13): THREE.BufferGeometry {
  const contour: { c: number; side: 1 | -1 }[] = [];
  for (let i = 0; i <= samples; i += 1) contour.push({ c: i / samples, side: 1 });
  for (let i = samples - 1; i >= 1; i -= 1) contour.push({ c: i / samples, side: -1 });

  const rings = stations.map((station) => {
    const ring = new Float32Array(contour.length * 3);
    contour.forEach((point, index) => {
      const thickness = nacaThickness(station.chord, station.thickness, point.c) * point.side;
      const z = station.leZ - point.c * station.chord;
      const k = index * 3;
      if (axis === "x") {
        ring[k] = station.span;
        ring[k + 1] = station.lift + thickness;
        ring[k + 2] = z;
      } else {
        ring[k] = thickness;
        ring[k + 1] = station.span;
        ring[k + 2] = z;
      }
    });
    return ring;
  });

  return crease(
    loftRings(rings, {
      flipRing: axis === "y",
      capStart: true,
      capEnd: true,
      uScale: Math.max(...stations.map((station) => station.chord)) * 1.4,
      vScale: 1,
    }),
    Math.PI / 5
  );
}

/** Mirror across X, reversing every triangle so the winding stays outward. */
function mirrorX(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const temporary = geometry.index ? geometry.toNonIndexed() : null;
  const source = temporary ?? geometry;
  if (temporary) geometry.dispose();

  const positions = source.getAttribute("position") as THREE.BufferAttribute;
  const uvs = source.getAttribute("uv") as THREE.BufferAttribute;
  const mirrored = new THREE.BufferGeometry();
  const outPositions = new Float32Array(positions.count * 3);
  const outUvs = new Float32Array(uvs.count * 2);
  const src = positions.array as Float32Array;
  const srcUvs = uvs.array as Float32Array;

  for (let i = 0; i < positions.count; i += 3) {
    // Read each source triangle backwards. Reflecting X flips handedness, so
    // the winding has to flip with it or every normal ends up inverted.
    for (let k = 0; k < 3; k += 1) {
      const from = i + (2 - k);
      const to = i + k;
      outPositions[to * 3] = -src[from * 3];
      outPositions[to * 3 + 1] = src[from * 3 + 1];
      outPositions[to * 3 + 2] = src[from * 3 + 2];
      outUvs[to * 2] = srcUvs[from * 2];
      outUvs[to * 2 + 1] = srcUvs[from * 2 + 1];
    }
  }
  temporary?.dispose();

  mirrored.setAttribute("position", new THREE.BufferAttribute(outPositions, 3));
  mirrored.setAttribute("uv", new THREE.BufferAttribute(outUvs, 2));
  mirrored.computeVertexNormals();
  return mirrored;
}

/** mergeGeometries refuses mixed index states, so flatten everything first. */
function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const flat = parts.map((part) => {
    if (!part.index) return part;
    const flattened = part.toNonIndexed();
    part.dispose();
    return flattened;
  });
  const merged = mergeGeometries(flat, false);
  for (const part of flat) part.dispose();
  if (!merged) throw new Error("Failed to merge ship geometry");
  merged.computeBoundingSphere();
  return merged;
}

/** Apply a transform to a fresh copy, for reusing one part many times. */
function placed(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4): THREE.BufferGeometry {
  const copy = geometry.clone();
  copy.applyMatrix4(matrix);
  return copy;
}

/* ------------------------------------------------------------------- hull -- */

/** Centre hull: needle nose, flat-sided body, spine behind the cockpit. */
export function buildFuselage(): THREE.BufferGeometry {
  const rings: Float32Array[] = [];
  const point = new THREE.Vector3();
  for (const station of HULL_STATIONS) {
    const ring = new Float32Array(HULL_RING * 3);
    for (let i = 0; i < HULL_RING; i += 1) {
      hullPoint(station.z, (i / HULL_RING) * Math.PI * 2, point);
      ring[i * 3] = point.x;
      ring[i * 3 + 1] = point.y;
      ring[i * 3 + 2] = point.z;
    }
    rings.push(ring);
  }
  let widest = 0;
  for (const station of HULL_STATIONS) widest = Math.max(widest, 4 * (station.hw + station.hh));
  return crease(
    loftRings(rings, { flipRing: true, capStart: true, uScale: widest, vScale: 1 }),
    Math.PI / 6
  );
}

type CanopyStation = { z: number; w: number; h: number; sink: number; power: number };

function canopyLoft(stations: CanopyStation[], arc: number): THREE.BufferGeometry {
  const rings = stations.map((station) => {
    const ring = new Float32Array(arc * 3);
    for (let i = 0; i < arc; i += 1) {
      const theta = (i / (arc - 1)) * Math.PI;
      const x = station.w * Math.cos(theta);
      // Sink the base into the deck so the fillet is buried inside the hull and
      // the glass appears to grow out of the skin rather than sit on it.
      const base = hullTopY(station.z, x) - station.sink;
      ring[i * 3] = x;
      ring[i * 3 + 1] = base + station.h * Math.sin(theta) ** station.power;
      ring[i * 3 + 2] = station.z;
    }
    return ring;
  });
  return loftRings(rings, { flipRing: true, capStart: true, capEnd: true, uScale: 2, vScale: 1 });
}

/** Glass canopy: an arc whose base follows the real deck line. */
export function buildCanopy(): THREE.BufferGeometry {
  return canopyLoft(
    [
      { z: -1.05, w: 0.15, h: 0.07, sink: 0.08, power: 0.72 },
      { z: -0.6, w: 0.28, h: 0.17, sink: 0.08, power: 0.72 },
      { z: -0.1, w: 0.38, h: 0.26, sink: 0.08, power: 0.72 },
      { z: 0.4, w: 0.43, h: 0.32, sink: 0.08, power: 0.72 },
      { z: 1.0, w: 0.45, h: 0.34, sink: 0.08, power: 0.72 },
      { z: 1.6, w: 0.43, h: 0.32, sink: 0.08, power: 0.72 },
      { z: 2.15, w: 0.36, h: 0.25, sink: 0.08, power: 0.72 },
      { z: 2.6, w: 0.25, h: 0.15, sink: 0.08, power: 0.72 },
      { z: 2.9, w: 0.12, h: 0.06, sink: 0.08, power: 0.72 },
    ],
    15
  );
}

/** Raised structural coaming the canopy glass is set into. */
export function buildCanopyFrame(): THREE.BufferGeometry {
  return canopyLoft(
    [
      { z: -1.12, w: 0.17, h: 0.11, sink: 0.2, power: 0.8 },
      { z: -0.6, w: 0.32, h: 0.22, sink: 0.2, power: 0.8 },
      { z: 0.4, w: 0.47, h: 0.37, sink: 0.2, power: 0.8 },
      { z: 1.0, w: 0.49, h: 0.39, sink: 0.2, power: 0.8 },
      { z: 1.6, w: 0.47, h: 0.37, sink: 0.2, power: 0.8 },
      { z: 2.15, w: 0.4, h: 0.3, sink: 0.2, power: 0.8 },
      { z: 2.65, w: 0.28, h: 0.2, sink: 0.2, power: 0.8 },
      { z: 2.95, w: 0.13, h: 0.09, sink: 0.2, power: 0.8 },
    ],
    15
  );
}

/* --------------------------------------------------------------- surfaces -- */

const WING_STATIONS: SurfaceStation[] = [
  { span: 0.4, leZ: 1.15, chord: 3.5, thickness: 0.135, lift: 0.08 },
  { span: 1.25, leZ: 0.86, chord: 3.0, thickness: 0.125, lift: 0.19 },
  { span: 2.1, leZ: 0.42, chord: 2.5, thickness: 0.115, lift: 0.33 },
  { span: 2.95, leZ: -0.12, chord: 1.98, thickness: 0.105, lift: 0.47 },
  { span: 3.7, leZ: -0.56, chord: 1.5, thickness: 0.098, lift: 0.59 },
  { span: 4.32, leZ: -0.94, chord: 1.08, thickness: 0.095, lift: 0.69 },
  { span: 4.62, leZ: -1.18, chord: 0.7, thickness: 0.095, lift: 0.74 },
];

const STABILISER_STATIONS: SurfaceStation[] = [
  { span: 0.3, leZ: -2.95, chord: 1.28, thickness: 0.1, lift: 0.3 },
  { span: 0.95, leZ: -3.16, chord: 1.08, thickness: 0.095, lift: 0.37 },
  { span: 1.6, leZ: -3.4, chord: 0.84, thickness: 0.09, lift: 0.44 },
  { span: 2.0, leZ: -3.58, chord: 0.58, thickness: 0.09, lift: 0.48 },
];

const FIN_STATIONS: SurfaceStation[] = [
  { span: 0.62, leZ: -2.5, chord: 1.95, thickness: 0.115, lift: 0 },
  { span: 1.15, leZ: -2.92, chord: 1.62, thickness: 0.105, lift: 0 },
  { span: 1.62, leZ: -3.3, chord: 1.24, thickness: 0.095, lift: 0 },
  { span: 1.95, leZ: -3.58, chord: 0.86, thickness: 0.09, lift: 0 },
];

const WINGLET_STATIONS: SurfaceStation[] = [
  { span: 0, leZ: -1.0, chord: 1.05, thickness: 0.1, lift: 0 },
  { span: 0.34, leZ: -1.2, chord: 0.88, thickness: 0.095, lift: 0 },
  { span: 0.62, leZ: -1.38, chord: 0.6, thickness: 0.09, lift: 0 },
];

const winglet = () => airfoilGeometry(WINGLET_STATIONS, "y");

/** The flying surfaces as separate closed solids. Kept public so their winding
 *  can be verified individually; `buildSurfaces` merges them for one draw call. */
export function buildSurfaceParts(): THREE.BufferGeometry[] {
  const rightWing = airfoilGeometry(WING_STATIONS, "x");
  const rightStab = airfoilGeometry(STABILISER_STATIONS, "x");
  const parts = [
    rightWing,
    mirrorX(rightWing),
    rightStab,
    mirrorX(rightStab),
    airfoilGeometry(FIN_STATIONS, "y"),
    winglet().rotateZ(-0.42).translate(4.3, 0.7, 0),
    winglet().rotateZ(0.42).translate(-4.3, 0.7, 0),
  ];
  rightWing.dispose();
  rightStab.dispose();
  return parts;
}

/** Wings, stabilisers, fin and canted winglets as one hull-skinned buffer. */
export function buildSurfaces(): THREE.BufferGeometry {
  return mergeParts(buildSurfaceParts());
}

/**
 * Hard chine strakes along the waterline. Without a real edge the hull reads as
 * an extruded tube no matter how good the paint is; this is the line that
 * catches the key light and tells the eye it is looking at a solid.
 */
export function buildChines(): THREE.BufferGeometry {
  const stations = [
    { z: -3.9, hw: 0.87, depth: 0.2, thick: 0.045, y: -0.04 },
    { z: -2.2, hw: 0.99, depth: 0.34, thick: 0.07, y: 0.06 },
    { z: -0.6, hw: 1.01, depth: 0.38, thick: 0.075, y: 0.08 },
    { z: 1.1, hw: 0.95, depth: 0.32, thick: 0.065, y: 0.04 },
    { z: 2.6, hw: 0.78, depth: 0.22, thick: 0.05, y: -0.02 },
    { z: 3.9, hw: 0.44, depth: 0.12, thick: 0.035, y: -0.06 },
  ];
  const build = (side: number) => {
    const rings = stations.map((station) => {
      const ring = new Float32Array(4 * 3);
      const x = side * station.hw;
      const outline: [number, number][] = [
        [x, station.y + station.thick],
        [x + side * 0.22, station.y - station.depth * 0.55],
        [x - side * 0.02, station.y - station.depth],
        [x - side * 0.18, station.y - station.depth * 0.35],
      ];
      outline.forEach(([px, py], index) => {
        ring[index * 3] = px;
        ring[index * 3 + 1] = py;
        ring[index * 3 + 2] = station.z;
      });
      return ring;
    });
    return loftRings(rings, { flipRing: side < 0, capStart: true, capEnd: true, uScale: 1, vScale: 1 });
  };
  return mergeParts([build(1), build(-1)]);
}

/* ------------------------------------------------------------- propulsion -- */

/**
 * De Laval contour in the lathe's (radius, axis) plane, ordered exit-first so
 * the generated normals face outward. Y is the engine axis, positive forward.
 * The expansion ratio is deliberately modest: a wide-bell nuke look swamps the
 * hull from behind, which is the angle this ship is mostly seen from.
 */
function bellProfile(): THREE.Vector2[] {
  const throat = 0.235;
  const exit = 0.44;
  const points = [new THREE.Vector2(exit, -0.82)];
  for (let i = 11; i >= 0; i -= 1) {
    const t = i / 12;
    points.push(new THREE.Vector2(throat + (exit - throat) * t ** 0.55, -0.82 * t ** 0.86));
  }
  points.push(
    new THREE.Vector2(throat + 0.03, 0.06),
    new THREE.Vector2(0.34, 0.15),
    new THREE.Vector2(0.4, 0.26),
    new THREE.Vector2(0.4, 0.44),
    new THREE.Vector2(0.34, 0.58)
  );
  return points;
}

/** The bell alone, so its expansion contour can be inspected on its own. */
export function buildEngineBell(): THREE.BufferGeometry {
  return new THREE.LatheGeometry(bellProfile(), 30).rotateX(Math.PI / 2);
}

/** One engine: bell, chamber, gimbal ring, turbopump plumbing, RCS jets. */
function buildEngine(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [buildEngineBell()];
  const rand = mulberry32(2211);

  parts.push(new THREE.TorusGeometry(0.27, 0.045, 8, 24).translate(0, 0, 0.02));
  parts.push(new THREE.CylinderGeometry(0.36, 0.4, 0.28, 20).rotateX(Math.PI / 2).translate(0, 0, 0.72));
  parts.push(
    new THREE.SphereGeometry(0.37, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)
      .rotateX(-Math.PI / 2)
      .translate(0, 0, 0.87)
  );

  for (let i = 0; i < 5; i += 1) {
    const angle = rand() * Math.PI * 2;
    const radius = 0.42 + rand() * 0.04;
    const pump = new THREE.CapsuleGeometry(0.09 + rand() * 0.04, 0.18 + rand() * 0.18, 4, 8);
    pump.rotateZ(Math.PI / 2);
    pump.rotateY(angle);
    pump.translate(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.4 + rand() * 0.42);
    parts.push(pump);
  }
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + 0.4;
    const pipe = new THREE.CylinderGeometry(0.028, 0.028, 1.05, 6);
    pipe.rotateX(Math.PI / 2);
    pipe.translate(Math.cos(angle) * 0.43, Math.sin(angle) * 0.43, 0.32);
    parts.push(pipe);
  }
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    const jet = new THREE.CylinderGeometry(0.045, 0.07, 0.2, 8);
    jet.rotateX(Math.PI / 2);
    jet.translate(Math.cos(angle) * 0.37, Math.sin(angle) * 0.37, -0.04);
    parts.push(jet);
  }
  return mergeParts(parts);
}

/* Engine centres sit far enough outboard that the two exit rims clear each
   other; any closer and the bells interpenetrate at the rim. */
export const ENGINE_OFFSET_X = 0.56;
/** Where the bells sit in ship space, aft of the engine housing. */
export const ENGINE_EXIT_Z = -5.12;

/** Nacelle fairings blending each engine into the hull flank. */
function buildPylon(side: number): THREE.BufferGeometry {
  const stations = [
    { z: -2.4, centre: 0.68, hx: 0.28, hy: 0.38, y: 0.05 },
    { z: -3.2, centre: 0.64, hx: 0.25, hy: 0.42, y: 0.02 },
    { z: -4.0, centre: 0.6, hx: 0.2, hy: 0.38, y: 0.0 },
    { z: -4.35, centre: 0.56, hx: 0.14, hy: 0.28, y: 0.0 },
  ];
  const rings = stations.map((station) => {
    const ring = new Float32Array(HULL_RING * 3);
    for (let i = 0; i < HULL_RING; i += 1) {
      const t = (i / HULL_RING) * Math.PI * 2;
      const [dx, dy] = superellipse(t, station.hx, station.hy, 3.0);
      ring[i * 3] = side * (station.centre + dx);
      ring[i * 3 + 1] = dy + station.y;
      ring[i * 3 + 2] = station.z;
    }
    return ring;
  });
  return loftRings(rings, { flipRing: side > 0, capStart: true, capEnd: true, uScale: 2, vScale: 1 });
}

/** Twin main engines on blended pylons. */
export function buildEngines(): THREE.BufferGeometry {
  const engine = buildEngine();
  const pylon = buildPylon(1);
  const parts = [
    placed(engine, new THREE.Matrix4().makeTranslation(ENGINE_OFFSET_X, 0, -4.3)),
    placed(engine, new THREE.Matrix4().makeTranslation(-ENGINE_OFFSET_X, 0, -4.3)),
    pylon,
    mirrorX(pylon),
  ];
  engine.dispose();
  pylon.dispose();
  return mergeParts(parts);
}

/* --------------------------------------------------------------- radiators -- */

export const RADIATOR_LENGTH = 1.15;
const RADIATOR_CHORD = 2.3;
const RADIATOR_THICKNESS = 0.11;

/**
 * Deployable radiator wing: a thin slab with integral root ribs. Local +X runs
 * outboard, +Y is the radiating face, +Z is chordwise. `side` mirrors the panel
 * across X so the port unit deploys symmetrically without inverting normals.
 */
export function buildRadiator(side: 1 | -1): THREE.BufferGeometry {
  const halfLength = RADIATOR_LENGTH / 2;
  const stations = [
    { t: 0, shrink: 0.9 },
    { t: 0.18, shrink: 1 },
    { t: 0.82, shrink: 1 },
    { t: 1, shrink: 0.9 },
  ];
  const ringPoints = 4 * 9;
  const rings = stations.map((station) => {
    const ring = new Float32Array(ringPoints * 3);
    for (let i = 0; i < ringPoints; i += 1) {
      const t = (i / ringPoints) * Math.PI * 2;
      const [dx, dz] = superellipse(
        t,
        halfLength * station.shrink,
        (RADIATOR_CHORD / 2) * station.shrink,
        6
      );
      ring[i * 3] = dx + halfLength;
      ring[i * 3 + 1] = station.t * RADIATOR_THICKNESS;
      ring[i * 3 + 2] = dz;
    }
    return ring;
  });
  const parts = [
    loftRings(rings, { capStart: true, capEnd: true, uScale: 2, vScale: RADIATOR_THICKNESS / 2 }),
  ];
  // Root ribs and the hinge spar the panel folds against.
  for (let i = 0; i < 4; i += 1) {
    parts.push(
      new THREE.BoxGeometry(0.08, 0.06, RADIATOR_CHORD * 0.95).translate(
        0.14 + i * 0.28,
        -RADIATOR_THICKNESS / 2 - 0.03,
        0
      )
    );
  }
  parts.push(
    new THREE.CylinderGeometry(0.08, 0.08, RADIATOR_CHORD + 0.24, 10)
      .rotateX(Math.PI / 2)
      .translate(0.05, 0, 0)
  );

  const panel = mergeParts(parts);
  if (side > 0) return panel;
  const mirrored = mirrorX(panel);
  panel.dispose();
  return mirrored;
}

/* ----------------------------------------------------------- hard points -- */

/** RCS thruster clusters, sensor blisters, dish, antennas and the nose probe. */
export function buildAvionics(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  for (const side of [-1, 1]) {
    const block = new THREE.BoxGeometry(0.3, 0.22, 0.34);
    block.translate(side * 1.0, 0.24, 1.5);
    parts.push(block);
    const directions: [number, number, number][] = [
      [side, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [0, -1, 0],
    ];
    const base = new THREE.Vector3(side * 1.0, 0.24, 1.5);
    for (const direction of directions) {
      const offset = new THREE.Vector3(direction[0], direction[1], direction[2]);
      const jet = new THREE.CylinderGeometry(0.035, 0.062, 0.14, 8);
      jet.applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), offset.clone().normalize())
      );
      jet.translate(
        base.x + offset.x * 0.19,
        base.y + offset.y * 0.16,
        base.z + offset.z * 0.19
      );
      parts.push(jet);
    }
  }

  // Chin sensor ball with a recessed aperture.
  parts.push(
    new THREE.SphereGeometry(0.3, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62).translate(0, -0.26, 2.9)
  );
  parts.push(
    new THREE.CylinderGeometry(0.13, 0.16, 0.1, 14).rotateX(Math.PI / 2).translate(0, -0.4, 3.08)
  );
  // Dorsal avionics blisters behind the canopy.
  parts.push(
    new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).translate(0.34, 1.12, -1.05)
  );
  parts.push(
    new THREE.SphereGeometry(0.16, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5).translate(-0.3, 1.16, -2.1)
  );
  // High-gain dish and feed horn on the spine.
  parts.push(
    new THREE.LatheGeometry([0.02, 0.1, 0.2, 0.31, 0.42].map((r) => new THREE.Vector2(r, (r * r) / 1.15)), 20)
      .rotateX(-0.5)
      .translate(0.16, 1.2, -3.1)
  );
  parts.push(
    new THREE.CylinderGeometry(0.028, 0.028, 0.34, 6).rotateX(1.1).translate(0.16, 1.36, -2.98)
  );
  parts.push(new THREE.SphereGeometry(0.055, 10, 8).translate(0.16, 1.48, -2.9));
  // Whip antennas: short, thin and swept well aft. Anything stiffer or longer
  // reads as a spar from the chase view, which is most of what the pilot sees.
  for (const [x, z, tilt] of [
    [0.4, -1.6, -0.5],
    [-0.44, -2.55, 0.55],
  ] as const) {
    const mast = new THREE.CylinderGeometry(0.009, 0.018, 0.52, 6);
    mast.rotateZ(tilt);
    mast.rotateX(-0.35);
    mast.translate(x, 1.42, z);
    parts.push(mast);
  }
  // Docking collar and probe at the nose.
  parts.push(new THREE.TorusGeometry(0.15, 0.05, 8, 18).translate(0, 0, 5.0));
  parts.push(new THREE.CylinderGeometry(0.07, 0.11, 0.34, 10).rotateX(Math.PI / 2).translate(0, 0, 5.14));
  return mergeParts(parts);
}

/** Side intakes with a recessed mouth and a splitter plate. */
export function buildIntakes(): THREE.BufferGeometry {
  const stations = [
    { z: -2.2, reach: 0.5, hx: 0.14, hy: 0.28 },
    { z: -1.4, reach: 0.78, hx: 0.2, hy: 0.38 },
    { z: -0.4, reach: 0.9, hx: 0.24, hy: 0.43 },
    { z: 0.35, reach: 0.94, hx: 0.25, hy: 0.45 },
  ];
  const build = (side: number) => {
    const parts: THREE.BufferGeometry[] = [];
    const rings = stations.map((station) => {
      const centre = hullProfileAt(station.z).hw * station.reach;
      const ring = new Float32Array(HULL_RING * 3);
      for (let i = 0; i < HULL_RING; i += 1) {
        const t = (i / HULL_RING) * Math.PI * 2;
        const [dx, dy] = superellipse(t, station.hx, station.hy, 3.4);
        ring[i * 3] = side * (centre + dx);
        ring[i * 3 + 1] = dy + 0.24;
        ring[i * 3 + 2] = station.z;
      }
      return ring;
    });
    parts.push(loftRings(rings, { flipRing: side > 0, capStart: true, uScale: 2, vScale: 1 }));

    // Dark inlet face, set back inside the mouth.
    const mouth = stations[stations.length - 1];
    const faceX = side * hullProfileAt(mouth.z).hw * mouth.reach;
    parts.push(
      new THREE.BoxGeometry(mouth.hx * 1.9, mouth.hy * 1.9, 0.18).translate(faceX, 0.24, mouth.z - 0.26)
    );
    parts.push(
      new THREE.BoxGeometry(mouth.hx * 2.3, 0.07, 0.52).translate(faceX + side * 0.02, 0.24, mouth.z - 0.12)
    );
    return mergeParts(parts);
  };
  return mergeParts([build(1), build(-1)]);
}

/** Landing-gear strut with knee and footpad, hinged at the origin. */
export function buildGearLeg(length: number): THREE.BufferGeometry {
  return mergeParts([
    new THREE.CylinderGeometry(0.1, 0.13, length * 0.62, 10).translate(0, -length * 0.31, 0),
    new THREE.CylinderGeometry(0.075, 0.075, length * 0.52, 10)
      .rotateX(0.5)
      .translate(0, -length * 0.75, length * 0.17),
    new THREE.SphereGeometry(0.11, 10, 8).translate(0, -length * 0.5, 0),
    new THREE.CylinderGeometry(0.2, 0.24, 0.09, 12).translate(0, -length, 0),
    new THREE.TorusGeometry(0.21, 0.035, 6, 14).rotateX(Math.PI / 2).translate(0, -length, 0),
    new THREE.BoxGeometry(0.28, 0.2, 0.28).translate(0, -0.05, 0),
  ]);
}

/* ---------------------------------------------------------------- greebles -- */

const up = new THREE.Vector3(0, 1, 0);

/**
 * Surface-mounted hardware scattered over the skin: access covers, conduit
 * runs, lifting points, blisters. Placed by hull-surface parameterisation and
 * merged down to a single draw call.
 */
export function buildGreebles(): THREE.BufferGeometry {
  const rand = mulberry32(60221);
  const parts: THREE.BufferGeometry[] = [];
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const twist = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  const one = new THREE.Vector3(1, 1, 1);

  const mount = (geometry: THREE.BufferGeometry, at: THREE.Vector3, along: THREE.Vector3, roll: number) => {
    quaternion.setFromUnitVectors(up, along);
    twist.setFromAxisAngle(up, roll);
    matrix.compose(at.clone().addScaledVector(along, -0.02), quaternion.multiply(twist), one);
    geometry.applyMatrix4(matrix);
    parts.push(geometry);
  };

  for (let i = 0; i < 84; i += 1) {
    const z = -4.5 + rand() * 8.2;
    const t = rand() * Math.PI * 2;
    hullSurface(z, t, point, normal);
    // Leave the canopy trough and the dorsal spine fairing clear of clutter.
    const profile = hullProfileAt(z);
    if (z > -1.2 && z < 3.0 && point.y > profile.hh * 0.55) continue;

    const roll = rand() * Math.PI * 2;
    const kind = rand();
    if (kind < 0.46) {
      const h = 0.03 + rand() * 0.05;
      mount(new THREE.BoxGeometry(0.12 + rand() * 0.4, h, 0.12 + rand() * 0.46).translate(0, h / 2, 0), point, normal, roll);
    } else if (kind < 0.66) {
      mount(
        new THREE.CylinderGeometry(0.04 + rand() * 0.05, 0.06 + rand() * 0.07, 0.05 + rand() * 0.08, 8).translate(0, 0.04, 0),
        point,
        normal,
        roll
      );
    } else if (kind < 0.8) {
      mount(
        new THREE.SphereGeometry(0.09 + rand() * 0.13, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5).translate(0, -0.01, 0),
        point,
        normal,
        roll
      );
    } else if (kind < 0.91) {
      mount(
        new THREE.CylinderGeometry(0.16 + rand() * 0.12, 0.18 + rand() * 0.12, 0.04, 12).translate(0, 0.015, 0),
        point,
        normal,
        roll
      );
    } else {
      mount(
        new THREE.TorusGeometry(0.07 + rand() * 0.05, 0.028 + rand() * 0.02, 6, 12)
          .rotateX(Math.PI / 2)
          .translate(0, 0.02, 0),
        point,
        normal,
        roll
      );
    }
  }

  // Conduit runs: pipes tracking the hull for their whole length. These read
  // strongly as plumbing and tie the surface clutter together.
  for (let run = 0; run < 7; run += 1) {
    const t = rand() * Math.PI * 2;
    const from = -4.3 + rand() * 3.2;
    const to = from + 1.6 + rand() * 3.2;
    const steps = 7;
    const path: THREE.Vector3[] = [];
    for (let s = 0; s <= steps; s += 1) {
      const z = from + ((to - from) * s) / steps;
      hullSurface(z, t + Math.sin(s * 0.9 + run) * 0.05, point, normal);
      path.push(point.clone().addScaledVector(normal, 0.045));
    }
    parts.push(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path), steps * 3, 0.026 + rand() * 0.016, 6, false)
    );
  }

  // Underside: fuel bay doors and tank fairings.
  for (let i = 0; i < 14; i += 1) {
    const z = -3.8 + rand() * 6.4;
    const t = -Math.PI / 2 + (rand() - 0.5) * 1.5;
    hullSurface(z, t, point, normal);
    mount(
      new THREE.BoxGeometry(0.18 + rand() * 0.3, 0.05, 0.3 + rand() * 0.6).translate(0, 0.02, 0),
      point,
      normal,
      rand() * Math.PI
    );
  }

  return mergeParts(parts);
}

/** Cockpit interior: seat, pilot and coaming, sitting behind the glass. */
export function buildCockpit(): THREE.BufferGeometry {
  const deck = hullDeckY(1.05);
  return mergeParts([
    new THREE.BoxGeometry(0.42, 0.1, 0.5).translate(0, deck - 0.02, 1.15),
    new THREE.BoxGeometry(0.4, 0.52, 0.1).rotateX(-0.22).translate(0, deck + 0.22, 0.86),
    new THREE.BoxGeometry(0.5, 0.06, 0.26).rotateX(-0.7).translate(0, deck + 0.1, 1.62),
    new THREE.CapsuleGeometry(0.13, 0.24, 4, 10).translate(0, deck + 0.24, 1.16),
    new THREE.SphereGeometry(0.13, 14, 10).translate(0, deck + 0.46, 1.2),
  ]);
}

/** Emissive strip and helmet visor, kept separate so they can actually glow. */
export function buildCockpitGlow(): THREE.BufferGeometry {
  const deck = hullDeckY(1.05);
  return mergeParts([
    new THREE.BoxGeometry(0.44, 0.02, 0.2).rotateX(-0.7).translate(0, deck + 0.14, 1.63),
    new THREE.SphereGeometry(0.1, 12, 8).scale(1, 0.6, 0.5).translate(0, deck + 0.47, 1.28),
  ]);
}