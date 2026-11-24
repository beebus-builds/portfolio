"use client";

/**
 * The phone side of the photobooth. Opening the link on a phone turns it into
 * the camera for the desktop: it keeps pushing a small preview frame up to the
 * server (so the big screen shows a live view) and, whenever the desktop — or
 * the visitor here — asks for a shot, it grabs a full-resolution frame and
 * uploads it to the room.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Status = "starting" | "live" | "error" | "closed";

/** Draw the current video frame into a JPEG data URL, scaled to `maxWidth`. */
function drawFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxWidth: number,
  quality: number
): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  const scale = Math.min(1, maxWidth / vw);
  canvas.width = Math.round(vw * scale);
  canvas.height = Math.round(vh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

function cameraError(err: unknown): string {
  const name = (err as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera permission was denied. Allow camera access for this site in your browser settings, then reload.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "No camera was found on this device.";
  if (name === "NotReadableError") return "The camera is busy in another app. Close it and try again.";
  return "The camera could not be started.";
}

export default function PhoneCamera({ id }: { id: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopTimer = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const closedRef = useRef(false);
  const capturingRef = useRef(false);
  const lastSeq = useRef(0);

  const [status, setStatus] = useState<Status>("starting");
  const [error, setError] = useState<string | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [flash, setFlash] = useState(false);
  const [shotCount, setShotCount] = useState(0);
  const [sending, setSending] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const markClosed = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (loopTimer.current) window.clearTimeout(loopTimer.current);
    stopStream();
    setStatus("closed");
  }, [stopStream]);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    stopStream();
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can’t use a camera. Open the link in your phone’s browser over a secure (https) connection.");
      setStatus("error");
      return;
    }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!mountedRef.current || closedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        try {
          await video.play();
        } catch {
          /* autoplay of a muted inline video is allowed on phones; ignore */
        }
      }
      setStatus("live");
    } catch (err) {
      setError(cameraError(err));
      setStatus("error");
    }
  }, [stopStream]);

  /** Grab a full-resolution frame and upload it to the room. */
  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || capturingRef.current || closedRef.current) return;
    if (!video.videoWidth) return;
    capturingRef.current = true;
    setSending(true);
    try {
      const image = drawFrame(video, canvas, 1600, 0.85);
      if (!image) return;
      const response = await fetch(`/api/photobooth/${id}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (response.status === 404) {
        markClosed();
        return;
      }
      if (!response.ok) throw new Error("upload failed");
      setShotCount((count) => count + 1);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 170);
    } catch {
      setError("That shot didn’t upload — check your connection and try again.");
    } finally {
      capturingRef.current = false;
      setSending(false);
    }
  }, [id, markClosed]);

  /** Push a small preview frame up; the reply tells us if a shot is queued. */
  const pump = useCallback(async () => {
    if (closedRef.current || !mountedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.videoWidth) {
      try {
        const preview = drawFrame(video, canvas, 360, 0.6);
        if (preview) {
          const response = await fetch(`/api/photobooth/${id}/preview`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ preview }),
          });
          if (response.status === 404) {
            markClosed();
            return;
          }
          if (response.ok) {
            const data = (await response.json()) as { captureSeq?: number; status?: string };
            if (data.status === "closed") {
              markClosed();
              return;
            }
            const seq = Number(data.captureSeq ?? 0);
            if (seq > lastSeq.current) {
              lastSeq.current = seq;
              await takePhoto();
            }
          }
        }
      } catch {
        /* a dropped frame is fine; the next tick retries */
      }
    }
    if (!closedRef.current && mountedRef.current) {
      loopTimer.current = window.setTimeout(() => void pump(), 700);
    }
  }, [id, markClosed, takePhoto]);

  /* ---------- boot: read state, then open the camera and start streaming ---------- */
  useEffect(() => {
    mountedRef.current = true;
    closedRef.current = false;
    canvasRef.current = document.createElement("canvas");
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(`/api/photobooth/${id}`, { cache: "no-store" });
        if (response.status === 404) {
          if (!cancelled) markClosed();
          return;
        }
        if (response.ok) {
          const state = (await response.json()) as { captureSeq?: number };
          lastSeq.current = Number(state.captureSeq ?? 0);
        }
      } catch {
        /* offline read is non-fatal; the camera can still try */
      }
      if (cancelled || !mountedRef.current || closedRef.current) return;
      await startCamera("environment");
      if (cancelled || !mountedRef.current || closedRef.current) return;
      void pump();
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      closedRef.current = true;
      if (loopTimer.current) window.clearTimeout(loopTimer.current);
      stopStream();
    };
  }, [id, markClosed, startCamera, pump, stopStream]);

  const flip = useCallback(() => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    void startCamera(next);
  }, [facing, startCamera]);

  if (status === "closed") {
    return (
      <main className="phonecam phonecam--message">
        <div className="phonecam__card">
          <h1>This room has closed</h1>
          <p>The photobooth on the other screen ended this session. Ask them to open a new one.</p>
          <Link href="/" className="btn">
            Back to the portfolio
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="phonecam">
      <div className="phonecam__stage" data-facing={facing}>
        <video
          ref={videoRef}
          className="phonecam__video"
          data-ready={status === "live" ? "" : undefined}
          autoPlay
          muted
          playsInline
          aria-label="Camera preview"
        />
        {flash && <div className="phonecam__flash" aria-hidden="true" />}
        {status !== "live" && (
          <div className="phonecam__overlay">
            {status === "starting" ? (
              <>
                <span className="phonecam__spinner" aria-hidden="true" />
                <p>Starting the camera…</p>
                <p className="phonecam__hint">Allow camera access when your browser asks.</p>
              </>
            ) : (
              <>
                <p className="phonecam__error">{error}</p>
                <button type="button" className="btn" onClick={() => void startCamera(facing)}>
                  Try again
                </button>
              </>
            )}
          </div>
        )}
        <span className="phonecam__badge">{shotCount} taken</span>
      </div>

      <div className="phonecam__controls">
        <button
          type="button"
          className="phonecam__flip"
          onClick={flip}
          disabled={status !== "live"}
          aria-label="Switch camera"
        >
          ⟳
        </button>
        <button
          type="button"
          className="phonecam__shutter"
          onClick={() => void takePhoto()}
          disabled={status !== "live" || sending}
          aria-label="Take a photo"
        >
          <span className="phonecam__shutter-inner" />
        </button>
        <span className="phonecam__spacer" aria-hidden="true" />
      </div>
      <p className="phonecam__note">
        {error && status === "live" ? error : "This page is your camera. Shots appear on the big screen."}
      </p>
    </main>
  );
}