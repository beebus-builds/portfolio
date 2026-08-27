"use client";

import { useState } from "react";

export default function ShareWidget({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/blog/${slug}` : `/blog/${slug}`;

  function share(network: "x" | "linkedin") {
    const encoded = encodeURIComponent(url);
    const text = encodeURIComponent(title);
    const targets = {
      x: `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    };
    window.open(targets[network], "_blank", "noopener,noreferrer,width=600,height=540");
  }

  function copyLink() {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="term-window">
      <div className="term-titlebar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-path">~/share</span>
      </div>
      <div className="term-body">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono text-white/40 mr-1">spread it:</span>
          <button
            onClick={() => share("x")}
            className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/10 text-white/55 hover:text-white hover:border-neon-400/40 hover:bg-white/5 transition-all"
          >
            X / Twitter
          </button>
          <button
            onClick={() => share("linkedin")}
            className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/10 text-white/55 hover:text-white hover:border-neon-400/40 hover:bg-white/5 transition-all"
          >
            LinkedIn
          </button>
          <button
            onClick={copyLink}
            className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/10 text-white/55 hover:text-white hover:border-neon-400/40 hover:bg-white/5 transition-all"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
