"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { flightInput } from "@/lib/flight";
import { DOCK_RANGE, UNIVERSE_RADIUS, dockPoint, planetById, type Simulation } from "@/lib/simulation";
import { planets, type SectionId } from "@/lib/profile";
import { createGlowTexture } from "./textures";

const FORWARD = new THREE.Vector3(0, 0, 1);
/* Capital-scale starfighter: the whole airframe runs ~3x, slow majestic
   turns, heavy burn. Scale lives on the outer group so exhaust, glare and
   lights all grow with the hull. */
const SHIP_SCALE = 2.8;
const MAX_SPEED = 42;
const BOOST_SPEED = 100;
const ACCEL = 34;
const BOOST_ACCEL = 70;
const DRAG = 0.06;
const BOOST_DRAG = 0.04;
const TURN = 1.3;
/* Real-world gravity wells: every planet tugs the hull with inverse-square
   falloff. Capped low so the main drive and the autopilot always win. */
const GRAVITY_G = 420;
const GRAVITY_BODY_CAP = 3.5;
const GRAVITY_TOTAL_CAP = 8;

type ShipProps = {
  sim: Simulation;
  onDock: (id: SectionId) => void;
  onRelease: () => void;
};

const HULL = "#c9d3e2";
const DARK = "#3a4250";
const ACCENT = "#6fd4ff";

