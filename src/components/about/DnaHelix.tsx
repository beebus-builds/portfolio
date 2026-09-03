"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

/** Double-helix of code runes — your stack as DNA. */
function Helix({ count = 26 }: { count?: number }) {
  const group = useRef<THREE.Group>(null);
  const { left, right, rungs } = useMemo(() => {
    const left = new Float32Array(count * 3);
    const right = new Float32Array(count * 3);
    const rungs: { a: THREE.Vector3; b: THREE.Vector3 }[] = [];
    for (let i = 0; i < count; i++) {
      const y = (i - count / 2) * 0.34;
      const a = (i / count) * Math.PI * 4;
      const lx = Math.cos(a) * 1.1;
      const lz = Math.sin(a) * 1.1;
      left.set([lx, y, lz], i * 3);
      right.set([-lx, y, -lz], i * 3);
      rungs.push({ a: new THREE.Vector3(lx, y, lz), b: new THREE.Vector3(-lx, y, -lz) });
    }
    return { left, right, rungs };
  }, [count]);

  useFrame(({ clock, pointer }) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = clock.elapsedTime * 0.45 + pointer.x * 0.6;
    g.rotation.x = pointer.y * 0.25;
  });

  return (
    <group ref={group}>
      {[left, right].map((arr, k) => (
        <points key={k}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[arr, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.14}
            color={k === 0 ? "#b8ff4d" : "#4af0ff"}
            transparent
            opacity={0.95}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
      {rungs.map((r, i) => {
        const mid = r.a.clone().add(r.b).multiplyScalar(0.5);
        const len = r.a.distanceTo(r.b);
        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          r.b.clone().sub(r.a).normalize()
        );
        return (
          <mesh key={i} position={mid} quaternion={quat}>
            <cylinderGeometry args={[0.012, 0.012, len, 6]} />
            <meshBasicMaterial color={i % 2 ? "#b8ff4d" : "#ff4af0"} transparent opacity={0.35} />
          </mesh>
        );
      })}
      {/* core glow spine */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, count * 0.34, 12]} />
        <meshBasicMaterial color="#b8ff4d" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function DnaHelix() {
  return (
    <div className="term-window overflow-hidden">
      <div className="term-titlebar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-path">~/dna --stack-helix · drag to inspect</span>
      </div>
      <div style={{ height: 380, background: "radial-gradient(ellipse at 50% 50%, #0d1a16 0%, #05050a 65%)" }}>
        <Canvas camera={{ position: [0, 0.4, 6.5], fov: 50 }} dpr={[1, 1.75]}>
          <ambientLight intensity={0.6} />
          <pointLight position={[3, 3, 3]} intensity={18} color="#b8ff4d" />
          <pointLight position={[-3, -2, 2]} intensity={14} color="#4af0ff" />
          <Suspense fallback={null}>
            <Helix />
          </Suspense>
          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} />
        </Canvas>
      </div>
    </div>
  );
}
