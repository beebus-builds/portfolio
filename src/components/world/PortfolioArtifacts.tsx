"use client";

import { Html, Line, Text } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

type Artifact = {
  id: string;
  chapter: string;
  title: string;
  type: string;
  detail: string;
  tech: string;
  color: string;
  position: [number, number, number];
  href?: string;
};

const ARTIFACTS: Artifact[] = [
  { id: "portfolio", chapter: "THE BUILDING", title: "PORTFOLIO / STORY.EXE", type: "LIVE SYSTEM", detail: "This world is itself a shipped experiment: a narrative 3D portfolio built around chapters, discoveries and interactive systems.", tech: "Next.js · React · Three.js", color: "#ffd700", position: [3.4, 1.3, 14], href: "https://github.com/beebus-builds/portfolio" },
  { id: "gyan-sathi", chapter: "THE BUILDING", title: "GYAN SATHI", type: "EDUCATION SYSTEM", detail: "A Next.js learning platform focused on structured study, generated datasets and evaluation workflows.", tech: "Next.js · React · TypeScript", color: "#54e6d4", position: [7.1, 1.9, 15.6], href: "https://github.com/beebus-builds/gyan-sathi" },
  { id: "pharma-connect", chapter: "THE BUILDING", title: "PHARMA CONNECT", type: "FULL-STACK EXPERIMENT", detail: "A pharmacy-focused product experience exploring the systems needed around patient-to-pharmacy workflows.", tech: "Web · Product · Systems", color: "#b8ff4d", position: [3.2, 2.9, 17.1], href: "https://github.com/beebus-builds/pharma_connect" },
  { id: "alt-fixes", chapter: "THE TOOLKIT", title: "ALT-FIXES", type: "OPEN SOURCE TOOL", detail: "A project for making image accessibility metadata easier to manage and automate with image understanding.", tech: "JavaScript · AI · Accessibility", color: "#22c55e", position: [-7.2, 2.2, 21.2], href: "https://github.com/beebus-builds/alt-fixes" },
  { id: "automated-posts", chapter: "THE TOOLKIT", title: "AUTOMATED POSTS", type: "AUTOMATION", detail: "An automation project built around generating and publishing social content as a repeatable system.", tech: "Automation · APIs · Web", color: "#22c55e", position: [-3.1, 2.7, 22.9], href: "https://github.com/beebus-builds/Automated-Posts" },
  { id: "image-optimization", chapter: "THE FAILURE", title: "IMAGE OPTIMIZATION", type: "PERFORMANCE EXPERIMENT", detail: "An experiment focused on reducing image weight and turning optimization into a repeatable engineering system.", tech: "Optimization · Web Performance", color: "#ff4af0", position: [-8.1, 1.8, -0.2], href: "https://github.com/beebus-builds/saas-for-image-optimization" },
];

function ArtifactNode({ artifact, active, onSelect }: { artifact: Artifact; active: boolean; onSelect: (artifact: Artifact) => void }) {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.y = t * (active ? 0.9 : 0.45);
    ref.current.rotation.z = Math.sin(t * 0.6 + artifact.position[0]) * 0.08;
    ref.current.position.y = artifact.position[1] + Math.sin(t * 1.2 + artifact.position[0]) * (active ? 0.22 : 0.12);
    if (ring.current) {
      ring.current.rotation.x = t * 0.7;
      ring.current.rotation.y = t * -0.45;
      ring.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.12);
    }
  });

  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(artifact);
    window.dispatchEvent(new CustomEvent("bibash:artifact-selected", { detail: { id: artifact.id, title: artifact.title, color: artifact.color } }));
  };

  return (
    <group ref={ref} position={artifact.position} onClick={select}>
      <mesh>
        <icosahedronGeometry args={[active ? 0.38 : 0.28, 1]} />
        <meshStandardMaterial color={artifact.color} emissive={artifact.color} emissiveIntensity={active ? 4 : 2.2} toneMapped={false} metalness={0.55} roughness={0.25} />
      </mesh>
      <mesh ref={ring} scale={1.7}>
        <torusGeometry args={[0.38, 0.012, 8, 32]} />
        <meshBasicMaterial color={artifact.color} transparent opacity={active ? 0.75 : 0.3} toneMapped={false} />
      </mesh>
      <mesh scale={1.9}>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshBasicMaterial color={artifact.color} transparent opacity={active ? 0.16 : 0.06} wireframe />
      </mesh>
      <Text position={[0, 0.72, 0]} fontSize={0.105} color={artifact.color} anchorX="center" maxWidth={2.3} textAlign="center">{artifact.title}</Text>
      <Text position={[0, 0.47, 0]} fontSize={0.065} color="#ffffff" anchorX="center" fillOpacity={active ? 0.8 : 0.45}>{active ? "SIGNAL LOCKED · ENTER" : artifact.type}</Text>
    </group>
  );
}

function ArtifactPanel({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  return (
    <Html fullscreen zIndexRange={[70, 80]}>
      <div className="pointer-events-auto fixed inset-0 grid place-items-center bg-black/55 p-5 backdrop-blur-[3px]" onClick={onClose}>
        <div className="w-full max-w-lg border border-white/10 bg-[#070710]/95 p-6 font-mono shadow-[0_0_90px_rgba(0,0,0,.7)]" style={{ boxShadow: `0 0 90px ${artifact.color}18` }} onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div><div className="text-[9px] tracking-[.28em]" style={{ color: artifact.color }}>{artifact.chapter}</div><div className="mt-2 text-xl font-bold tracking-[-.04em] text-white">{artifact.title}</div></div>
            <button onClick={onClose} className="text-xs text-white/35 hover:text-white">ESC</button>
          </div>
          <div className="mb-4 flex items-center gap-2 text-[9px] tracking-[.2em]" style={{ color: artifact.color }}><span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: artifact.color }} />{artifact.type} · EVIDENCE UNLOCKED</div>
          <p className="text-sm leading-7 text-white/65">{artifact.detail}</p>
          <div className="mt-5 border-t border-white/10 pt-4 text-[10px] text-white/35">{artifact.tech}</div>
          {artifact.href && <a href={artifact.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-xs" style={{ color: artifact.color }}>OPEN SOURCE EVIDENCE →</a>}
        </div>
      </div>
    </Html>
  );
}

export default function PortfolioArtifacts({ discovered }: { discovered: string[] }) {
  const [selected, setSelected] = useState<Artifact | null>(null);
  const visible = useMemo(() => ARTIFACTS.filter((artifact) => {
    if (artifact.chapter === "THE BUILDING") return discovered.includes("projects");
    if (artifact.chapter === "THE TOOLKIT") return discovered.includes("skills");
    if (artifact.chapter === "THE FAILURE") return discovered.includes("blog");
    return true;
  }), [discovered]);

  const links = visible.map((artifact, index) => visible[index + 1] ? [artifact.position, visible[index + 1].position] : null).filter(Boolean) as [Artifact["position"], Artifact["position"]][];

  return (
    <group>
      {links.map(([a, b], index) => <Line key={`link-${index}`} points={[a, b]} color="#ffffff" transparent opacity={0.07} lineWidth={0.7} dashed dashSize={0.08} dashScale={2} />)}
      {visible.map((artifact) => <ArtifactNode key={artifact.id} artifact={artifact} active={selected?.id === artifact.id} onSelect={setSelected} />)}
      {selected && <ArtifactPanel artifact={selected} onClose={() => setSelected(null)} />}
    </group>
  );
}