export default function Ship({ sim, onDock, onRelease }: ShipProps) {
  const group = useRef<THREE.Group>(null);
  const hull = useRef<THREE.Group>(null);
  const exhaust = useRef<THREE.Mesh>(null);
  const engineGlows = useRef<THREE.Group>(null);
  const navLeft = useRef<THREE.Mesh>(null);
  const navRight = useRef<THREE.Mesh>(null);

  const velocity = useRef(new THREE.Vector3());
  const glowMap = useMemo(() => createGlowTexture(), []);
  useEffect(() => () => glowMap.dispose(), [glowMap]);

  const scratch = useMemo(
    () => ({
      euler: new THREE.Euler(0, 0, 0, "YXZ"),
      delta: new THREE.Quaternion(),
      inverse: new THREE.Quaternion(),
      forward: new THREE.Vector3(),
      local: new THREE.Vector3(),
      desired: new THREE.Vector3(),
      dock: new THREE.Vector3(),
      gravity: new THREE.Vector3(),
      pull: new THREE.Vector3(),
    }),
    []
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const body = group.current;
    if (!body) return;

    const manual =
      flightInput.thrust !== 0 ||
      flightInput.yaw !== 0 ||
      flightInput.pitch !== 0 ||
      flightInput.roll !== 0 ||
      flightInput.brake;

    if (manual) {
      if (sim.docked) {
        sim.docked = null;
        onRelease();
      }
      if (sim.target) sim.target = null;
    }

    let thrust = flightInput.thrust;
    let yaw = flightInput.yaw;
    let pitch = flightInput.pitch;
    let roll = flightInput.roll;
    let boosting = flightInput.boost;
    const docked = sim.docked;

    if (docked) {
      thrust = 0;
      yaw = 0;
      pitch = 0;
      roll = 0;
      boosting = false;
    } else if (sim.target) {
      const def = planetById(sim.target);
      const position = sim.positions.get(sim.target);
      if (position) {
        dockPoint(def, position, sim.shipPosition, scratch.dock);
        scratch.desired.copy(scratch.dock).sub(sim.shipPosition);
        const distance = scratch.desired.length();
        if (distance < DOCK_RANGE) {
          sim.docked = sim.target;
          sim.target = null;
          if (sim.docked) onDock(sim.docked);
        } else {
          scratch.desired.normalize();
          scratch.local.copy(scratch.desired).applyQuaternion(scratch.inverse.copy(sim.shipQuaternion).invert());
          const yawError = Math.atan2(scratch.local.x, scratch.local.z);
          const pitchError = Math.asin(THREE.MathUtils.clamp(scratch.local.y, -1, 1));
          const aligned = Math.abs(yawError) < 0.22 && Math.abs(pitchError) < 0.22;
          yaw = THREE.MathUtils.clamp(yawError * 2, -1, 1);
          pitch = THREE.MathUtils.clamp(pitchError * 2, -1, 1);
          roll = 0;
          boosting = aligned && distance > 34;
          thrust = aligned ? 1 : 0.45;
          if (distance < 46) thrust *= THREE.MathUtils.clamp(distance / 46, 0.3, 1);
        }
      }
    }

    scratch.euler.set(-pitch * TURN * delta, yaw * TURN * delta, roll * TURN * 1.3 * delta, "YXZ");
    scratch.delta.setFromEuler(scratch.euler);
    sim.shipQuaternion.multiply(scratch.delta).normalize();

    scratch.forward.copy(FORWARD).applyQuaternion(sim.shipQuaternion);
    const speedCap = boosting ? BOOST_SPEED : MAX_SPEED;

    if (thrust !== 0) {
      velocity.current.addScaledVector(scratch.forward, thrust * (boosting ? BOOST_ACCEL : ACCEL) * delta);
    }
    if (flightInput.brake) {
      // Retro-thrusters: burn directly against the velocity vector.
      velocity.current.addScaledVector(velocity.current, -4.5 * delta);
    }

    // Gravity wells: every planet pulls with inverse-square falloff.
    scratch.gravity.set(0, 0, 0);
    if (!docked) {
      for (const def of planets) {
        const planetPos = sim.positions.get(def.id);
        if (!planetPos) continue;
        scratch.pull.copy(planetPos).sub(sim.shipPosition);
        const distSq = Math.max(scratch.pull.lengthSq(), (def.radius * 3) ** 2);
        const strength = Math.min((GRAVITY_G * def.radius) / distSq, GRAVITY_BODY_CAP);
        scratch.gravity.addScaledVector(scratch.pull.normalize(), strength);
      }
      if (scratch.gravity.length() > GRAVITY_TOTAL_CAP) scratch.gravity.setLength(GRAVITY_TOTAL_CAP);
      velocity.current.addScaledVector(scratch.gravity, delta);
    }

    // Near-vacuum: the hull keeps gliding until something burns against it.
    const drag = flightInput.brake ? 6 : boosting ? BOOST_DRAG : DRAG;
    velocity.current.multiplyScalar(Math.exp(-drag * delta));
    if (velocity.current.length() > speedCap) velocity.current.setLength(speedCap);

    sim.shipPosition.addScaledVector(velocity.current, delta);

    if (docked) {
      const def = planetById(docked);
      const position = sim.positions.get(docked);
      if (position) {
        dockPoint(def, position, sim.shipPosition, scratch.dock);
        sim.shipPosition.lerp(scratch.dock, 1 - Math.exp(-2.4 * delta));
        velocity.current.multiplyScalar(Math.exp(-6 * delta));
      }
    }

    if (sim.shipPosition.length() > UNIVERSE_RADIUS) {
      sim.shipPosition.setLength(UNIVERSE_RADIUS);
      velocity.current.multiplyScalar(0.4);
    }

    body.position.copy(sim.shipPosition);
    body.quaternion.copy(sim.shipQuaternion);
    sim.shipSpeed = velocity.current.length();
    sim.climb = velocity.current.y;
    sim.boosting = boosting;
    sim.heading = (Math.atan2(scratch.forward.x, scratch.forward.z) * 180) / Math.PI;

    if (hull.current) {
      const bankTarget = THREE.MathUtils.clamp(-yaw * 0.55, -0.65, 0.65);
      hull.current.rotation.z += (bankTarget - hull.current.rotation.z) * Math.min(1, delta * 5);
      const pitchTarget = THREE.MathUtils.clamp(-pitch * 0.2, -0.35, 0.35);
      hull.current.rotation.x += (pitchTarget - hull.current.rotation.x) * Math.min(1, delta * 5);
    }

    const throttle = Math.min(1.4, sim.shipSpeed / 34);
    if (exhaust.current) {
      exhaust.current.scale.set(1, 0.35 + throttle + (boosting ? 1.5 : 0), 1);
    }
    const glow = 0.35 + Math.min(0.55, sim.shipSpeed / 95);
    if (engineGlows.current) {
      for (const sprite of engineGlows.current.children) {
        (sprite as THREE.Sprite).material.opacity = glow;
      }
    }

    // Wingtip strobes: port red, starboard green, alternating blink.
    const blink = Math.sin(state.clock.elapsedTime * 5) > 0;
    for (const [ref, on] of [[navLeft, blink], [navRight, !blink]] as const) {
      const mesh = ref.current;
      if (mesh) (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 2.6 : 0.15;
    }
  }, -1);

  return (
    <group ref={group} scale={SHIP_SCALE}>
      <group ref={hull}>
        {/* Needle fuselage: sharp nose forward, twin-engine tail. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1]}>
          <cylinderGeometry args={[0.12, 0.85, 7, 24]} />
          <meshStandardMaterial color={HULL} metalness={0.85} roughness={0.32} />
        </mesh>
        {/* Engine housing block. */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -3.5]}>
          <cylinderGeometry args={[0.95, 1.05, 2.5, 16]} />
          <meshStandardMaterial color={DARK} metalness={0.85} roughness={0.4} />
        </mesh>
        {/* Glass canopy. */}
        <mesh position={[0, 0.75, 1.2]} scale={[0.55, 0.5, 1.4]}>
          <sphereGeometry args={[0.62, 24, 18]} />
          <meshStandardMaterial color="#0d2233" emissive="#5fd8ff" emissiveIntensity={0.9} metalness={0.5} roughness={0.12} />
        </mesh>
        {/* Dorsal spine. */}
        <mesh position={[0, 0.72, -2.2]}>
          <boxGeometry args={[0.3, 0.5, 3.2]} />
          <meshStandardMaterial color={DARK} metalness={0.8} roughness={0.5} />
        </mesh>
        {/* Swept wings with glowing leading edges. */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 2.6, 0, -1.6]} rotation={[0, -side * 0.5, -side * 0.08]}>
            <mesh>
              <boxGeometry args={[4.2, 0.12, 2.6]} />
              <meshStandardMaterial color={HULL} metalness={0.85} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.02, 1.32]}>
              <boxGeometry args={[4.2, 0.05, 0.08]} />
              <meshStandardMaterial color="#06202c" emissive={ACCENT} emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
            <mesh position={[side * 1.9, 0, -0.4]}>
              <boxGeometry args={[0.5, 0.1, 1.4]} />
              <meshStandardMaterial color={DARK} metalness={0.8} roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* Vertical stabilizer. */}
        <mesh position={[0, 1.2, -3.4]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.12, 1.8, 1.6]} />
          <meshStandardMaterial color={HULL} metalness={0.85} roughness={0.35} />
        </mesh>
        {/* Twin engines with lit throats. */}
        {[-0.95, 0.95].map((x) => (
          <group key={x} position={[x, 0, -5.2]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.62, 1.6, 16]} />
              <meshStandardMaterial color="#22262e" metalness={0.9} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, -0.85]} rotation={[0, Math.PI, 0]}>
              <circleGeometry args={[0.46, 20]} />
              <meshStandardMaterial color="#2a1200" emissive="#ff9a3c" emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          </group>
        ))}
        {/* Nose tip light. */}
        <mesh position={[0, 0, 4.6]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#002b12" emissive="#35e065" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* Wingtip strobes. */}
        <mesh ref={navLeft} position={[-4.6, 0, -2.7]}>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshStandardMaterial color="#330000" emissive="#ff3b30" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh ref={navRight} position={[4.6, 0, -2.7]}>
          <sphereGeometry args={[0.11, 8, 8]} />
          <meshStandardMaterial color="#002b12" emissive="#35e065" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>

      {/* Drive plume. */}
      <mesh ref={exhaust} position={[0, 0, -6.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.8, 3.5, 18, 1, true]} />
        <meshBasicMaterial
          color="#7fd8ff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group ref={engineGlows}>
        {[-0.95, 0.95].map((x) => (
          <sprite key={x} position={[x, 0, -6.2]} scale={[2.6, 2.6, 1]}>
            <spriteMaterial map={glowMap} color="#69d8ff" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        ))}
      </group>

      <pointLight position={[0, 0, -6.2]} color="#6fd4ff" intensity={20} distance={30} decay={2} />
    </group>
  );
}
