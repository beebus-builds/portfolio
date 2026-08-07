"use client";

import PageShell from "@/components/PageShell";
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

export default function CommandsPage() {
  const t = useTerminal({ pageRoutes: PAGE_ROUTES });

  return (
    <PageShell title="Command Playground" subtitle="Type a command and press Enter.">
      <div className="mb-8 thread">
        <div className="section-accent" />
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          An interactive terminal you can actually play with. Try <span className="text-neon-400">help</span>,{" "}
          <span className="text-neon-400">ls</span>, <span className="text-neon-400">sudo</span>,{" "}
          <span className="text-neon-400">hack</span>, <span className="text-neon-400">scan</span>, or{" "}
          <span className="text-neon-400">cmatrix</span>. Use ↑/↓ for history, ctrl+c to interrupt.
        </p>
      </div>

      <div className="neon-card border border-white/5 rounded-xl bg-terminal-900/80 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
          <span className="ml-3 text-[10px] font-mono text-white/20">commands.bibash.dev</span>
        </div>

        <div ref={t.containerRef} className="p-4 space-y-2 max-h-96 overflow-y-auto" style={{ fontFamily: "'Anonymous Pro', 'Courier New', monospace" }}>
          {t.lines.length === 0 && (
            <p className="text-sm text-white/20">Type a command to get started. Try <span className="text-neon-400">help</span>.</p>
          )}
          {t.lines.map((line) => (
            <div key={line.id}>
              {line.type === "input" ? (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-neon-400 text-sm">{t.prompt}</span>
                  <span className="text-white text-sm break-all"> {line.content}</span>
                </div>
              ) : (
                line.results?.map((result, i) => (
                  result.text !== "" && (
                    <pre key={i} className="text-sm whitespace-pre-wrap pl-6" style={{ color: result.color || "var(--color-terminal-text)" }}>
                      {result.text}
                    </pre>
                  )
                ))
              )}
            </div>
          ))}

          {t.ask && (
            <div className="flex items-center gap-2">
              <span className="text-neon-400 text-sm">{t.prompt}</span>
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
        </div>

        {(
          <form onSubmit={(e) => { e.preventDefault(); t.runCommand(t.input); }} className="flex items-center gap-2 px-4 py-3 border-t border-white/5">
            <span className="text-neon-400 text-sm">{t.prompt}</span>
            <input
              type="text"
              value={t.input}
              onChange={t.handleInputChange}
              onKeyDown={t.handleKeyDown}
              className="flex-1 bg-transparent text-white text-sm font-mono outline-none placeholder:text-white/15"
              placeholder="type a command..."
              autoFocus
            />
            {t.isBusy && <span className="text-[10px] text-white/20 font-mono shrink-0">[busy — ctrl+c]</span>}
          </form>
        )}
      </div>
    </PageShell>
  );
}
