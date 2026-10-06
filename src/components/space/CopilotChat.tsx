"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What does Bibash build?",
  "How do I contact him?",
  "What's his strongest skill?",
];

export default function CopilotChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "BP-07 online. Ask me anything about Bibash — his work, skills, or how to reach him." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(-12) }),
      });
      const data = await res.json().catch(() => null);
      const reply =
        res.ok && data?.reply
          ? data.reply
          : data?.error ?? "The co-pilot lost the signal. Try the contact planet instead.";
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "Signal lost. Try the contact planet instead." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="copilot__fab" onClick={() => setOpen((v) => !v)} aria-label="Open co-pilot chat">
        <span aria-hidden="true">◈</span> BP-07
      </button>
      <AnimatePresence>
        {open && (
          <motion.section
            className="copilot"
            role="dialog"
            aria-label="AI co-pilot chat"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18 } }}
          >
            <header className="copilot__head">
              <b>BP-07 · CO-PILOT</b>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat">
                ✕
              </button>
            </header>
            <div className="copilot__log" ref={scrollRef}>
              {messages.map((message, index) => (
                <p key={index} data-role={message.role}>
                  {message.content}
                </p>
              ))}
              {busy && <p data-role="assistant" className="copilot__typing">··· transmitting</p>}
            </div>
            {messages.length <= 2 && (
              <div className="copilot__suggest">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <form
              className="copilot__form"
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the co-pilot…"
                maxLength={500}
                aria-label="Message the co-pilot"
              />
              <button type="submit" disabled={busy}>
                Send
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
