"use client";

/**
 * The desktop side of the photobooth: it opens a room, shows a QR code the
 * visitor scans with their phone, then mirrors whatever the phone's camera
 * sees. Shots taken on the phone (or triggered from here) drop into the strip
 * below, ready to download. Everything is relayed through the server — see
 * src/lib/photobooth.ts — so no peer-to-peer plumbing is needed.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

type SessionState = {
  id: string;
  status: "waiting" | "live" | "closed";
  phoneOnline: boolean;
  preview: string | null;
  previewFresh: boolean;
  captureSeq: number;
  photoCount: number;
  photos: { id: string; createdAt: string }[];
};

type Shot = { id: string; image: string };

const POLL_MS = 700;

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export default function Photobooth() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const requested = useRef<Set<string>>(new Set());

  /* ---------- open a room ---------- */
  const openRoom = useCallback(async () => {
    setStarting(true);
    setError(null);
    setSession(null);
    setSessionId(null);
    setQr(null);
    setShots([]);
    requested.current = new Set();
    try {
      const { id } = await postJson<{ id: string }>("/api/photobooth");
      setSessionId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The photobooth could not start.");
    } finally {
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    void openRoom();
  }, [openRoom]);

  /* ---------- render the QR code once we have an id ---------- */
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const url = `${window.location.origin}/photobooth/${sessionId}`;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 480,
      color: { dark: "#04050c", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) setQr(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError("Could not draw the QR code — you can still type the code below.");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  /* ---------- poll the room ---------- */
  useEffect(() => {
    if (!sessionId) return;
    let stopped = false;
    let inFlight = false;

    const tick = async () => {
      if (inFlight || stopped) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/photobooth/${sessionId}`, { cache: "no-store" });
        if (stopped) return;
        if (response.ok) {
          const state = (await response.json()) as SessionState;
          setSession(state);
          if (state.status === "closed") {
            setError("This room was closed.");
          }
        } else if (response.status === 404) {
          setError("This room has closed. Open a new one.");
          setSession((current) => (current ? { ...current, status: "closed" } : current));
        }
      } catch {
        /* a dropped poll is fine; the next tick retries */
      } finally {
        inFlight = false;
      }
    };

    void tick();
    const timer = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [sessionId]);

  /* ---------- load any new shots' bytes ---------- */
  useEffect(() => {
    if (!sessionId || !session) return;
    for (const photo of session.photos) {
      if (requested.current.has(photo.id)) continue;
      requested.current.add(photo.id);
      fetch(`/api/photobooth/${sessionId}/photos/${photo.id}`, { cache: "no-store" })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { image?: string } | null) => {
          if (data?.image) {
            setShots((current) =>
              current.some((shot) => shot.id === photo.id)
                ? current
                : [{ id: photo.id, image: data.image! }, ...current]
            );
          }
        })
        .catch(() => {
          /* leave it out; a later poll can try again if we clear the mark */
          requested.current.delete(photo.id);
        });
    }
  }, [session, sessionId]);

  /* ---------- take a shot from here ---------- */
  const snap = useCallback(async () => {
    if (!sessionId || capturing) return;
    if (!session?.phoneOnline || session.status !== "live") return;
    setCapturing(true);
    try {
      await postJson(`/api/photobooth/${sessionId}/capture`);
      setFlash(true);
      window.setTimeout(() => setFlash(false), 180);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not take the shot.");
    } finally {
      setCapturing(false);
    }
  }, [sessionId, capturing, session]);

  const endRoom = useCallback(async () => {
    if (!sessionId) {
      void openRoom();
      return;
    }
    try {
      await fetch(`/api/photobooth/${sessionId}`, { method: "DELETE" });
    } catch {
      /* ignore; a fresh room opens either way */
    }
    void openRoom();
  }, [sessionId, openRoom]);

  const downloadAll = useCallback(() => {
    shots.forEach((shot, index) => {
      window.setTimeout(() => {
        const anchor = document.createElement("a");
        anchor.href = shot.image;
        anchor.download = `photobooth-${Date.now()}-${shots.length - index}.jpg`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }, index * 250);
    });
  }, [shots]);

  const phoneOnline = !!session?.phoneOnline;
  const live = session?.status === "live";
  const roomClosed = !session || session.status === "closed" || !!error;

  return (
    <div className="photobooth">
      <header className="photobooth__bar">
        <Link href="/" className="photobooth__home">
          <span aria-hidden="true">←</span> Back to the desk
        </Link>
        <p className="photobooth__title">photobooth</p>
      </header>

      <div className="photobooth__grid">
        {/* ---------- the live view ---------- */}
        <section className="photobooth__stage" aria-label="Live camera from your phone">
          <div className="photobooth__screen" data-live={phoneOnline ? "" : undefined}>
            {phoneOnline && session?.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="photobooth__feed"
                data-fresh={session.previewFresh ? "" : undefined}
                src={session.preview}
                alt="Live preview from the visitor's phone"
              />
            ) : (
              <div className="photobooth__placeholder">
                <span className="photobooth__spinner" aria-hidden="true" />
                <p>{roomClosed ? "This room is closed." : "Waiting for a phone to connect…"}</p>
              </div>
            )}
            {flash && <div className="photobooth__flash" aria-hidden="true" />}
            <span className="photobooth__live-dot" data-on={phoneOnline ? "" : undefined} aria-hidden="true" />
          </div>

          <div className="photobooth__controls">
            <button
              type="button"
              className="btn photobooth__shutter"
              onClick={() => void snap()}
              disabled={!phoneOnline || !live || capturing}
            >
              {capturing ? "Taking shot…" : "Take a shot"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => void endRoom()}>
              {sessionId ? "End & clear" : "New room"}
            </button>
          </div>
        </section>

        {/* ---------- the join panel ---------- */}
        <aside className="photobooth__join">
          <div className="photobooth__qr">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="Scan this QR code with your phone to open the camera" width={220} height={220} />
            ) : (
              <span className="photobooth__spinner" aria-hidden="true" />
            )}
          </div>

          <ol className="photobooth__steps">
            <li data-done={starting ? undefined : ""}>Open the room</li>
            <li data-done={phoneOnline ? "" : undefined}>Scan the code — your phone becomes the camera</li>
            <li data-done={shots.length > 0 ? "" : undefined}>Snap a few shots</li>
          </ol>

          {sessionId && (
            <p className="photobooth__code">
              <span>or enter code</span>
              <strong>{sessionId}</strong>
              <a href={`/photobooth/${sessionId}`} className="photobooth__code-link">
                open on this device →
              </a>
            </p>
          )}

          {error && <p className="photobooth__error">{error}</p>}
        </aside>
      </div>

      {/* ---------- the strip of shots ---------- */}
      <section className="photobooth__strip" aria-label="Photos taken this session">
        <div className="photobooth__strip-head">
          <h2>
            The strip {shots.length > 0 && <span className="photobooth__count">{shots.length}</span>}
          </h2>
          {shots.length > 0 && (
            <button type="button" className="photobooth__download-all" onClick={downloadAll}>
              Download all
            </button>
          )}
        </div>
        {shots.length === 0 ? (
          <p className="photobooth__strip-empty">
            {phoneOnline ? "Say cheese — shots will show up here." : "Photos will land here once a phone is connected."}
          </p>
        ) : (
          <ul className="photobooth__photos">
            {shots.map((shot, index) => (
              <li key={shot.id} className="photobooth__photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.image} alt={`Photobooth shot ${shots.length - index}`} />
                <a
                  href={shot.image}
                  download={`photobooth-${shot.id.slice(0, 8)}.jpg`}
                  className="photobooth__photo-download"
                  aria-label="Download this photo"
                >
                  ↓
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}