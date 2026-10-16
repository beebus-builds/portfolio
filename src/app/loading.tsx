"use client";

import { useEffect, useState } from "react";
import { profile } from "@/lib/profile";

const STEPS = [
  "Linking navigation bus",
  "Resolving route telemetry",
  "Warming the render pipeline",
  "Charting the local system",
];

/**
 * Route-transition fallback. Next.js keeps this mounted while a segment's
 * server components stream in, so it doubles as the app's first-paint screen.
 * The bar eases toward 92% and then simply unmounts when the route is ready —
 * it never fakes a completion it cannot measure.
 */
export default function Loading() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(60);
      setStep(0);
      return;
    }

    const stepTimer = window.setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, 900);

    const rampTimer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + Math.max(1, (92 - current) * 0.14)));
    }, 220);

    return () => {
      window.clearInterval(stepTimer);
      window.clearInterval(rampTimer);
    };
  }, []);

  return (
    <div className="loadscreen" role="status" aria-live="polite" aria-busy="true">
      <div className="loadscreen__ring" aria-hidden="true">
        <span className="loadscreen__planet" />
      </div>
      <p className="loadscreen__callsign">{profile.callSign} · loading</p>
      <p className="loadscreen__name">{profile.name}</p>
      <p className="loadscreen__status">
        <span className="sr-only">Loading: </span>
        {STEPS[step]}…
      </p>
      <div
        className="loadscreen__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Page loading progress"
      >
        <span className="loadscreen__bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
