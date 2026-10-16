import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  buildAvionics,
  buildCanopy,
  buildCanopyFrame,
  buildChines,
  buildCockpit,
  buildEngines,
  buildEngineBell,
  buildFuselage,
  buildGearLeg,
  buildGreebles,
  buildIntakes,
  buildRadiator,
  buildSurfaces,
  buildSurfaceParts,
  hullSurface,
} from "@/components/space/shipGeometry";

/** Divergence-theorem volume. Positive means normals face outward. */
function signedVolume(geometry: THREE.BufferGeometry): number {
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const vertex = (i: number) =>
    new THREE.Vector3(position.getX(i), position.getY(i), position.getZ(i));
  const total = index ? index.count : position.count;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let volume = 0;
  for (let i = 0; i < total; i += 3) {
    const i0 = index ? index.getX(i) : i;
    const i1 = index ? index.getX(i + 1) : i + 1;
    const i2 = index ? index.getX(i + 2) : i + 2;
    a.copy(vertex(i0));
    b.copy(vertex(i1));
    c.copy(vertex(i2));
    volume += a.dot(b.clone().cross(c)) / 6;
  }
  return volume;
}

function report(name: string, geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const normals = geometry.getAttribute("normal") as THREE.BufferAttribute;
  let nan = 0;
  let degenerate = 0;
  for (let i = 0; i < position.count; i += 1) {
    if (!Number.isFinite(position.getX(i)) || !Number.isFinite(position.getY(i)) || !Number.isFinite(position.getZ(i))) nan += 1;
    const length = new THREE.Vector3(normals.getX(i), normals.getY(i), normals.getZ(i)).length();
    if (!Number.isFinite(length) || length < 0.5) degenerate += 1;
  }
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const triangles = (geometry.getIndex()?.count ?? position.count) / 3;
   
  console.log(
    `${name.padEnd(22)} tris=${String(triangles).padStart(6)} verts=${String(position.count).padStart(6)}` +
      ` nan=${nan} badNormals=${degenerate} vol=${signedVolume(geometry).toFixed(2)}` +
      ` size=[${box.max.clone().sub(box.min).toArray().map((v) => v.toFixed(2)).join(",")}]`
  );
  return { nan, degenerate, triangles, box };
}

