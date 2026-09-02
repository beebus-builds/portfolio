"use client";

import type { DriveInput } from "@/hooks/useDriveInput";

const BUTTONS: { key: keyof DriveInput; label: string; cls: string }[] = [
  { key: "forward", label: "▲", cls: "world-pad-up" },
  { key: "left", label: "◀", cls: "world-pad-left" },
  { key: "back", label: "▼", cls: "world-pad-down" },
  { key: "right", label: "▶", cls: "world-pad-right" },
];

export default function TouchControls({
  input,
  onEnter,
}: {
  input: { current: DriveInput };
  onEnter: () => void;
}) {
  const set = (key: keyof DriveInput, val: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    input.current[key] = val;
  };

  return (
    <div className="world-touch-controls">
      <div className="world-pad">
        {BUTTONS.map((b) => (
          <button
            key={b.key}
            className={`world-pad-btn ${b.cls}`}
            onPointerDown={set(b.key, true)}
            onPointerUp={set(b.key, false)}
            onPointerLeave={set(b.key, false)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={b.key}
          >
            {b.label}
          </button>
        ))}
      </div>
      <button
        className="world-enter-btn"
        onPointerDown={(e) => {
          e.preventDefault();
          onEnter();
        }}
        aria-label="Enter"
      >
        ENTER
      </button>
    </div>
  );
}
