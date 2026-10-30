"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { fleet, type PilotBrief } from "@/lib/fleetStore";
import type { Simulation } from "@/lib/simulation";

/**
 * Other visitors' ships on the flight deck.
 *
 * `FleetLink` samples the local simulation a few times a second and drives the
 * fleet store's polling loop; `Drone` renders each remote pilot as a light
 * interceptor hull in their chosen accent colour, gliding between polled
 * snapshots with exponential smoothing so a 3-second update rate still reads
 * as continuous flight. Callsigns float above the hulls as canvas sprites.
 */

/** Cheer Park sits on the origin — the shared spawn of every flight. */
const PARK_CENTER = new THREE.Vector3(0, 0, 0);
/** Within this radius a pilot counts as inside the park. */
const PARK_RADIUS = 46;
const MAX_DRONES = 12;
/** How quickly drones close the gap to their latest snapshot (per second). */
const FOLLOW_RATE = 3.2;
/** Past this separation a drone snaps instead of gliding (respawn, long drop). */
const SNAP_SQUARED = 900 * 900;

const bodyGeometry = new THREE.CapsuleGeometry(1.1, 5.2, 3, 10);
bodyGeometry.rotateX(Math.PI / 2);
const finGeometry = new THREE.BoxGeometry(0.5, 2.6, 2.2);
const glowGeometry = new THREE.SphereGeometry(0.6, 10, 10);

const hullMaterials = new Map<string, THREE.MeshStandardMaterial>();
function hullMaterial(accent: string): THREE.MeshStandardMaterial {
  const key = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#38bdf8";
  let material = hullMaterials.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(key).lerp(new THREE.Color("#9aa7b8"), 0.45),
      metalness: 0.45,
      roughness: 0.5,
      emissive: new THREE.Color(key),
      emissiveIntensity: 0.5,
    });
    hullMaterials.set(key, material);
  }
  return material;
}

const glowMaterials = new Map<string, THREE.MeshBasicMaterial>();
function glowMaterial(accent: string): THREE.MeshBasicMaterial {
  const key = /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#38bdf8";
  let material = glowMaterials.get(key);
  if (!material) {
    material = new THREE.MeshBasicMaterial({ color: key, toneMapped: false });
    glowMaterials.set(key, material);
  }
  return material;
}

/** Callsign labels are tiny canvas sprites, cached and evicted by text. */
const labelCache = new Map<string, THREE.CanvasTexture>();
function labelTexture(text: string): THREE.CanvasTexture {
  const cached = labelCache.get(text);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = "600 30px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(2, 6, 12, 0.9)";
    ctx.strokeText(text, 128, 32);
    ctx.fillStyle = "#9fd8ff";
    ctx.fillText(text, 128, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (labelCache.size >= 40) {
    const oldest = labelCache.keys().next().value;
    if (oldest !== undefined) {
      labelCache.get(oldest)?.dispose();
      labelCache.delete(oldest);
    }
  }
  labelCache.set(text, texture);
  return texture;
}

function CallsignTag({ text }: { text: string }) {
  const texture = useMemo(() => labelTexture(text), [text]);
  return (
    <sprite position={[0, 6.5, 0]} scale={[9, 2.25, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}

function Drone({ pilot }: { pilot: PilotBrief }) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const scratch = useMemo(() => ({ pos: new THREE.Vector3(), quat: new THREE.Quaternion() }), []);

  useFrame((state, delta) => {
    const g = group.current;
    const snap = fleet.getPilot(pilot.id);
    if (!g || !snap) return;

    scratch.pos.set(snap.p[0] ?? 0, snap.p[1] ?? 0, snap.p[2] ?? 0);
    scratch.quat.set(snap.q[0] ?? 0, snap.q[1] ?? 0, snap.q[2] ?? 0, snap.q[3] ?? 1);
    if (g.position.distanceToSquared(scratch.pos) > SNAP_SQUARED) {
      g.position.copy(scratch.pos);
      g.quaternion.copy(scratch.quat);
    } else {
      const t = 1 - Math.exp(-delta * FOLLOW_RATE);
      g.position.lerp(scratch.pos, t);
      g.quaternion.slerp(scratch.quat, t);
    }

    // Engine flare tracks the pilot's reported speed; idle ships sit dim.
    if (glow.current) {
      const base = 0.85 + Math.min(1.7, snap.speed / 40) + (snap.boosting ? 0.6 : 0);
      glow.current.scale.setScalar(base + Math.sin(state.clock.elapsedTime * 12) * 0.07);
    }
  });

  return (
    <group ref={group} scale={2}>
      <mesh geometry={bodyGeometry} material={hullMaterial(pilot.accent)} />
      {/* Tail fin, vertical plus horizontal, like the interceptor's own. */}
      <mesh geometry={finGeometry} material={hullMaterial(pilot.accent)} position={[0, 0.9, -2.5]} />
      <mesh
        geometry={finGeometry}
        material={hullMaterial(pilot.accent)}
        position={[0, 0, -2.5]}
        rotation={[0, 0, Math.PI / 2]}
      />
      <mesh ref={glow} geometry={glowGeometry} material={glowMaterial(pilot.accent)} position={[0, 0, -4]} />
      <CallsignTag text={pilot.callsign} />
    </group>
  );
}

/** Bridges the live simulation into the fleet store; also samples the park. */
function FleetLink({ sim }: { sim: Simulation }) {
  useEffect(() => {
    fleet.start(() => ({
      p: [sim.shipPosition.x, sim.shipPosition.y, sim.shipPosition.z],
      q: [
        sim.shipQuaternion.x,
        sim.shipQuaternion.y,
        sim.shipQuaternion.z,
        sim.shipQuaternion.w,
      ],
      speed: sim.shipSpeed,
      boosting: sim.boosting,
      mode: sim.docked ? "docked" : sim.landing ? "landing" : "cruise",
    }));
    return () => fleet.stop();
  }, [sim]);

  useFrame(() => {
    fleet.setInPark(sim.shipPosition.distanceToSquared(PARK_CENTER) < PARK_RADIUS * PARK_RADIUS);
  });

  return null;
}

export default function Fleet({ sim }: { sim: Simulation }) {
  const pilots = useSyncExternalStore(fleet.subscribe, fleet.getPilotList);
  return (
    <>
      <FleetLink sim={sim} />
      {pilots.slice(0, MAX_DRONES).map((pilot) => (
        <Drone key={pilot.id} pilot={pilot} />
      ))}
    </>
  );
}
