"use client";

import { useState } from "react";
import ScrollTrigger from "@/components/ScrollTrigger";
import PageShell from "@/components/PageShell";

const channels = [
  { label: "Email", value: "bibashpoudel@email.com", href: "mailto:bibashpoudel@email.com", note: "Best for professional inquiries" },
  { label: "GitHub", value: "/beebus-builds", href: "https://github.com/beebus-builds", note: "Code, open source, side projects" },
  { label: "LinkedIn", value: "/in/bibashpoudel", href: "https://linkedin.com/in/bibashpoudel", note: "Work history, professional network" },
  { label: "Location", value: "Sindhuli, Nepal", href: null, note: "UTC+5:45 — Nepal Time" },
];

export default function ContactPage() {
  return (
    <PageShell>
      <ScrollTrigger animation="fade-up">
      <section className="mb-16 thread">
        <div className="section-accent" />
        <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight mb-4">
          Let&apos;s Connect
        </h1>
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed">
          Whether you have a project idea, a job opportunity, or just want to say hi — I&apos;m always open to a conversation.
        </p>
      </section>
      </ScrollTrigger>

      <div className="thread">
      <section className="mb-16 thread-dot offset-left">
        <div className="section-accent" />
        <div className="flex items-center gap-3 neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50 mb-8">
          <span className="shape-circle bg-green-500/60" />
          <div>
            <p className="text-sm font-mono text-green-400/70">Available for opportunities</p>
            <p className="text-xs font-mono text-white/30 mt-0.5">Open to internships, freelance work, and collaboration</p>
          </div>
        </div>

        <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-4">Reach Me Via</h2>
        <div className="grid gap-3">
          {channels.map((ch) =>
            ch.href ? (
              <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50 hover:border-white/10 hover:bg-terminal-800/80 transition-all group"
              >
                <span className="shape-circle" style={{ background: ch.label === 'Email' ? 'rgba(74,240,255,0.4)' : ch.label === 'GitHub' ? 'rgba(255,215,0,0.4)' : ch.label === 'LinkedIn' ? 'rgba(255,74,240,0.3)' : 'rgba(255,255,255,0.2)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{ch.label}</p>
                  <p className="text-sm font-mono text-white/70 group-hover:text-neon-400 transition-colors truncate">{ch.value}</p>
                  <p className="text-xs font-mono text-white/20 mt-0.5">{ch.note}</p>
                </div>
                <span className="text-white/20 group-hover:text-white/40 transition-colors text-xs font-mono">→</span>
              </a>
            ) : (
              <div key={ch.label} className="flex items-center gap-4 neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
                <span className="shape-circle" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider">{ch.label}</p>
                  <p className="text-sm font-mono text-white/70">{ch.value}</p>
                  <p className="text-xs font-mono text-white/20 mt-0.5">{ch.note}</p>
                </div>
              </div>
            )
          )}
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="thread-dot">
        <div className="section-accent" />
        <div className="neon-card border border-white/5 rounded-xl p-6 bg-terminal-900/50">
          <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-3">Prefer the Terminal?</h2>
          <p className="text-sm font-mono text-white/45 leading-relaxed">
            From the terminal, use{" "}
            <code className="text-neon-400 bg-neon-400/10 px-1.5 py-0.5 rounded text-xs">mail --to bibash --subj &quot;Hello&quot;</code>
            {" "}to compose and send a message right here in the browser.
          </p>
        </div>
      </section>
      </div>

      <div className="thread">
      <section className="thread-dot">
        <div className="section-accent" />
        <NewsletterSignup />
      </section>
      </div>
    </PageShell>
  );
}

function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  }

  return (
    <>
      <h2 className="text-xs font-mono text-neon-400 tracking-wider mb-4">Newsletter</h2>
      <p className="text-sm font-mono text-white/40 mb-4 max-w-md">Occasional updates on what I&apos;m building and learning. No spam, ever.</p>
      {subscribed ? (
        <div className="flex items-center gap-2 text-sm font-mono text-green-400/80">
          <span className="shape-circle bg-green-500/50" /> Subscribed — I&apos;ll keep you posted.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              className="flex-1 bg-transparent text-white font-mono text-sm border-b border-white/10 pb-2 focus:border-neon-400/50 outline-none placeholder:text-white/15"
            />
            <button type="submit" className="btn-neon text-xs shrink-0">Subscribe →</button>
          </div>
        </form>
      )}
    </>
  );
}