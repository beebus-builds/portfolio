"use client";

import { useEffect, useRef, useState } from "react";
import { flightInput } from "@/lib/flight";

/**
 * Touch flight controls: a virtual stick on the left for thrust/yaw, a
 * throttle pair on the right for climb/descend, plus a boost hold. Only
 * mounted when the device reports a coarse pointer.
 */
export default function TouchControls() {
  const stickRef = useRef<HTMLDivElement>(null);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!coarse) return;
    const clear = () => {
      flightInput.thrust = 0;
      flightInput.yaw = 0;
      flightInput.pitch = 0;
    };
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("blur", clear);
      clear();
    };
  }, [coarse]);

  if (!coarse) return null;

  const steer = (event: React.PointerEvent<HTMLDivElement>, axis: "x" | "y") => {
    const el = axis === "x" ? stickRef.current : event.currentTarget;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (axis === "x") {
      const dx = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      flightInput.yaw = Math.max(-1, Math.min(1, dx));
      const dy = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      flightInput.thrust = Math.max(-1, Math.min(1, -dy));
    } else {
      const dy = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      flightInput.pitch = Math.max(-1, Math.min(1, -dy));
    }
  };

  return (
    <div className="touch" aria-hidden="true">
      <div
        ref={stickRef}
        className="touch__stick"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          steer(event, "x");
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) steer(event, "x");
        }}
        onPointerUp={() => {
          flightInput.yaw = 0;
          flightInput.thrust = 0;
        }}
      />
      <div className="touch__throttle">
        <div
          className="touch__col"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            steer(event, "y");
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) steer(event, "y");
          }}
          onPointerUp={() => {
            flightInput.pitch = 0;
          }}
        >
          <span>▲</span>
          <span>▼</span>
        </div>
        <button
          type="button"
          className="touch__boost"
          onPointerDown={() => {
            flightInput.boost = true;
          }}
          onPointerUp={() => {
            flightInput.boost = false;
          }}
          onPointerLeave={() => {
            flightInput.boost = false;
          }}
        >
          BOOST
        </button>
      </div>
    </div>
  );
}