"use client";

import { Html, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
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
  {
    id: "portfolio",
    chapter: "THE BUILDING",
    title: "PORTFOLIO / STORY.EXE",
    type: "LIVE SYSTEM",
    detail: "This world is itself a shipped experiment: a narrative 3D portfolio built around chapters, discoveries and interactive systems.",
    tech: "Next.js · React · Three.js",
    color: "#ffd700",
    position: [3.4, 1.3, 14],
    href: "https://github.com/beebus-builds/portfolio",
  },
  {
    id: "gyan-sathi",
    chapter: "THE BUILDING",
    title: "GYAN SATHI",
    type: "EDUCATION SYSTEM",
    detail: "A Next.js learning platform focused on structured study, generated datasets and evaluation workflows.",
    tech: "Next.js · React · TypeScript",
    color: "#54e6d4",
    position: [7.1, 1.9, 15.6],
    href: "https://github.com/beebus-builds/gyan-sathi",
  },
  {
    id: "pharma-connect",
    chapter: "THE BUILDING",
    title: "PHARMA CONNECT",
    type: "FULL-STACK EXPERIMENT",
    detail: "A project exploring a pharmacy-focused product experience and the systems needed around it.",
    tech: "Web · Product · Systems",
    color: "#b8ff4d",
    position: [3.2, 2.9, 17.1],
    href: "https://github.com/beebus-builds/pharma_connect",
  },
  {
    id: "alt-fixes",
    chapter: "THE TOOLKIT",
    title: "ALT-FIXES",
    type: "OPEN SOURCE TOOL",
    detail: "A dedicated project for making image accessibility metadata easier to manage and automate.",
    tech: "JavaScript · AI · Accessibility",
    color: "#22c55e",
    position: [-7.2, 2.2, 21.2],
    href: "https://github.com/beebus-builds/alt-fixes",
  },
  {
    id: "automated-posts",
    chapter: "THE TOOLKIT",
    title: "AUTOMATED POSTS",
    type: "AUTOMATION",
    detail: "A real automation project built around generating and publishing social content as a repeatable system.",
    tech: "Automation · APIs · Web",
    color: "#22c55e",
    position: [-3.1, 2.7, 22.9],
    href: "https://github.com/beebus-builds/Automated-Posts",
  },
  {
    id: "image-optimization",
    chapter: "THE FAILURE",
    title: "IMAGE OPTIMIZATION",
    type: "PERFORMANCE EXPERIMENT",
    detail: "A separate experiment focused on reducing image weight and making optimization a system rather than a one-off fix.",
    tech: "Optimization · Web Performance",
    color: "#ff4af0",
    position: [-8.1, 1.8, -0.2],
    href: "https://github.com/beebus-builds/saas-for-image-optimization",
  },
];

function ArtifactNode({ artifact, onSelect }: { artifact: Artifact; onSelect: (artifact: Artifact) => void }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.45;
    ref.current.position.y = artifact.position[1] + Math.sin(clock.elapsedTime * 1.2 + artifact.position[0]) * 0.12;
  });

  return (
    <group ref={ref} position={artifact.position} onClick={(event) => { event.stopPropagation(); onSelect(artifact); }}>
      <mesh>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial color={artifact.color} emissive={artifact.color} emissiveIntensity={2.2} toneMapped={false} metalness={0.55} roughness={0.25} />
      </mesh>
      <mesh scale={1.7}>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshBasicMaterial color={artifact.color} transparent opacity={0.08} wireframe />
      </mesh>
      <Text position={[0, 0.68, 0]} fontSize={0.105} color={artifact.color} anchorX="center" maxWidth={2.3} textAlign="center">
        {artifact.title}
      </Text>
      <Text position={[0, 0.43, 0]} fontSize={0.065} color="#ffffff" anchorX="center" fillOpacity={0.45}>
        {artifact.type}
      </Text>
    </group>
  );
}

function ArtifactPanel({ artifact, onClose }: { artifact: Artifact; onClose: () => void }) {
  return (
    <Html fullscreen zIndexRange={[70, 80]}>
      <div className="pointer-events-auto fixed inset-0 grid place-items-center bg-black/45 p-5 backdrop-blur-[2px]" onClick={onClose}>
        <div className="w-full max-w-lg border border-white/10 bg-[#070710]/95 p-6 font-mono shadow-[0_0_70px_rgba(0,0,0,.6)]" onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-[9px] tracking-[.28em]" style={{ color: artifact.color }}>{artifact.chapter}</div>
              <div className="mt-2 text-xl font-bold tracking-[-.04em] text-white">{artifact.title}</div>
            </div>
            <button onClick={onClose} className="text-xs text-white/35 hover:text-white">ESC</button>
          </div>
          <div className="mb-4 text-[9px] tracking-[.2em]" style={{ color: artifact.color }}>{artifact.type}</div>
          <p className="text-sm leading-7 text-white/60">{artifact.detail}</p>
          <div className="mt-5 border-t border-white/10 pt-4 text-[10px] text-white/35">{artifact.tech}</div>
          {artifact.href && (
            <a href={artifact.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-xs" style={{ color: artifact.color }}>
              OPEN SOURCE EVIDENCE →
            </a>
          )}
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

  return (
    <group>
      {visible.map((artifact) => <ArtifactNode key={artifact.id} artifact={artifact} onSelect={setSelected} />)}
      {selected && <ArtifactPanel artifact={selected} onClose={() => setSelected(null)} />}
    </group>
  );
}
