"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const COMMANDS: Record<string, string> = {
  help: "Available: scan, status, map, reset, exit",
  scan: "Six chapters detected. One unknown remains.",
  status: "STORY.EXE stable // memories persisted // bot online",
  map: "01 PERSON · 02 QUESTIONS · 03 FAILURE · 04 BUILDING · 05 TOOLKIT · 06 UNKNOWN",
};

export default function SecretConsole({ discovered }: { discovered: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [output, setOutput] = useState("Type help to inspect the system.");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "`" && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const progress = useMemo(() => `${discovered.length}/6 MEMORIES`, [discovered.length]);

  if (!open) return null;

  const run = (command: string) => {
    const cmd = command.trim().toLowerCase();
    if (cmd === "exit") return setOpen(false);
    if (cmd === "reset") {
      try { window.localStorage.removeItem("bibash-story-discoveries"); } catch { /* ignore */ }
      setOutput("Memory cache cleared. Reload the world to restart the journey.");
      return;
    }
    if (cmd === "about") return router.push("/about");
    setOutput(COMMANDS[cmd] ?? `Unknown command: ${cmd}. Type help.`);
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "grid", placeItems: "center", padding: 24, background: "rgba(2,3,7,.78)", backdropFilter: "blur(9px)", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <div style={{ width: "min(720px, 100%)", border: "1px solid rgba(184,255,77,.25)", background: "rgba(4,7,5,.94)", boxShadow: "0 30px 100px rgba(0,0,0,.6)" }}>
        <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", justifyContent: "space-between", color: "#b8ff4d", fontSize: 9, letterSpacing: ".15em" }}><span>STORY // DEVELOPER CONSOLE</span><span>{progress}</span></div>
        <div style={{ minHeight: 170, padding: 18, color: "#c8d0c8", fontSize: 12, lineHeight: 1.7 }}>
          <div style={{ color: "#667066", fontSize: 9, marginBottom: 12 }}>SECRET INTERFACE / LOCAL SESSION</div>
          <div>{output}</div>
          <form onSubmit={(e) => { e.preventDefault(); run(value); setValue(""); }} style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <span style={{ color: "#b8ff4d" }}>&gt;</span>
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} aria-label="Developer console command" style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: "#f1f5ef", font: "inherit" }} placeholder="help" />
          </form>
        </div>
        <div style={{ padding: "9px 14px", borderTop: "1px solid rgba(255,255,255,.08)", color: "#4e564e", fontSize: 8 }}>PRESS ` TO TOGGLE · ESC TO CLOSE</div>
      </div>
    </div>
  );
}
