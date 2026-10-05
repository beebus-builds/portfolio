"use client";

import { useEffect, useRef } from "react";
import { flightInput } from "@/lib/flight";
import type { Simulation } from "@/lib/simulation";

type AudioEngineProps = {
  sim: Simulation;
};

function createEngine() {
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
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
  return { ctx, osc, gain, filter };
}

type Engine = NonNullable<ReturnType<typeof createEngine>>;

export default function AudioEngine({ sim }: AudioEngineProps) {
  const engineRef = useRef<Engine | null>(null);

  // Lazy-init on first gesture: creating the context on mount wastes an
  // oscillator and trips autoplay policy. Wait for a real interaction.
  useEffect(() => {
    let disposed = false;
    const ensure = () => {
      if (disposed || engineRef.current) {
        void engineRef.current?.ctx.resume().catch(() => {});
        return;
      }
      try {
        engineRef.current = createEngine();
        void engineRef.current?.ctx.resume().catch(() => {});
      } catch {
        engineRef.current = null;
      }
    };
    window.addEventListener("keydown", ensure);
    window.addEventListener("pointerdown", ensure);
    return () => {
      disposed = true;
      window.removeEventListener("keydown", ensure);
      window.removeEventListener("pointerdown", ensure);
    };
  }, []);

  // Suspend while the tab is hidden so the hum never plays to an empty room.
  useEffect(() => {
    const onVisibility = () => {
      const engine = engineRef.current;
      if (!engine) return;
      if (document.hidden) void engine.ctx.suspend().catch(() => {});
      else void engine.ctx.resume().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Live engine hum: sim mutates every frame without React re-renders,
  // so poll it on an interval instead of depending on snapshot props.
  useEffect(() => {
    const id = window.setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;
      const { ctx, osc, gain, filter } = engine;
      if (ctx.state !== "running") return;

      const speed = sim.shipSpeed;
      const boosting = sim.boosting;
      const thrust = flightInput.thrust;

      const base = 70 + Math.min(speed, 120) * 2.2;
      const targetFreq = base + (boosting ? 30 : 0);
      const targetGain = Math.max(0.0001, Math.min(0.18, (thrust > 0 ? 0.12 : 0.02) + speed / 2000));
      try {
        osc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.05);
        filter.frequency.setTargetAtTime(600 + speed * 6, ctx.currentTime, 0.05);
        gain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
      } catch {
        /* audio param unavailable — stay silent */
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [sim]);

  useEffect(
    () => () => {
      try {
        engineRef.current?.osc.stop();
        void engineRef.current?.ctx.close().catch(() => {});
      } catch {
        /* already closed */
      }
      engineRef.current = null;
    },
    []
  );

  return null;
}
