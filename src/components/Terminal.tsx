"use client";

import { useEffect, useMemo, useState } from "react";
import { getBanner } from "@/lib/commands";
import { useTerminal } from "@/hooks/useTerminal";
import MatrixRain from "@/components/MatrixRain";

const PAGE_ROUTES: Record<string, string> = {
  about: "/about",
  projects: "/projects",
  skills: "/skills",
  contact: "/contact",
  education: "/education",
  nepal: "/nepal",
  namaste: "/namaste",
  whoami: "/whoami",
};

export default function Terminal() {
  const [pulseGlow, setPulseGlow] = useState(false);
  const [gridOffset, setGridOffset] = useState(0);
  const [time, setTime] = useState("");

  const t = useTerminal({ pageRoutes: PAGE_ROUTES });

  const bootLines = useMemo(() => [
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "#4af0ff" },
    { text: "  DEVVERSECORE v2.7.1", color: "#4af0ff" },
    { text: "  INTERACTIVE PORTFOLIO PROTOCOL", color: "#4af0ff" },
    { text: "  [ AUTH ] root@bibashpoudel — key: ▌▌▌▌▌▌▌▌▌▌", color: "#00ff41" },
    { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "#4af0ff" },
    { text: "", color: "white" },
  ], []);

  // ─── Boot sequence ─────────────────────────────────────────

  useEffect(() => {
    t.setBooted(false);
    t.addOutput(bootLines);

    const timers = [
      window.setTimeout(() => t.addOutput([{ text: " ⚡ Initializing kernel... OK", color: "#00ff41" }]), 200),
      window.setTimeout(() => t.addOutput([{ text: " ⚡ Decrypting modules... OK", color: "#00ff41" }]), 500),
      window.setTimeout(() => t.addOutput([{ text: " ⚡ Bypassing firewall [::1:0]... OK", color: "#00ff41" }]), 800),
      window.setTimeout(() => t.addOutput([{ text: " ⚡ Injecting Nepali dev payload... OK", color: "#00ff41" }]), 1100),
      window.setTimeout(() => t.addOutput([
        { text: " ✓ ACCESS GRANTED — welcome, visitor.", color: "#00ff41" },
        { text: "", color: "white" },
      ]), 1400),
      window.setTimeout(async () => {
        const bannerResults = await getBanner();
        t.addOutput(bannerResults);
        t.setBooted(true);
        window.setTimeout(() => t.inputRef.current?.focus(), 50);
      }, 1900),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Grid scroll animation ─────────────────────────────────

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGridOffset((prev) => (prev + 0.3) % 100);
    }, 50);
    return () => window.clearInterval(interval);
  }, []);

  // ─── Pulse glow periodically ────────────────────────────────

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulseGlow(true);
      window.setTimeout(() => setPulseGlow(false), 600);
    }, 4000 + Math.random() * 3000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu" }));
    const interval = window.setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kathmandu" }));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-terminal-900 overflow-hidden">
      {/* Matrix rain background */}
      <MatrixRain density={1.2} className="opacity-70" />

      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-neon-400/5 blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/3 blur-[180px]" />

      {/* Animated grid overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(74, 240, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 240, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          transform: `translateY(${gridOffset}px)`,
        }}
      />

      {/* Scanlines */}
      <div className="scanlines fixed inset-0 pointer-events-none z-50" />

      {/* Terminal panel */}
      <div
        className="dark-surface relative z-10 w-full max-w-4xl mx-3 h-[calc(100vh-32px)] md:h-[calc(100vh-48px)] flex flex-col rounded-xl overflow-hidden transition-all duration-700"
        style={{
          boxShadow: pulseGlow
            ? "0 0 40px rgba(74, 240, 255, 0.15), 0 0 80px rgba(74, 240, 255, 0.05), inset 0 0 40px rgba(74, 240, 255, 0.03)"
            : "0 0 20px rgba(74, 240, 255, 0.06), inset 0 0 20px rgba(74, 240, 255, 0.02)",
          borderColor: pulseGlow ? "rgba(74, 240, 255, 0.3)" : "rgba(74, 240, 255, 0.1)",
          borderWidth: 1,
          borderStyle: "solid",
          background: "linear-gradient(135deg, rgba(10, 10, 30, 0.97), rgba(15, 15, 42, 0.97))",
        }}
      >
        {/* Title bar */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/5"
          style={{ background: "linear-gradient(90deg, rgba(74, 240, 255, 0.05), transparent, rgba(74, 240, 255, 0.03))" }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[12px] font-mono tracking-wider text-white/25 select-none">
              <span className="text-green-400/60">▮▮▮</span> Nepal Dev Terminal — <span className="text-neon-400/50">bibashpoudel</span><span className="text-white/15">@portfolio</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {t.booted && <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />}
            <div className="w-[60px]" />
          </div>
        </div>

        {/* Output */}
        <div
          ref={t.containerRef}
          className="flex-1 overflow-y-auto px-5 py-4 cursor-text"
          onClick={() => { if (!t.mailForm.visible && !t.ask) t.inputRef.current?.focus(); }}
        >
          {t.lines.map((line) => (
            <div key={line.id} className="terminal-line mb-0.5">
              {line.type === "input" ? (
                <div className="flex items-start gap-2">
                  <span className="text-neon-400 shrink-0 text-sm glow-neon">{t.prompt}</span>
                  <span className="text-white/90 text-sm break-all">{line.content}</span>
                </div>
              ) : (
                line.results?.map((result, i) => (
                  result.text !== "" && (
                    <div key={i} className="text-sm leading-relaxed whitespace-pre-wrap font-bold" style={{ color: result.color || "inherit" }}>
                      {result.text}
                    </div>
                  )
                ))
              )}
            </div>
          ))}

          {t.ask && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-neon-400 shrink-0 text-sm glow-neon">{t.prompt}</span>
              <span className="text-sm font-mono text-white/70 whitespace-pre-wrap">{t.ask.prompt}</span>
              <span className="text-sm font-mono text-white/90">{t.ask.masked ? "•".repeat(t.askInput.length) : t.askInput}</span>
              <span className="caret-blink text-neon-400 text-sm">▊</span>
              <input
                ref={t.askInputRef}
                type={t.ask.masked ? "password" : "text"}
                value={t.askInput}
                onChange={(e) => t.setAskInput(e.target.value)}
                onKeyDown={t.handleAskKeyDown}
                className="w-0 h-0 opacity-0"
                autoFocus
              />
            </div>
          )}

          {t.mailForm.visible && !t.mailForm.sent && (
            <div className="border border-neon-400/20 rounded-lg p-4 mt-2 mb-2" style={{ background: "rgba(10, 10, 30, 0.95)" }}>
              <div className="text-neon-400 font-mono text-xs mb-3 tracking-wider">✉ Compose Message</div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2"><span className="text-white/40 font-mono text-xs w-16 shrink-0">To:</span><span className="text-white font-mono text-sm">{t.mailForm.to}</span></div>
                <div className="flex items-center gap-2"><span className="text-white/40 font-mono text-xs w-16 shrink-0">Subject:</span><span className="text-white font-mono text-sm">{t.mailForm.subject || "(no subject)"}</span></div>
                <textarea value={t.mailForm.message} onChange={(e) => t.setMailForm((p) => ({ ...p, message: e.target.value }))}
                  className="flex-1 bg-terminal-900 border border-white/10 rounded text-white font-mono text-sm p-2 outline-none focus:border-neon-400/40 resize-none h-24"
                  placeholder="Type your message..." autoFocus />
                <div className="flex justify-end gap-2 mt-1">
                  <button onClick={t.cancelMail}
                    className="px-3 py-1 text-xs font-mono text-white/40 border border-white/10 rounded hover:text-white/60 transition-all cursor-pointer">Cancel</button>
                  <button onClick={t.handleMailSend}
                    className="px-3 py-1 text-xs font-mono text-neon-400 border border-neon-400/40 rounded hover:bg-neon-400/10 transition-all cursor-pointer">Send</button>
                </div>
              </div>
            </div>
          )}

          {t.booted && !t.mailForm.visible && !t.ask && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-neon-400 shrink-0 text-sm glow-neon">{t.prompt}</span>
              <div className="relative flex-1 min-w-0">
                {t.suggestion && !t.input.endsWith(" ") && (
                  <span className="absolute left-0 top-0 text-sm text-white/10 pointer-events-none font-mono">{t.input}{t.suggestion.slice(t.input.trim().length)}</span>
                )}
                <input ref={t.inputRef} type="text" value={t.input} onChange={t.handleInputChange} onKeyDown={t.handleKeyDown}
                  className="w-full bg-transparent border-none outline-none text-white/90 text-sm font-mono caret-neon-400" spellCheck={false} autoComplete="off" />
              </div>
              {t.isBusy && <span className="text-[10px] text-white/15 font-mono shrink-0">[busy — ctrl+c]</span>}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-1.5 border-t border-white/5"
          style={{ background: "linear-gradient(90deg, rgba(74, 240, 255, 0.03), transparent, rgba(74, 240, 255, 0.02))" }}
        >
          <span className="text-[11px] font-mono text-white/15 select-none">
            KTM · <span className="text-neon-400/30">{time}</span> NPT
          </span>
          <div className="flex items-center gap-3">
            {!t.booted && <span className="text-[11px] font-mono text-yellow-500/50">⟳ HACKING...</span>}
            {t.booted && <span className="text-[11px] font-mono text-green-500/50 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-500/60 animate-pulse" /> Secure</span>}
            <span className="text-[10px] font-mono text-white/10 select-none hidden sm:inline">
              Tab ↹ · ↑↓ · ctrl+c · Esc
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
