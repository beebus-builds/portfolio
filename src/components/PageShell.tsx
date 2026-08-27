"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

interface Props {
  children: React.ReactNode;
}

export default function PageShell({ children }: Props) {
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShowTop(y > 400);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (y / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-terminal-900 flex flex-col modern-site-shell">
      <div className="site-atmosphere" aria-hidden="true">
        <span className="site-atmosphere-orb site-atmosphere-orb-a" />
        <span className="site-atmosphere-orb site-atmosphere-orb-b" />
        <span className="site-grid" />
      </div>
      <div className="site-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <Header />
      <main id="main-content" className="flex-1 relative z-[2]">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 modern-page-content">
          {children}
        </div>
      </main>
      <Footer />
      <ChatWidget />
      <button
        onClick={scrollToTop}
        className={`back-to-top ${showTop ? "visible" : ""}`}
        aria-label="Back to top"
        title="Back to top"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}
