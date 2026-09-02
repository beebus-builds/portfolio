"use client";

import { useEffect, useRef } from "react";

export interface DriveInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
}

const KEY_MAP: Record<string, keyof DriveInput> = {
  w: "forward",
  arrowup: "forward",
  s: "back",
  arrowdown: "back",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
};

export function useDriveInput(onEnter?: () => void) {
  const input = useRef<DriveInput>({ forward: false, back: false, left: false, right: false });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const dir = KEY_MAP[key];
      if (dir) {
        input.current[dir] = true;
        return;
      }
      if ((key === "e" || key === "enter") && onEnter) onEnter();
    };
    const up = (e: KeyboardEvent) => {
      const dir = KEY_MAP[e.key.toLowerCase()];
      if (dir) input.current[dir] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [onEnter]);

  return input;
}
