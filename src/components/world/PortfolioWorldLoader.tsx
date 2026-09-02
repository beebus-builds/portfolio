"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const PortfolioWorld = dynamic(() => import("./PortfolioWorld"), {
  ssr: false,
  loading: () => (
    <div className="world-loading">
      <div className="world-loading-bar">
        <span />
      </div>
      <p>booting world.exe…</p>
    </div>
  ),
});

const FALLBACK_LINKS = [
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/skills", label: "Skills" },
  { href: "/blog", label: "Notes" },
  { href: "/education", label: "Education" },
  { href: "/contact", label: "Contact" },
];

function supportsWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function PortfolioWorldLoader() {
  const [mode, setMode] = useState<"checking" | "world" | "fallback">("checking");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(reduced || !supportsWebGL() ? "fallback" : "world");
  }, []);

  if (mode === "checking") {
    return (
      <div className="world-loading">
        <div className="world-loading-bar">
          <span />
        </div>
        <p>booting world.exe…</p>
      </div>
    );
  }

  if (mode === "fallback") {
    return (
      <div className="world-fallback">
        <span className="world-hud-kicker">BIBASH POUDEL</span>
        <h1>Build. Better.</h1>
        <p>Web developer building interfaces, systems and digital products.</p>
        <nav>
          {FALLBACK_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label} →
            </Link>
          ))}
        </nav>
      </div>
    );
  }

  return <PortfolioWorld />;
}
