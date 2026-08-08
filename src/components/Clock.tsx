"use client";

import { useState, useEffect, useRef } from "react";

const timezones = [
  { name: "KTM", zone: "Asia/Kathmandu" },
  { name: "UTC", zone: "UTC" },
  { name: "NYC", zone: "America/New_York" },
  { name: "TYO", zone: "Asia/Tokyo" },
];

export default function Clock() {
  const [time, setTime] = useState("");
  const [selectedZone, setSelectedZone] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: timezones[selectedZone].zone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, [selectedZone]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-[42px] h-[42px] rounded-full border border-[var(--color-terminal-700)] flex flex-col items-center justify-center bg-[var(--color-terminal-900)] font-mono text-[9px] text-[var(--color-neon-400)] hover:border-[var(--color-neon-400)] hover:bg-[var(--color-terminal-800)] transition-all duration-300"
      >
        <span className="tabular-nums font-bold text-[10px] leading-none">{time.split(':')[0]}:{time.split(':')[1]}</span>
        <span className="text-[7px] text-[var(--color-terminal-text)] font-medium mt-0.5 opacity-80">{timezones[selectedZone].name}</span>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-24 bg-[var(--color-terminal-900)] border border-[var(--color-terminal-700)] rounded-lg shadow-2xl z-50 p-1.5 backdrop-blur-md">
          {timezones.map((tz, index) => (
            <button
              key={tz.zone}
              onClick={() => { setSelectedZone(index); setIsOpen(false); }}
              className={`w-full text-center px-2 py-1 text-[10px] font-bold font-mono rounded ${selectedZone === index ? "text-[var(--color-neon-400)] bg-[var(--color-terminal-700)]/40" : "text-[var(--color-terminal-text)] hover:text-white"}`}
            >
              {tz.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
