"use client";

import { useEffect, useState } from "react";

type Device = "desktop" | "tablet" | "mobile";

const DEVICES: { id: Device; label: string; width: string }[] = [
  { id: "desktop", label: "Desktop", width: "100%" },
  { id: "tablet", label: "Tablet", width: "768px" },
  { id: "mobile", label: "Mobile", width: "390px" },
];

export default function DemoViewport({ url, title, color }: { url: string; title: string; color: string }) {
  const [open, setOpen] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!url) return null;

  const active = DEVICES.find((d) => d.id === device)!;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-neon text-xs justify-center w-full"
      >
        Live Demo →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} live preview`}
        >
          <div
            className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-terminal-900/95 shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-3 min-w-0">
                <p className="text-[11px] font-mono text-white/50 truncate">{url}</p>
              </div>
              <div className="flex items-center gap-1 mr-3">
                {DEVICES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDevice(d.id)}
                    className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                      device === d.id
                        ? "border-neon-400/40 text-neon-400 bg-neon-400/10"
                        : "border-white/10 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close preview"
                className="w-7 h-7 rounded-md border border-white/10 text-white/50 hover:text-white hover:border-white/20 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-terminal-950/60 p-4 flex justify-center">
              <div
                className="bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 h-full"
                style={{ width: active.width, maxWidth: "100%" }}
              >
                <iframe
                  src={url}
                  title={`${title} preview`}
                  className="w-full h-full min-h-[70vh] border-0"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="px-4 py-2 border-t border-white/10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[10px] font-mono text-white/40">
                Previewing {title} · {active.label} viewport
              </span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] font-mono text-neon-400 hover:underline"
              >
                Open in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
