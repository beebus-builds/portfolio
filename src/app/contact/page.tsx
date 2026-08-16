"use client";

import { useState } from "react";
import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";

const channels = [
  { label: "Email", value: "bibashpoudel@email.com", href: "mailto:bibashpoudel@email.com", note: "Best for professional inquiries", color: "rgba(74,240,255,0.6)" },
  { label: "GitHub", value: "/beebus-builds", href: "https://github.com/beebus-builds", note: "Code, open source, side projects", color: "rgba(255,215,0,0.6)" },
  { label: "LinkedIn", value: "/in/bibashpoudel", href: "https://linkedin.com/in/bibashpoudel", note: "Work history, professional network", color: "rgba(255,74,240,0.5)" },
  { label: "Location", value: "Sindhuli, Nepal", href: null, note: "UTC+5:45 — Nepal Time", color: "rgba(255,255,255,0.3)" },
];

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
      }),
    });
    setStatus(res.ok ? "success" : "error");
  };

  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
        <section className="mb-14">
          <p className="comment-label mb-3">contact/index.tsx</p>
          <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
            Let&apos;s Connect
          </h1>
          <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
            Whether you have a project idea, a job opportunity, or just want to say hi — I&apos;m always open to a conversation.
          </p>
        </section>
      </ScrollTrigger>

      <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-8 mb-16 items-start">
        {/* Left: form inside terminal chrome */}
        <section>
          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-path">~/contact.tsx</span>
            </div>
            <form onSubmit={handleSubmit} className="term-body space-y-4">
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1">
                  <span className="text-white/20">01</span> Name
                </label>
                <input name="name" placeholder="Your Name" className="w-full bg-terminal-800/80 border border-white/10 text-white p-2.5 text-xs font-mono rounded focus:border-neon-400 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1">
                  <span className="text-white/20">02</span> Email
                </label>
                <input name="email" type="email" placeholder="you@example.com" className="w-full bg-terminal-800/80 border border-white/10 text-white p-2.5 text-xs font-mono rounded focus:border-neon-400 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1">
                  <span className="text-white/20">03</span> Message
                </label>
                <textarea name="message" placeholder="What's on your mind?" className="w-full bg-terminal-800/80 border border-white/10 text-white p-2.5 text-xs font-mono rounded focus:border-neon-400 outline-none h-32" required />
              </div>
              <button type="submit" className="btn-neon w-full text-xs py-2.5 justify-center" disabled={status === "submitting"}>
                {status === "submitting" ? "Sending..." : "Send Message →"}
              </button>
              {status === "success" && <p className="text-green-400 text-xs font-mono">Message sent successfully! I&apos;ll get back to you soon.</p>}
              {status === "error" && <p className="text-red-400 text-xs font-mono">Failed to send message. Please try again.</p>}
            </form>
          </div>
        </section>

        {/* Right: channels as a directory listing */}
        <section>
          <div className="term-window">
            <div className="term-titlebar">
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-dot" />
              <span className="term-path">~/channels</span>
            </div>
            <div className="term-body py-3 px-0">
              <p className="font-mono text-xs text-white/25 px-6 mb-2">
                <span className="text-neon-400/60">$</span> ls --reach-me
              </p>
              <div className="divide-y divide-white/5">
                {channels.map((ch) =>
                  ch.href ? (
                    <a
                      key={ch.label}
                      href={ch.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                    >
                      <span className="shape-circle shrink-0" style={{ background: ch.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{ch.label}</p>
                        <p className="text-xs font-mono text-white/70 group-hover:text-neon-400 transition-colors truncate">{ch.value}</p>
                        <p className="text-[10px] font-mono text-white/20 mt-0.5">{ch.note}</p>
                      </div>
                      <span className="text-white/20 group-hover:text-white/40 transition-colors text-xs font-mono shrink-0">→</span>
                    </a>
                  ) : (
                    <div key={ch.label} className="flex items-center gap-4 px-6 py-4">
                      <span className="shape-circle shrink-0" style={{ background: ch.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{ch.label}</p>
                        <p className="text-xs font-mono text-white/70">{ch.value}</p>
                        <p className="text-[10px] font-mono text-white/20 mt-0.5">{ch.note}</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section>
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-3">Prefer the Terminal?</h2>
          <p className="text-sm font-mono text-white/45 leading-relaxed">
            From the terminal, use{" "}
            <code className="text-neon-400 bg-neon-400/10 px-1.5 py-0.5 rounded text-xs">mail --to bibash --subj &quot;Hello&quot;</code>
            {" "}to compose and send a message right here in the browser.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
