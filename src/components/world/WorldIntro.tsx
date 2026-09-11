"use client";

import { useEffect, useState } from "react";

const INTRO_KEY = "bibash-world-intro-seen-v2";

export default function WorldIntro({ onLaunch }: { onLaunch: () => void }) {
  const [open, setOpen] = useState(true);
  const [boot, setBoot] = useState(0);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(INTRO_KEY) === "1") setOpen(false);
    } catch { /* ignore storage failures */ }
    const timer = window.setInterval(() => setBoot((value) => Math.min(100, value + 4)), 45);
    return () => window.clearInterval(timer);
  }, []);

  if (!open) return null;

  const launch = () => {
    try { window.localStorage.setItem(INTRO_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    onLaunch();
  };

  return (
    <div className="world-intro" role="dialog" aria-modal="true" aria-label="The Journey introduction">
      <div className="world-intro-noise" /><div className="world-intro-grid" /><div className="world-intro-scanline" />
      <div className="world-intro-top"><span>BP / JOURNEY OS</span><span>BUILD 02.026</span><span>NEPAL // 27.7172° N</span></div>
      <main className="world-intro-main">
        <div className="world-intro-index">INTERACTIVE PORTFOLIO / 001</div>
        <h1><span>THE</span><strong>JOURNEY</strong></h1>
        <p className="world-intro-lead">This is not a portfolio you scroll through.<br />It is a world you move through.</p>
        <div className="world-intro-system">
          <div><span>MISSION</span><b>TRACE THE BUILDER</b></div>
          <div><span>INPUT</span><b>WASD / ARROWS / TOUCH</b></div>
          <div><span>OBJECTIVE</span><b>DISCOVER 06 CHAPTERS</b></div>
        </div>
        <button className="world-intro-launch" onClick={launch} disabled={boot < 100}><span>{boot < 100 ? `INITIALIZING ${boot}%` : "ENTER THE JOURNEY"}</span><i>↗</i></button>
        <p className="world-intro-hint">Your progress and hidden discoveries are saved locally.</p>
      </main>
      <div className="world-intro-corner world-intro-corner-a">SYSTEM ONLINE<br />RENDER / WEBGL<br />STORY ENGINE / READY</div>
      <div className="world-intro-corner world-intro-corner-b">01 — PERSON<br />02 — QUESTIONS<br />03 — FAILURE<br />04 — BUILDING<br />05 — TOOLKIT<br />06 — UNKNOWN</div>
      <style jsx>{`
        .world-intro{position:fixed;inset:0;z-index:999;overflow:hidden;background:#030406;color:#eef2ea;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;animation:wiIn .7s cubic-bezier(.2,.75,.2,1)}
        .world-intro-noise{position:absolute;inset:-50%;opacity:.055;background-image:radial-gradient(#fff .6px,transparent .6px);background-size:5px 5px;transform:rotate(2deg)}
        .world-intro-grid{position:absolute;inset:-10%;opacity:.18;background-image:linear-gradient(rgba(184,255,77,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(184,255,77,.08) 1px,transparent 1px);background-size:72px 72px;transform:perspective(800px) rotateX(58deg) scale(1.5);transform-origin:center bottom}
        .world-intro-scanline{position:absolute;left:0;right:0;top:-20%;height:22%;background:linear-gradient(transparent,rgba(184,255,77,.06),transparent);animation:wiScan 5s linear infinite;pointer-events:none}
        .world-intro:after{content:"";position:absolute;inset:18px;border:1px solid rgba(255,255,255,.08);pointer-events:none}
        .world-intro-top{position:absolute;left:42px;right:42px;top:32px;display:flex;justify-content:space-between;color:rgba(255,255,255,.35);font-size:9px;letter-spacing:.15em;z-index:2}
        .world-intro-main{position:absolute;left:clamp(30px,9vw,150px);top:50%;transform:translateY(-48%);max-width:1000px;z-index:2}
        .world-intro-index{color:#b8ff4d;font-size:9px;letter-spacing:.28em;margin-bottom:24px}
        .world-intro h1{margin:0;font-size:clamp(72px,15vw,220px);line-height:.76;letter-spacing:-.095em;font-weight:800}.world-intro h1 span{display:block;font-size:.31em;line-height:1;letter-spacing:.18em;color:rgba(255,255,255,.4);margin-left:.08em;margin-bottom:.2em}.world-intro h1 strong{display:block;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.72);text-shadow:0 0 80px rgba(184,255,77,.1)}
        .world-intro-lead{margin:32px 0 0;color:#9ca39d;font-size:clamp(14px,1.5vw,18px);line-height:1.55;letter-spacing:-.02em}
        .world-intro-system{display:grid;grid-template-columns:repeat(3,minmax(150px,1fr));gap:1px;margin-top:48px;width:min(760px,90vw);background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1)}.world-intro-system div{padding:15px 17px;background:rgba(3,4,6,.82)}.world-intro-system span{display:block;color:#59605a;font-size:8px;letter-spacing:.15em;margin-bottom:8px}.world-intro-system b{font-size:9px;font-weight:500;color:#d6dbd5;letter-spacing:.04em}
        .world-intro-launch{margin-top:28px;display:flex;align-items:center;gap:42px;border:1px solid #b8ff4d;background:#b8ff4d;color:#050605;padding:16px 19px;font:700 10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;cursor:pointer;transition:.3s transform,.3s box-shadow}.world-intro-launch i{font-size:18px;font-style:normal}.world-intro-launch:hover:not(:disabled){transform:translateY(-4px);box-shadow:0 18px 60px rgba(184,255,77,.2)}.world-intro-launch:disabled{opacity:.55;cursor:wait}
        .world-intro-hint{font-size:8px;color:#555c56;letter-spacing:.08em;margin-top:14px}.world-intro-corner{position:absolute;z-index:2;color:#525a54;font-size:8px;line-height:1.9;letter-spacing:.12em}.world-intro-corner-a{right:42px;bottom:42px;text-align:right}.world-intro-corner-b{left:42px;bottom:42px}
        @keyframes wiScan{to{transform:translateY(620%)}}@keyframes wiIn{from{opacity:0;transform:scale(1.02)}to{opacity:1;transform:none}}
        @media(max-width:700px){.world-intro-top{left:24px;right:24px}.world-intro-top span:nth-child(2){display:none}.world-intro-main{left:28px;right:28px}.world-intro-system{grid-template-columns:1fr}.world-intro-system div{padding:12px}.world-intro-corner-b{display:none}.world-intro-corner-a{right:28px;bottom:28px}.world-intro:after{inset:10px}}@media(prefers-reduced-motion:reduce){.world-intro,.world-intro-scanline{animation:none}}
      `}</style>
    </div>
  );
}
