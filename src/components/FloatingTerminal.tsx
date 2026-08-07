"use client";

import { useCallback, useEffect, useState } from "react";
import { useTerminal } from "@/hooks/useTerminal";

const PAGE_ROUTES: Record<string, string> = {
  about: "/about",
  projects: "/projects",
  skills: "/skills",
  contact: "/contact",
  education: "/education",
  blog: "/blog",
  chess: "/chess",
  commands: "/commands",
};

export default function FloatingTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [booted, setBooted] = useState(false);

  const t = useTerminal({ pageRoutes: PAGE_ROUTES });

  // ─── Boot ─────────────────────────────────────────────────────

  useEffect(() => {
    t.addOutput([
      { text: "⚡ Floating terminal ready. Type `help` to start.", color: "#4af0ff" },
      { text: "", color: "white" },
    ]);
    setBooted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Open / close ─────────────────────────────────────────────

  const toggleOpen = useCallback(() => {
    if (isMinimized && !isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      window.setTimeout(() => t.inputRef.current?.focus(), 100);
    } else if (!isMinimized && isOpen) {
      setIsMinimized(true);
    } else {
      setIsOpen(false);
      setIsMinimized(true);
    }
  }, [isMinimized, isOpen, t.inputRef]);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (t.mailForm.visible) { t.cancelMail(); return; }
      if (isOpen && !isMinimized) { setIsMinimized(true); return; }
      return;
    }
    t.handleKeyDown(e);
  }, [t, isOpen, isMinimized]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 z-[100] w-12 h-12 rounded-full bg-neon-400/10 border border-neon-400/30 flex items-center justify-center hover:bg-neon-400/20 transition-all shadow-lg shadow-neon-400/10"
        title="Toggle terminal"
      >
        <span className="text-neon-400 text-lg glow-neon">{isMinimized ? ">_" : "×"}</span>
      </button>

      {/* Terminal panel */}
      {isOpen && (
        <div
          className="dark-surface fixed bottom-20 right-4 z-[100] w-[380px] max-w-[calc(100vw-32px)] h-[480px] max-h-[calc(100vh-120px)] flex flex-col rounded-xl overflow-hidden border transition-all duration-300"
          style={{
            borderColor: "rgba(74, 240, 255, 0.15)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(74,240,255,0.05)",
            background: "linear-gradient(135deg, rgba(10,10,30,0.98), rgba(15,15,42,0.98))",
          }}
        >
          {/* Title bar */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5"
            style={{ background: "linear-gradient(90deg, rgba(74,240,255,0.06), transparent)" }}
          >
            <span className="text-[10px] font-mono text-neon-400/60 tracking-wider">Floating Terminal</span>
            <div className="flex-1" />
            <span className="text-[9px] font-mono text-white/15">Esc minimises</span>
          </div>

          {/* Output */}
          <div
            ref={t.containerRef}
            className="flex-1 overflow-y-auto px-3 py-2 cursor-text"
            onClick={() => { if (!t.mailForm.visible && !t.ask) t.inputRef.current?.focus(); }}
          >
            {t.lines.map((line) => (
              <div key={line.id} className="terminal-line mb-0.5">
                {line.type === "input" ? (
                  <div className="flex items-start gap-1.5">
                    <span className="text-neon-400 shrink-0 text-xs glow-neon">{t.prompt}</span>
                    <span className="text-white/80 text-xs break-all">{line.content}</span>
                  </div>
                ) : (
                  line.results?.map((result, i) => (
                    result.text !== "" && (
                      <div key={i} className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: result.color || "inherit" }}>
                        {result.text}
                      </div>
                    )
                  ))
                )}
              </div>
            ))}

            {t.ask && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-neon-400 shrink-0 text-xs glow-neon">{t.prompt}</span>
                <span className="text-xs font-mono text-white/70 whitespace-pre-wrap">{t.ask.prompt}</span>
                <span className="text-xs font-mono text-white/90">{t.ask.masked ? "•".repeat(t.askInput.length) : t.askInput}</span>
                <span className="caret-blink text-neon-400 text-xs">▊</span>
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
              <div className="border border-neon-400/20 rounded p-2 mt-1 mb-1" style={{ background: "rgba(10,10,30,0.95)" }}>
                <div className="text-neon-400 font-mono text-[10px] mb-2">✉ Compose</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1"><span className="text-white/40 font-mono text-[10px] w-12 shrink-0">To:</span><span className="text-white font-mono text-xs">{t.mailForm.to}</span></div>
                  <div className="flex items-center gap-1"><span className="text-white/40 font-mono text-[10px] w-12 shrink-0">Subj:</span><span className="text-white font-mono text-xs">{t.mailForm.subject || "(none)"}</span></div>
                  <textarea value={t.mailForm.message} onChange={(e) => t.setMailForm((p) => ({ ...p, message: e.target.value }))}
                    className="bg-terminal-900 border border-white/10 rounded text-white font-mono text-xs p-1.5 outline-none focus:border-neon-400/40 resize-none h-16"
                    placeholder="Message..." autoFocus />
                  <div className="flex justify-end gap-1.5 mt-1">
                    <button onClick={t.cancelMail}
                      className="px-2 py-0.5 text-[10px] font-mono text-white/40 border border-white/10 rounded">Cancel</button>
                    <button onClick={t.handleMailSend}
                      className="px-2 py-0.5 text-[10px] font-mono text-neon-400 border border-neon-400/40 rounded">Send</button>
                  </div>
                </div>
              </div>
            )}

            {booted && !t.mailForm.visible && !t.ask && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-neon-400 shrink-0 text-xs glow-neon">{t.prompt}</span>
                <div className="relative flex-1 min-w-0">
                  {t.suggestion && !t.input.endsWith(" ") && (
                    <span className="absolute left-0 top-0 text-xs text-white/10 pointer-events-none font-mono">{t.input}{t.suggestion.slice(t.input.trim().length)}</span>
                  )}
                  <input ref={t.inputRef} type="text" value={t.input} onChange={t.handleInputChange} onKeyDown={handleInputKeyDown}
                    className="w-full bg-transparent border-none outline-none text-white/80 text-xs font-mono caret-neon-400" spellCheck={false} autoComplete="off" />
                </div>
              </div>
            )}
          </div>

          {/* Action bar */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 border-t border-white/5">
            <span className="text-[9px] font-mono text-white/10">
              {t.isBusy ? "[busy — ctrl+c]" : "help → commands · ask → NOVA"}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
