"use client";

import { useState, useEffect } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export default function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(fmt.format(new Date()));
    const id = setInterval(() => setTime(fmt.format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <span className="hidden lg:inline text-[10px] font-mono text-white/30 tracking-wider whitespace-nowrap">
      {time} NPT
    </span>
  );
}
