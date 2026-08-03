"use client";

import { useState, useEffect } from "react";
import PageShell from "@/components/PageShell";

type Entry = { name: string; message: string; time: string };

export default function GuestbookPage() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("guestbook") || "[]");
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("guestbook", JSON.stringify(entries));
    } catch {
      /* ignore quota errors */
    }
  }, [entries]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const entry: Entry = {
      name: name.trim(),
      message: message.trim(),
      time: new Date().toLocaleString(),
    };

    setEntries((prev) => [...prev, entry]);
    setName("");
    setMessage("");
  }

  return (
    <PageShell title="Guestbook" subtitle="Leave a message, say hello, or just pass by.">
      <section className="mb-12 thread">
        <div className="section-accent" />
      </section>

      <div className="grid gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50 space-y-4">
            <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-4">Write a Message</h2>

            <div>
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                className="w-full bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
                placeholder="Anonymous if you prefer"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-white/30 uppercase tracking-wider block mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={300}
                rows={4}
                className="w-full bg-transparent text-white font-mono text-sm border border-white/10 rounded-lg p-3 focus:border-neon-400/30 outline-none placeholder:text-white/15 resize-y"
                placeholder="Say hi, share feedback, or leave a thought..."
              />
            </div>

            <button
              type="submit"
              className="btn-neon w-full justify-center"
            >
              Leave a Message →
            </button>
          </form>
        </div>

        <div className="md:col-span-3">
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
                <p className="text-sm font-mono text-white/35">No messages yet. Be the first.</p>
              </div>
            ) : (
              entries.map((entry, i) => (
                <div key={i} className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-white/70">{entry.name}</span>
                    <span className="text-[10px] font-mono text-white/20">{entry.time}</span>
                  </div>
                  <p className="text-sm font-mono text-white/50 leading-relaxed">{entry.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}