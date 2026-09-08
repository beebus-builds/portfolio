"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const MESSAGES = [
  "You found me. Good. Keep exploring.",
  "Every landmark is a piece of the story.",
  "Some of the best work started as a weird idea.",
  "Try the terminal too. It knows things.",
  "Don't rush the unknown.",
];

type Props = { discovered: string[]; complete?: boolean };

export default function BibashBot({ discovered, complete = false }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(MESSAGES[0]);

  const status = useMemo(() => {
    if (complete) return "UNKNOWN CHAPTER UNLOCKED";
    if (discovered.length === 0) return "WAITING FOR THE FIRST DISCOVERY";
    return `MEMORY ${String(discovered.length).padStart(2, "0")} / 06 ONLINE`;
  }, [complete, discovered.length]);

  useEffect(() => {
    setMessage(MESSAGES[Math.min(discovered.length, MESSAGES.length - 1)]);
  }, [discovered.length]);

  return (
    <div style={{ position: "absolute", left: 22, bottom: 54, zIndex: 25, pointerEvents: "none", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      {open && (
        <div style={{ width: "min(310px, calc(100vw - 44px))", marginBottom: 10, padding: "13px 15px", border: "1px solid rgba(184,255,77,.28)", background: "rgba(4,5,4,.84)", backdropFilter: "blur(18px)", boxShadow: "0 18px 55px rgba(0,0,0,.4)", pointerEvents: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#b8ff4d", fontSize: 9, letterSpacing: ".14em" }}>
            <span>BIBASH // SYSTEM</span><span>● ONLINE</span>
          </div>
          <p style={{ margin: "9px 0 8px", color: "#eef1ea", fontSize: 12, lineHeight: 1.55 }}>{message}</p>
          <div style={{ color: "#6f776f", fontSize: 8, letterSpacing: ".08em" }}>{status}</div>
          <button onClick={() => setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])} style={{ marginTop: 10, padding: "7px 9px", border: "1px solid rgba(255,255,255,.13)", background: "transparent", color: "#9da49d", font: "inherit", fontSize: 8, letterSpacing: ".1em", cursor: "pointer" }}>TRANSMIT</button>
        </div>
      )}
      <button aria-expanded={open} aria-label="Open Bibash Bot" onClick={() => setOpen((value) => !value)} style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 9, padding: "7px 11px 7px 7px", border: "1px solid rgba(184,255,77,.3)", borderRadius: 999, background: "rgba(4,5,4,.72)", backdropFilter: "blur(14px)", color: "#b8ff4d", font: "inherit", fontSize: 8, letterSpacing: ".1em", cursor: "pointer", boxShadow: "0 12px 35px rgba(0,0,0,.3)" }}>
        <span style={{ position: "relative", width: 32, height: 32, display: "block", borderRadius: "50%", overflow: "hidden", background: "#101210", border: "1px solid rgba(184,255,77,.35)" }}>
          <Image src="/Bibash%20Bot.png" alt="Bibash Bot" fill sizes="32px" style={{ objectFit: "cover" }} />
        </span>
        <span>{open ? "CLOSE BOT" : "BIBASH BOT"}</span>
      </button>
    </div>
  );
}
