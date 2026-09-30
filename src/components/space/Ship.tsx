"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { flightInput } from "@/lib/flight";
import { DOCK_RANGE, UNIVERSE_RADIUS, dockPoint, planetById, type Simulation } from "@/lib/simulation";
import type { SectionId } from "@/lib/profile";
import { createGlowTexture } from "./textures";

const FORWARD = new THREE.Vector3(0, 0, 1);
const MAX_SPEED = 32;
const BOOST_SPEED = 78;
const ACCEL = 27;
const BOOST_ACCEL = 62;
const DRAG = 0.5;
const BOOST_DRAG = 0.3;
const TURN = 1.55;

type ShipProps = {
  sim: Simulation;
  onDock: (id: SectionId) => void;
  onRelease: () => void;
};

export default function Ship({ sim, onDock, onRelease }: ShipProps) {
  const group = useRef<THREE.Group>(null);
  const hull = useRef<THREE.Group>(null);
  const exhaust = useRef<THREE.Mesh>(null);
  const leftGlow = useRef<THREE.Sprite>(null);
  const rightGlow = useRef<THREE.Sprite>(null);

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
    }),
    []
  );

  useFrame((_, rawDelta) => {
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
      velocity.current.addScaledVector(velocity.current, -3.2 * delta);
    }

    const drag = flightInput.brake ? 5.2 : boosting ? BOOST_DRAG : DRAG;
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
    sim.boosting = boosting;
    sim.heading = (Math.atan2(scratch.forward.x, scratch.forward.z) * 180) / Math.PI;

    if (hull.current) {
      const bankTarget = THREE.MathUtils.clamp(-yaw * 0.55, -0.65, 0.65);
      hull.current.rotation.z += (bankTarget - hull.current.rotation.z) * Math.min(1, delta * 5);
      const pitchTarget = THREE.MathUtils.clamp(-pitch * 0.2, -0.35, 0.35);
      hull.current.rotation.x += (pitchTarget - hull.current.rotation.x) * Math.min(1, delta * 5);
    }

    const throttle = Math.min(1.4, sim.shipSpeed / 26);
    if (exhaust.current) {
      exhaust.current.scale.set(1, 0.35 + throttle + (boosting ? 1.5 : 0), 1);
    }
    const glow = 0.3 + Math.min(0.5, sim.shipSpeed / 70);
    if (leftGlow.current) (leftGlow.current.material as THREE.SpriteMaterial).opacity = glow;
    if (rightGlow.current) (rightGlow.current.material as THREE.SpriteMaterial).opacity = glow;
  }, -1);

  return (
    <group ref={group}>
      <group ref={hull}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.34, 0.5, 3.5, 20]} />
          <meshStandardMaterial color="#c9d3e2" metalness={0.85} roughness={0.32} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1.9]}>
          <coneGeometry args={[0.34, 1.3, 20]} />
          <meshStandardMaterial color="#e3ecf7" metalness={0.8} roughness={0.24} />
        </mesh>
        <mesh position={[0, 0.3, 0.75]} scale={[0.7, 0.5, 1.15]}>
          <sphereGeometry args={[0.42, 20, 16]} />
          <meshStandardMaterial color="#0d2233" emissive="#5fd8ff" emissiveIntensity={0.85} metalness={0.5} roughness={0.12} />
        </mesh>
        <mesh position={[-1.5, -0.05, -0.35]} rotation={[0, 0, 0.42]}>
          <boxGeometry args={[2.3, 0.09, 0.9]} />
          <meshStandardMaterial color="#5b6b80" metalness={0.78} roughness={0.4} />
        </mesh>
        <mesh position={[1.5, -0.05, -0.35]} rotation={[0, 0, -0.42]}>
          <boxGeometry args={[2.3, 0.09, 0.9]} />
          <meshStandardMaterial color="#5b6b80" metalness={0.78} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.62, -1.1]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.08, 0.95, 1.1]} />
          <meshStandardMaterial color="#48586c" metalness={0.8} roughness={0.45} />
        </mesh>
        {[-0.95, 0.95].map((x) => (
          <group key={x} position={[x, -0.05, -1.5]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.24, 0.28, 1.5, 16]} />
              <meshStandardMaterial color="#8e9cb0" metalness={0.9} roughness={0.28} />
            </mesh>
            <mesh position={[0, 0, 0.78]}>
              <torusGeometry args={[0.21, 0.05, 8, 20]} />
              <meshStandardMaterial color="#ffb066" emissive="#ff8a3c" emissiveIntensity={1.6} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.42, 0.42, -1.2]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#ff5f6d" toneMapped={false} />
        </mesh>
        <mesh position={[0.42, 0.42, -1.2]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#5fff9d" toneMapped={false} />
        </mesh>
      </group>

      <mesh ref={exhaust} position={[0, -0.05, -3.1]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.62, 2.6, 18, 1, true]} />
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

      <sprite ref={leftGlow} position={[-0.95, -0.05, -2.3]} scale={[1.6, 1.6, 1]}>
        <spriteMaterial map={glowMap} color="#69d8ff" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <sprite ref={rightGlow} position={[0.95, -0.05, -2.3]} scale={[1.6, 1.6, 1]}>
        <spriteMaterial map={glowMap} color="#69d8ff" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>

      <pointLight position={[0, 0, -2.4]} color="#6fd4ff" intensity={14} distance={26} decay={2} />
    </group>
  );
}
