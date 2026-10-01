"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { flightInput, isFlightKey, resetFlightInput } from "@/lib/flight";

type FlightInputOptions = {
  active: boolean;
  onUndock: () => void;
  onSelectByIndex: (index: number) => void;
  onCycleCamera: () => void;
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
export function useFlightInput({ active, onUndock, onSelectByIndex, onCycleCamera }: FlightInputOptions): void {
  useEffect(() => {
    if (!active) {
      resetFlightInput();
      return;
    }

    const keys = new Set<string>();

    const recompute = () => {
      const has = (code: string) => keys.has(code);
      flightInput.thrust = (has("KeyW") ? 1 : 0) + (has("KeyS") ? -1 : 0);
      flightInput.yaw =
        (has("KeyA") ? -1 : 0) + (has("KeyD") ? 1 : 0) + (has("ArrowLeft") ? -1 : 0) + (has("ArrowRight") ? 1 : 0);
      flightInput.pitch = (has("ArrowUp") ? 1 : 0) + (has("ArrowDown") ? -1 : 0);
      flightInput.roll = (has("KeyQ") ? -1 : 0) + (has("KeyE") ? 1 : 0);
      flightInput.boost = has("ShiftLeft") || has("ShiftRight");
      flightInput.brake = has("Space");
      flightInput.thrust = Math.max(-1, Math.min(1, flightInput.thrust));
      flightInput.yaw = Math.max(-1, Math.min(1, flightInput.yaw));
      flightInput.pitch = Math.max(-1, Math.min(1, flightInput.pitch));
      flightInput.roll = Math.max(-1, Math.min(1, flightInput.roll));
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
      if (event.code === "KeyC") {
        event.preventDefault();
        if (!event.repeat) onCycleCamera();
        return;
      }
      if (isFlightKey(event.code)) {
        event.preventDefault();
        if (!event.repeat) {
          keys.add(event.code);
          recompute();
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (keys.delete(event.code)) recompute();
    };
    const onBlur = () => {
      keys.clear();
      resetFlightInput();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      resetFlightInput();
    };
  }, [active, onUndock, onSelectByIndex, onCycleCamera]);
}

export type CameraDragHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerLeave: (event: ReactPointerEvent<HTMLElement>) => void;
};

/** Max mouse-look swing in radians: how far the view leans toward the cursor. */
const LOOK_YAW = 0.6;
const LOOK_PITCH = 0.35;

/**
 * Camera look follows the mouse with no click needed; dragging still swings
 * it further for touch and for bigger moves. Movement is written to
 * `flightInput` and smoothed by the camera rig.
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
        if (state && state.id === event.pointerId) {
          const dx = event.clientX - state.x;
          const dy = event.clientY - state.y;
          state.x = event.clientX;
          state.y = event.clientY;
          state.moved += Math.abs(dx) + Math.abs(dy);
          if (state.moved > 8) flightInput.suppressClick = true;
          flightInput.cameraYaw -= dx * 0.0042;
          flightInput.cameraPitch = Math.max(-0.6, Math.min(0.85, flightInput.cameraPitch + dy * 0.0032));
          return;
        }
        // Hover look: cursor position leans the camera, nothing to press.
        if (state || event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        const dead = 0.12;
        const ax = Math.max(0, Math.abs(nx) - dead) / (1 - dead);
        const ay = Math.max(0, Math.abs(ny) - dead) / (1 - dead);
        flightInput.lookYaw = Math.sign(nx) * ax * ax * LOOK_YAW;
        flightInput.lookPitch = Math.sign(ny) * ay * ay * LOOK_PITCH;
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
      onPointerLeave: () => {
        // Cursor left the viewport: ease the mouse-look back to center.
        flightInput.lookYaw = 0;
        flightInput.lookPitch = 0;
      },
    }),
    []
  );
}
