"use client";

import { useState, useEffect } from "react";

export default function StudentWorkspaceBar() {
  const [time, setTime] = useState("");
  const [mem, setMem] = useState(34.2);
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Simulate fluctuating heap memory usage (classic CS student project feel)
    const memInterval = setInterval(() => {
      setMem((prev) => +(prev + (Math.random() - 0.5) * 0.4).toFixed(1));
    }, 3000);

    const handleClick = () => setClicks((c) => c + 1);
    window.addEventListener("click", handleClick);

    return () => {
      clearInterval(interval);
      clearInterval(memInterval);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] border-t border-white/10 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-white/50 select-none backdrop-blur-md bg-opacity-90">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-neon-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>main*</span>
        </div>
        <span className="hidden sm:inline text-white/20">|</span>
        <span className="hidden sm:inline text-white/40">TypeScript 5.x</span>
        <span className="hidden md:inline text-white/20">|</span>
        <span className="hidden md:inline text-white/40">UTF-8</span>
        <span className="hidden lg:inline text-white/20">|</span>
        <span className="hidden lg:inline text-white/30">Heap: {mem} MB</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-white/30">Clicks: {clicks}</span>
        <span className="text-white/20">|</span>
        <span className="text-neon-400/80">LN 42, COL 18</span>
        <span className="text-white/20">|</span>
        <span className="text-white/70">{time}</span>
      </div>
    </div>
  );
}
