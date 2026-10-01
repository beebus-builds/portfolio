"use client";

import { useEffect, useRef } from "react";
import { flightInput } from "@/lib/flight";
import type { Simulation } from "@/lib/simulation";

type AudioEngineProps = {
  sim: Simulation;
};

export default function AudioEngine({ sim }: AudioEngineProps) {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ctxRef.current) {
      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      ctxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      osc.type = "sawtooth";
      osc.frequency.value = 80;
      gain.gain.value = 0;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
      filterRef.current = filter;
    }
  }, []);

  // Live engine hum: sim mutates every frame without React re-renders,
  // so poll it on an interval instead of depending on snapshot props.
  useEffect(() => {
    const id = window.setInterval(() => {
      const ctx = ctxRef.current;
      const osc = oscRef.current;
      const gain = gainRef.current;
      const filter = filterRef.current;
      if (!ctx || !osc || !gain) return;
      if (ctx.state === "suspended") return;

      const speed = sim.shipSpeed;
      const boosting = sim.boosting;
      const thrust = flightInput.thrust;

      const base = 70 + Math.min(speed, 120) * 2.2;
      const targetFreq = base + (boosting ? 30 : 0);
      const targetGain = Math.max(0.0001, Math.min(0.18, (thrust > 0 ? 0.12 : 0.02) + speed / 2000));
      try {
        osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.05);
        filter?.frequency.setTargetAtTime(600 + speed * 6, ctx.currentTime, 0.05);
        gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
      } catch {
        /* audio param unavailable — stay silent */
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [sim]);

  // resume on interaction
  useEffect(() => {
    const resume = () => {
      void ctxRef.current?.resume();
    };
    window.addEventListener("keydown", resume);
    window.addEventListener("pointerdown", resume);
    return () => {
      window.removeEventListener("keydown", resume);
      window.removeEventListener("pointerdown", resume);
    };
  }, []);

  return null;
}