describe("ship geometry", () => {
  const parts = {
    fuselage: buildFuselage(),
    surfaces: buildSurfaces(),
    canopy: buildCanopy(),
    canopyFrame: buildCanopyFrame(),
    chines: buildChines(),
    intakes: buildIntakes(),
    avionics: buildAvionics(),
    engines: buildEngines(),
    greebles: buildGreebles(),
    cockpit: buildCockpit(),
    cockpitGlow: buildCockpit(),
    radiatorStarboard: buildRadiator(1),
    radiatorPort: buildRadiator(-1),
    gear: buildGearLeg(0.62),
  };

  it("builds clean geometry with no NaN or degenerate normals", () => {
    for (const [name, geometry] of Object.entries(parts)) {
      const result = report(name, geometry);
      expect(result.nan, `${name} has NaN positions`).toBe(0);
      expect(result.degenerate, `${name} has bad normals`).toBe(0);
      expect(result.triangles, `${name} is empty`).toBeGreaterThan(0);
    }
  });

  it("keeps the airframe inside the chase-camera envelope", () => {
    const box = new THREE.Box3();
    for (const geometry of Object.values(parts)) {
      geometry.computeBoundingBox();
      box.union(geometry.boundingBox!);
    }
    // Chase rig sits ~11 ship-units aft, so the hull must stay near that size.
    expect(box.min.z).toBeGreaterThan(-6.5);
    expect(box.max.z).toBeLessThan(6);
    expect(box.max.x).toBeLessThan(5.2);
    expect(box.max.y).toBeLessThan(2.4);
    expect(box.min.y).toBeGreaterThan(-1.4);
  });

  it("keeps the total triangle budget sane", () => {
    const total = Object.values(parts).reduce((sum, g) => sum + (g.getIndex()?.count ?? g.getAttribute("position").count) / 3, 0);
     
    console.log("TOTAL TRIS", total);
    expect(total).toBeLessThan(120000);
  });

  it("mounts hull surface normals outward", () => {
    const point = new THREE.Vector3();
    const normal = new THREE.Vector3();
    for (const z of [-4, -2, 0, 2, 4]) {
      for (let i = 0; i < 24; i += 1) {
        hullSurface(z, (i / 24) * Math.PI * 2, point, normal);
        const radial = point.clone().setY(point.y * 0.5).normalize();
        expect(normal.dot(radial), `inward at z=${z}`).toBeGreaterThan(0);
      }
    }
  });

  it("orients closed parts outward by signed volume", () => {
    // The fuselage loft is a closed-enough solid: a correct winding gives a
    // positive divergence volume roughly the size of the hull itself.
    const volume = signedVolume(parts.fuselage);
     
    console.log("FUSELAGE VOLUME", volume);
    expect(volume).toBeGreaterThan(4);
    expect(volume).toBeLessThan(40);
  });

  it("fans radiator caps outward on both sides", () => {
    expect(signedVolume(parts.radiatorStarboard)).toBeGreaterThan(0);
    expect(signedVolume(parts.radiatorPort)).toBeGreaterThan(0);
  });

  it("mirrors port surfaces with correct normals", () => {
    // A mirrored solid must keep a positive volume: if the winding is not
    // reversed along with the reflection, every normal comes out inverted.
    expect(signedVolume(parts.radiatorPort)).toBeGreaterThan(0);
    expect(signedVolume(parts.radiatorPort)).toBeCloseTo(signedVolume(parts.radiatorStarboard), 3);
  });

  it("faces the engine bells away from their axis", () => {
    // The bell is a thin open shell, so signed volume cannot test it. Instead
    // every vertex on the flared section must have a normal with a positive
    // radial component: a de Laval contour wound the wrong way would light up
    // from the inside and read as a dented cone.
    const bell = buildEngineBell();
    const position = bell.getAttribute("position") as THREE.BufferAttribute;
    const normal = bell.getAttribute("normal") as THREE.BufferAttribute;
    let checked = 0;
    for (let i = 0; i < position.count; i += 1) {
      const z = position.getZ(i);
      if (z > -0.05) continue;
      const radial = new THREE.Vector3(position.getX(i), position.getY(i), 0);
      const radius = radial.length();
      radial.normalize();
      const n = new THREE.Vector3(normal.getX(i), normal.getY(i), normal.getZ(i));
      expect(n.dot(radial), `bell normal inverted at radius ${radius}`).toBeGreaterThan(0.2);
      checked += 1;
    }
    expect(checked, "no bell vertices were sampled").toBeGreaterThan(200);
    bell.dispose();
  });

  it("expands the bell from throat to exit", () => {
    const bell = buildEngineBell();
    const position = bell.getAttribute("position") as THREE.BufferAttribute;
    let throat = Infinity;
    let exit = 0;
    for (let i = 0; i < position.count; i += 1) {
      const radius = Math.hypot(position.getX(i), position.getY(i));
      if (position.getZ(i) < -0.75) exit = Math.max(exit, radius);
      if (Math.abs(position.getZ(i)) < 0.02) throat = Math.min(throat, radius);
    }
    // Assert the contour's character, not its exact size: a de Laval bell has a
    // tight throat and a modest expansion, and must never run away larger than
    // the hull is wide.
    expect(throat).toBeGreaterThan(0.15);
    expect(exit / throat).toBeGreaterThan(1.6);
    expect(exit / throat).toBeLessThan(2.6);
    expect(exit * 2).toBeLessThan(2.1);
    bell.dispose();
  });

  it("winds every flying surface outward", () => {
    // Wings carry dihedral, so a naive up/down test on merged vertices is
    // meaningless. Each surface is a closed solid instead, and a closed solid
    // with outward normals has positive divergence volume.
    const surfaces = buildSurfaceParts();
    expect(surfaces.length).toBe(7);
    surfaces.forEach((surface, index) => {
      const volume = signedVolume(surface);
      expect(volume, `surface ${index} is wound inward`).toBeGreaterThan(0.001);
    });
    surfaces.forEach((surface) => surface.dispose());
  });
});