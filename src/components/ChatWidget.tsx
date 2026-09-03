"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { askAI, type AIAnswer } from "@/lib/ai/engine";

interface Message {
  id: number;
  role: "user" | "nova";
  text: string;
  source?: string;
  suggestions?: string[];
}

const GREETING: Message = {
  id: 0,
  role: "nova",
  text: "Hi! I'm Uvo, Bibash's AI. Ask me about his projects, skills, education, or Nepal.",
  suggestions: [
    "What projects has he built?",
    "What are his skills?",
    "Tell me about Nepal",
    "How do I contact him?",
  ],
};

const INITIAL_SUGGESTIONS = [
  "What projects has he built?",
  "What are his skills?",
  "Tell me about Nepal",
  "How do I contact him?",
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const idRef = useRef(1);
  const lastSpokenIdRef = useRef<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg &&
      lastMsg.role === "nova" &&
      lastMsg.id !== lastSpokenIdRef.current &&
      "speechSynthesis" in window
    ) {
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(lastMsg.text);
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.includes("Google") || 
          v.name.includes("Natural") || 
          v.name.includes("Microsoft")
        );
        
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.pitch = 0.95;
        utterance.rate = 0.95;
        
        window.speechSynthesis.speak(utterance);
        lastSpokenIdRef.current = lastMsg.id;
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", speak, { once: true });
      } else {
        speak();
      }
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, thinking, isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    setMessages((m) => (m.length ? m : [GREETING]));
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setMessages([]);
    setSuggestions(INITIAL_SUGGESTIONS);
  }, []);

  const handleSend = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).trim();
      if (!text || thinking) return;
      setInput("");
      setSuggestions([]);
      setMessages((m) => [...m, { id: idRef.current++, role: "user", text }]);
      setThinking(true);

      try {
        const answer: AIAnswer = await askAI(text);
        window.setTimeout(() => {
          setMessages((m) => [
            ...m,
            {
              id: idRef.current++,
              role: "nova",
              text: answer.text,
              source: answer.source,
              suggestions: answer.suggestions,
            },
          ]);
          setSuggestions(answer.suggestions);
          setThinking(false);
        }, 450);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: idRef.current++,
            role: "nova",
            text: "Something broke on my end — try again in a moment.",
          },
        ]);
        setThinking(false);
      }
    },
    [input, thinking]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSend();
      if (e.key === "Escape") close();
    },
    [handleSend, close]
  );

  return (
    <>
      {/* Floating button */}
      <button
        onClick={isOpen ? close : open}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full border-2 border-neon-400/50 flex items-center justify-center transition-all shadow-lg shadow-neon-400/20 overflow-hidden group hover:scale-105 active:scale-95"
        style={{ background: "rgba(74,240,255,0.08)" }}
        title={isOpen ? "Close AI chat" : "Chat with Uvo AI"}
        aria-label={isOpen ? "Close AI chat" : "Chat with Uvo AI"}
      >
        {isOpen ? (
          <div className="text-neon-400 text-3xl font-light">×</div>
        ) : (
          <Image
            src="/Bibash Bot.png"
            alt="Bibash"
            fill
            sizes="56px"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="dark-surface fixed bottom-24 right-6 z-[90] w-[360px] max-w-[calc(100vw-40px)] h-[480px] max-h-[calc(100vh-120px)] flex flex-col rounded-xl overflow-hidden border"
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
            <span className="text-neon-400 text-xs glow-neon">●</span>
            <span className="text-[10px] font-mono text-neon-400/70 tracking-wider">Uvo — trained on this site</span>
            <div className="flex-1" />
            <button onClick={close} className="text-white/30 hover:text-white text-xs font-mono" aria-label="Close chat">×</button>
          </div>

          {/* Messages */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <div key={msg.id} className="self-end max-w-[85%] px-3 py-2 rounded-xl rounded-br-sm"
                  style={{ background: "rgba(74,240,255,0.1)", border: "1px solid rgba(74,240,255,0.25)" }}
                >
                  <p className="text-xs font-mono text-white/85 whitespace-pre-wrap">{msg.text}</p>
                </div>
              ) : (
                <div key={msg.id} className="self-start max-w-[92%] flex flex-col gap-1">
                  <div className="px-3 py-2 rounded-xl rounded-bl-sm border border-white/5"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <p className="text-xs font-mono text-white/70 whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    {msg.source && (
                      <a
                        href={msg.source}
                        className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono text-neon-400/80 hover:text-neon-400 transition-colors"
                      >
                        view {msg.source} ↗
                      </a>
                    )}
                  </div>
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSend(s)}
                          className="text-[10px] font-mono text-white/40 border border-white/10 rounded-full px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {thinking && (
              <div className="self-start px-3 py-2 rounded-xl rounded-bl-sm border border-white/5"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <span className="text-xs font-mono text-white/40">
                  <span className="text-neon-400">Uvo</span> is thinking
                  <span className="caret-blink text-neon-400">▊</span>
                </span>
              </div>
            )}
          </div>

          {/* Quick suggestions when idle */}
          {!thinking && messages.length === 1 && suggestions.length > 0 && (
            <div className="shrink-0 px-3 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-[10px] font-mono text-white/40 border border-white/10 rounded-full px-2.5 py-1 hover:text-neon-400 hover:border-neon-400/30 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-t border-white/5">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Bibash…"
              className="flex-1 bg-transparent border-none outline-none text-white/80 text-xs font-mono caret-neon-400 placeholder:text-white/20"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              onClick={() => handleSend()}
              disabled={thinking}
              className="px-2.5 py-1.5 text-[10px] font-mono text-neon-400 border border-neon-400/30 rounded-lg hover:bg-neon-400/10 transition-all disabled:opacity-40"
            >
              Send →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
