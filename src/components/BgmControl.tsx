"use client";

import { useEffect, useRef, useState } from "react";
import {
  getBgmTrackLabel,
  getBgmVolume,
  isBgmEnabled,
  isBgmPlaying,
  onBgmChange,
  sampleBgmLevels,
  setBgmVolume,
  toggleBgm,
} from "@/lib/audio";

const BARS = 5;

export default function BgmControl() {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [label, setLabel] = useState("generative ambient");
  const [busy, setBusy] = useState(false);
  const [levels, setLevels] = useState<number[]>(new Array(BARS).fill(0.06));
  const rafRef = useRef(0);

  useEffect(() => {
    setPlaying(isBgmPlaying());
    setVolume(getBgmVolume());
    setLabel(getBgmTrackLabel());
    const off = onBgmChange(() => {
      setPlaying(isBgmPlaying());
      setVolume(getBgmVolume());
      setLabel(getBgmTrackLabel());
    });
    // Browsers block autoplay: resume after the first gesture
    // when the visitor left BGM on.
    if (isBgmEnabled() && !isBgmPlaying()) {
      const resume = () => { void toggleBgm(); };
      window.addEventListener("pointerdown", resume, { once: true });
      window.addEventListener("keydown", resume, { once: true });
      return () => {
        off();
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      };
    }
    return off;
  }, []);

  useEffect(() => {
    if (!playing) {
      setLevels(new Array(BARS).fill(0.06));
      return;
    }
    const tick = () => {
      setLevels(sampleBgmLevels(BARS));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing]);

  const handleToggle = async () => {
    setBusy(true);
    try {
      await toggleBgm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed left-4 bottom-10 z-[80] flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-neon-400/25 bg-[#0a0a1a]/90 backdrop-blur-md shadow-[0_0_18px_rgba(84,230,212,0.15)]"
      title={`Background music — ${label}`}
    >
      <button
        onClick={handleToggle}
        disabled={busy}
        aria-label={playing ? "Pause background music" : "Play background music"}
        className="w-7 h-7 rounded-full border border-neon-400/40 flex items-center justify-center text-neon-400 text-xs hover:bg-neon-400/10 transition-colors cursor-pointer disabled:opacity-50"
      >
        {playing ? "❚❚" : "♪"}
      </button>
      <div className="flex items-end gap-[3px] h-4" aria-hidden="true">
        {levels.map((l, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-neon-400/80 transition-[height] duration-100"
            style={{ height: `${Math.max(2, Math.round(l * 16))}px` }}
          />
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(volume * 100)}
        onChange={(e) => setBgmVolume(Number(e.target.value) / 100)}
        aria-label="Background music volume"
        className="w-16 accent-[#54e6d4] cursor-pointer"
      />
    </div>
  );
}
