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
import { PHOTOBOOTH_TOKEN_HEADER } from "@/lib/photoboothProtocol";

type Status = "starting" | "live" | "error" | "closed" | "disconnected";

type SavedPhone = {
  token: string;
  lastSeq: number;
};

function phoneStorageKey(id: string): string {
  return `photobooth.phone.${id}`;
}

function readSavedPhone(id: string): SavedPhone | null {
  try {
    const raw = window.localStorage.getItem(phoneStorageKey(id));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<SavedPhone>;
    if (typeof value.token !== "string" || !Number.isFinite(value.lastSeq)) return null;
    return { token: value.token, lastSeq: Math.max(0, Number(value.lastSeq)) };
  } catch {
    return null;
  }
}

function savePhone(id: string, value: SavedPhone): void {
  try {
    window.localStorage.setItem(phoneStorageKey(id), JSON.stringify(value));
  } catch {
    /* Private mode: the camera still works until this page is closed. */
  }
}

function removeSavedPhone(id: string): void {
  try {
    window.localStorage.removeItem(phoneStorageKey(id));
  } catch {
    /* The saved capability may be unavailable in private mode. */
  }
}

/** Draw the current video frame into a JPEG data URL, bounded by its long edge. */
function drawFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxSize: number,
  quality: number
): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;
  // Bound both portrait and landscape frames; otherwise a tall phone image
  // can exceed the upload limit even though its width is within the cap.
  const scale = Math.min(1, maxSize / Math.max(vw, vh));
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
  const phoneToken = useRef<string | null>(null);
  const acknowledgedSeq = useRef(0);
  const pendingCaptures = useRef(0);
  const connectRequest = useRef<Promise<boolean> | null>(null);

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

  const markDisconnected = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (loopTimer.current) window.clearTimeout(loopTimer.current);
    stopStream();
    setStatus("disconnected");
  }, [stopStream]);

  /** Resume a camera that joined before, or exchange the QR capability once. */
  const connectPhone = useCallback((): Promise<boolean> => {
    if (connectRequest.current) return connectRequest.current;
    const request = (async () => {
      const saved = readSavedPhone(id);
      if (saved) {
        try {
          const response = await fetch(`/api/photobooth/${id}/preview`, {
            cache: "no-store",
            headers: { [PHOTOBOOTH_TOKEN_HEADER]: saved.token },
          });
          if (response.ok) {
            const data = (await response.json()) as { captureSeq?: number; status?: string };
            const serverSeq = Math.max(0, Number(data.captureSeq ?? 0));
            phoneToken.current = saved.token;
            acknowledgedSeq.current = Math.min(saved.lastSeq, serverSeq);
            pendingCaptures.current = Math.max(0, serverSeq - acknowledgedSeq.current);
            return true;
          }
          if (response.status === 404) {
            removeSavedPhone(id);
            setError("This room has closed. Ask them to open a new one.");
            markClosed();
            return false;
          }
          if (response.status === 403) {
            removeSavedPhone(id);
          } else {
            setError("Could not reconnect the camera. Check your connection and try again.");
            setStatus("error");
            return false;
          }
        } catch {
          setError("Could not reconnect the camera. Check your connection and try again.");
          setStatus("error");
          return false;
        }
      }

      const joinToken = new URLSearchParams(window.location.hash.slice(1)).get("join");
      if (!joinToken) {
        setError("This camera link is invalid or has already been claimed.");
        markDisconnected();
        return false;
      }

      try {
        const response = await fetch(`/api/photobooth/${id}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ joinToken }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          phoneToken?: string;
          captureSeq?: number;
          error?: string;
        };
        if (response.status === 404) {
          setError("This room has closed. Ask them to open a new one.");
          markClosed();
          return false;
        }
        if (response.status === 429 || response.status >= 500) {
          setError("Could not connect the camera. Check your connection and try again.");
          setStatus("error");
          return false;
        }
        if (!response.ok || !data.phoneToken) {
          setError(data.error ?? "This room could not connect the camera.");
          markDisconnected();
          return false;
        }
        phoneToken.current = data.phoneToken;
        acknowledgedSeq.current = Math.max(0, Number(data.captureSeq ?? 0));
        pendingCaptures.current = 0;
        savePhone(id, { token: data.phoneToken, lastSeq: acknowledgedSeq.current });
        // Remove the one-time capability from the visible URL.
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        return true;
      } catch {
        setError("Could not connect the camera. Check your connection and try again.");
        setStatus("error");
        return false;
      }
    })();
    connectRequest.current = request;
    void request.finally(() => {
      if (connectRequest.current === request) connectRequest.current = null;
    });
    return request;
  }, [id, markClosed, markDisconnected]);

  const startCamera = useCallback(async (mode: "user" | "environment"): Promise<boolean> => {
    stopStream();
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can’t use a camera. Open the link in your phone’s browser over a secure (https) connection.");
      setStatus("error");
      return false;
    }
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (!mountedRef.current || closedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
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
      return true;
    } catch (err) {
      setError(cameraError(err));
      setStatus("error");
      return false;
    }
  }, [stopStream]);

  /** Grab a full-resolution frame and upload it to the room. */
  const takePhoto = useCallback(async (): Promise<boolean> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const token = phoneToken.current;
    if (!video || !canvas || !token || capturingRef.current || closedRef.current) return false;
    if (!video.videoWidth) return false;
    capturingRef.current = true;
    setSending(true);
    try {
      const image = drawFrame(video, canvas, 1600, 0.85);
      if (!image) return false;
      const response = await fetch(`/api/photobooth/${id}/photo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [PHOTOBOOTH_TOKEN_HEADER]: token,
        },
        body: JSON.stringify({ image }),
      });
      if (response.status === 404) {
        markClosed();
        return false;
      }
      if (response.status === 403) {
        markDisconnected();
        return false;
      }
      if (response.status === 409) {
        pendingCaptures.current = 0;
        setError("This room has reached its photo limit.");
        return false;
      }
      if (!response.ok) throw new Error("upload failed");
      setError(null);
      setShotCount((count) => count + 1);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 170);
      return true;
    } catch {
      setError("That shot didn’t upload — check your connection and try again.");
      return false;
    } finally {
      capturingRef.current = false;
      setSending(false);
    }
  }, [id, markClosed, markDisconnected]);

  /** Take every remote shutter request that has not been acknowledged yet. */
  const processPendingCaptures = useCallback(async () => {
    if (closedRef.current || capturingRef.current) return;
    while (pendingCaptures.current > 0 && !closedRef.current) {
      const uploaded = await takePhoto();
      if (!uploaded) break;
      pendingCaptures.current -= 1;
      acknowledgedSeq.current += 1;
      const token = phoneToken.current;
      if (token) savePhone(id, { token, lastSeq: acknowledgedSeq.current });
    }
  }, [id, takePhoto]);

  /** Push a small preview frame up; the reply tells us if a shot is queued. */
  const pump = useCallback(async () => {
    if (closedRef.current || !mountedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const token = phoneToken.current;
    if (video && canvas && token && video.videoWidth) {
      try {
        const preview = drawFrame(video, canvas, 360, 0.6);
        if (preview) {
          const response = await fetch(`/api/photobooth/${id}/preview`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              [PHOTOBOOTH_TOKEN_HEADER]: token,
            },
            body: JSON.stringify({ preview }),
          });
          if (response.status === 404) {
            markClosed();
            return;
          }
          if (response.status === 403) {
            markDisconnected();
            return;
          }
          if (response.ok) {
            const data = (await response.json()) as { captureSeq?: number; status?: string };
            if (data.status === "closed") {
              markClosed();
              return;
            }
            const seq = Number(data.captureSeq ?? 0);
            pendingCaptures.current = Math.max(pendingCaptures.current, seq - acknowledgedSeq.current);
            await processPendingCaptures();
          }
        }
      } catch {
        /* a dropped frame is fine; the next tick retries */
      }
    }
    if (!closedRef.current && mountedRef.current) {
      loopTimer.current = window.setTimeout(() => void pump(), 700);
    }
  }, [id, markClosed, markDisconnected, processPendingCaptures]);

  /* ---------- boot: join the room, open the camera and start streaming ---------- */
  useEffect(() => {
    mountedRef.current = true;
    closedRef.current = false;
    canvasRef.current = document.createElement("canvas");
    let cancelled = false;

    void (async () => {
      const connected = await connectPhone();
      if (cancelled || !mountedRef.current || closedRef.current || !connected) return;
      const started = await startCamera("environment");
      if (!started || cancelled || !mountedRef.current || closedRef.current) return;
      void pump();
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      closedRef.current = true;
      if (loopTimer.current) window.clearTimeout(loopTimer.current);
      stopStream();
    };
  }, [id, connectPhone, startCamera, pump, stopStream]);

  const retry = useCallback(async () => {
    setError(null);
    setStatus("starting");
    const connected = phoneToken.current ? true : await connectPhone();
    if (!connected) return;
    const started = await startCamera(facing);
    if (started && !closedRef.current && mountedRef.current) void pump();
  }, [connectPhone, facing, pump, startCamera]);

  const flip = useCallback(() => {
    const next = facing === "user" ? "environment" : "user";
    setFacing(next);
    void startCamera(next);
  }, [facing, startCamera]);

  if (status === "disconnected") {
    return (
      <main className="phonecam phonecam--message">
        <div className="phonecam__card">
          <h1>This camera is disconnected</h1>
          <p>{error ?? "The room closed or another camera claimed this link."}</p>
          <Link href="/" className="btn">
            Back to the portfolio
          </Link>
        </div>
      </main>
    );
  }

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
                <button type="button" className="btn" onClick={() => void retry()}>
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