"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { flightInput, isFlightKey, resetFlightInput } from "@/lib/flight";

type FlightInputOptions = {
  active: boolean;
  onUndock: () => void;
  onSelectByIndex: (index: number) => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Binds keyboard input to the mutable `flightInput` singleton so the render loop
 * can read controls every frame without triggering React re-renders.
 */
export function useFlightInput({ active, onUndock, onSelectByIndex }: FlightInputOptions): void {
  useEffect(() => {
    if (!active) {
      resetFlightInput();
      return;
    }

    const applyKey = (code: string, down: boolean) => {
      const on = down ? 1 : 0;
      switch (code) {
        case "KeyW":
          flightInput.thrust = on;
          break;
        case "KeyS":
          flightInput.thrust = -on;
          break;
        case "KeyA":
          flightInput.yaw = -on;
          break;
        case "KeyD":
          flightInput.yaw = on;
          break;
        case "KeyQ":
          flightInput.roll = -on;
          break;
        case "KeyE":
          flightInput.roll = on;
          break;
        case "ArrowUp":
          flightInput.pitch = on;
          break;
        case "ArrowDown":
          flightInput.pitch = -on;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          flightInput.boost = down;
          break;
        case "Space":
          flightInput.brake = down;
          break;
        default:
          break;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        onUndock();
        return;
      }
      if (isTypingTarget(event.target)) return;

      if (event.code >= "Digit1" && event.code <= "Digit5") {
        event.preventDefault();
        onSelectByIndex(Number(event.code.slice(5)) - 1);
        return;
      }
      if (isFlightKey(event.code)) {
        event.preventDefault();
        applyKey(event.code, true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => applyKey(event.code, false);
    const onBlur = () => resetFlightInput();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      resetFlightInput();
    };
  }, [active, onUndock, onSelectByIndex]);
}

export type CameraDragHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
};

/**
 * Camera look is drag-only, so a plain click still lands on a planet.
 * Movement is written to `flightInput` and eased back by the camera rig.
 */
export function useCameraDrag(): CameraDragHandlers {
  const drag = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);

  return useMemo<CameraDragHandlers>(
    () => ({
      onPointerDown: (event) => {
        if (event.button !== 0) return;
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: 0 };
        flightInput.suppressClick = false;
        flightInput.dragging = true;
      },
      onPointerMove: (event) => {
        const state = drag.current;
        if (!state || state.id !== event.pointerId) return;
        const dx = event.clientX - state.x;
        const dy = event.clientY - state.y;
        state.x = event.clientX;
        state.y = event.clientY;
        state.moved += Math.abs(dx) + Math.abs(dy);
        if (state.moved > 8) flightInput.suppressClick = true;
        flightInput.cameraYaw -= dx * 0.0042;
        flightInput.cameraPitch = Math.max(-0.6, Math.min(0.85, flightInput.cameraPitch + dy * 0.0032));
      },
      onPointerUp: (event) => {
        if (drag.current && drag.current.id !== event.pointerId) return;
        drag.current = null;
        flightInput.dragging = false;
      },
      onPointerCancel: () => {
        drag.current = null;
        flightInput.dragging = false;
      },
    }),
    []
  );
}
