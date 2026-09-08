"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const COMMANDS: Record<string, string> = {
  help: "commands · about · projects · skills · education · notes · contact · resume · github · clear",
  commands: "help · about · projects · skills · education · notes · contact · resume · github · clear",
  about: "opening /about …",
  projects: "opening /projects …",
  skills: "opening /skills …",
  education: "opening /education …",
  notes: "opening /blog …",
  contact: "opening /contact …",
  resume: "opening resume.pdf …",
  github: "opening github.com/beebus-builds …",
};

const ROUTES: Record<string, string> = {
  about: "/about",
  projects: "/projects",
  skills: "/skills",
  education: "/education",
  notes: "/blog",
  contact: "/contact",
};

export default function DeveloperTerminal() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([
    "BIBASH // SYSTEM ONLINE",
    "type 'help' to inspect available commands",
  ]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const prompt = useMemo(() => `guest@bibash:~$ ${input}`, [input]);

  const execute = (event: FormEvent) => {
    event.preventDefault();
    const command = input.trim().toLowerCase();
    if (!command) return;

    if (command === "clear") {
      setHistory([]);
      setInput("");
      return;
    }

    if (command === "github") {
      setHistory((items) => [...items, prompt, COMMANDS.github]);
      setInput("");
      window.open("https://github.com/beebus-builds", "_blank", "noopener,noreferrer");
      return;
    }

    if (command === "resume") {
      setHistory((items) => [...items, prompt, COMMANDS.resume]);
      setInput("");
      window.open("/resume.pdf", "_blank", "noopener,noreferrer");
      return;
    }

    const response = COMMANDS[command];
    setHistory((items) => [...items, prompt, response ?? `command not found: ${command}`, response ? "" : "try 'help' for available commands"]);
    setInput("");

    if (ROUTES[command]) {
      window.setTimeout(() => router.push(ROUTES[command]), 260);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 top-[76px] z-[45] hidden sm:flex items-center gap-2 border border-white/10 bg-black/45 px-3 py-2 font-mono text-[9px] tracking-[.14em] text-white/45 backdrop-blur-xl transition hover:border-neon-400/40 hover:text-neon-400"
        aria-label="Open developer terminal"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-neon-400 shadow-[0_0_10px_rgba(184,255,77,.8)]" />
        TERMINAL <kbd className="ml-1 border border-white/10 px-1.5 py-0.5 text-[8px] text-white/25">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Developer terminal"
              className="w-full max-w-3xl overflow-hidden border border-white/10 bg-[#070807] shadow-[0_40px_120px_rgba(0,0,0,.7)]"
              initial={{ y: 20, scale: .98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: .98 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[.025] px-4 py-3">
                <div className="flex items-center gap-2 font-mono text-[9px] tracking-[.15em] text-white/35">
                  <span className="h-2 w-2 rounded-full bg-neon-400" />
                  BIBASH // DEVELOPER TERMINAL
                </div>
                <button type="button" onClick={() => setOpen(false)} className="font-mono text-[10px] text-white/30 hover:text-white">ESC</button>
              </div>

              <div className="max-h-[55vh] min-h-[280px] overflow-y-auto p-5 font-mono text-xs leading-7">
                {history.map((line, index) => (
                  <div key={`${line}-${index}`} className={line.startsWith("guest@") ? "text-neon-400" : line === "" ? "h-3" : "text-white/45"}>{line}</div>
                ))}
                <form onSubmit={execute} className="mt-1 flex items-center gap-2">
                  <span className="text-neon-400">guest@bibash:~$</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-white outline-none caret-neon-400"
                    autoComplete="off"
                    spellCheck={false}
                    aria-label="Terminal command"
                  />
                </form>
              </div>

              <div className="border-t border-white/10 px-4 py-3 font-mono text-[9px] tracking-wide text-white/25">
                <span className="text-neon-400/70">TIP</span> · try <button type="button" onClick={() => setInput("help")} className="text-white/45 hover:text-neon-400">help</button>, <button type="button" onClick={() => setInput("projects")} className="text-white/45 hover:text-neon-400">projects</button> or <button type="button" onClick={() => setInput("contact")} className="text-white/45 hover:text-neon-400">contact</button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
