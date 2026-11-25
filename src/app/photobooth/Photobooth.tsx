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
import { PHOTOBOOTH_TOKEN_HEADER } from "@/lib/photoboothProtocol";

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

type Shot = { id: string; image: string; createdAt: string };

type CreatedRoom = {
  id: string;
  desktopToken: string;
  joinToken: string;
};

const POLL_MS = 700;

async function postJson<T>(url: string, body?: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers[PHOTOBOOTH_TOKEN_HEADER] = token;
  const response = await fetch(url, {
    method: "POST",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
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
  const [desktopToken, setDesktopToken] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const requested = useRef<Set<string>>(new Set());
  const photoFailures = useRef<Map<string, number>>(new Map());
  const photoRetryTimer = useRef<number | null>(null);
  const activeRoomId = useRef<string | null>(null);
  const [photoRetryNonce, setPhotoRetryNonce] = useState(0);
  const photoMeta = useRef<SessionState["photos"]>([]);
  photoMeta.current = session?.photos ?? [];
  const roomGeneration = useRef(0);
  const mountedRoom = useRef<{ id: string; token: string } | null>(null);
  const roomRequest = useRef<Promise<void> | null>(null);
  const mounted = useRef(false);
  activeRoomId.current = sessionId;

  /* ---------- open a room ---------- */
  const openRoom = useCallback((force = false): Promise<void> => {
    // Strict Mode replays mount effects. Share the in-flight request instead
    // of creating an abandoned room on every replay.
    if (!force && roomRequest.current) return roomRequest.current;

    const generation = ++roomGeneration.current;
    setStarting(true);
    setError(null);
    setSession(null);
    setSessionId(null);
    setDesktopToken(null);
    setJoinToken(null);
    setQr(null);
    setShots([]);
    requested.current = new Set();
    photoFailures.current.clear();
    if (photoRetryTimer.current) window.clearTimeout(photoRetryTimer.current);
    photoRetryTimer.current = null;

    const request = (async () => {
      try {
        const room = await postJson<CreatedRoom>("/api/photobooth");
        if (generation !== roomGeneration.current || !mounted.current) {
          // A newer room won the race, or the page closed. Remove this one.
          await fetch(`/api/photobooth/${room.id}`, {
            method: "DELETE",
            headers: { [PHOTOBOOTH_TOKEN_HEADER]: room.desktopToken },
            keepalive: true,
          }).catch(() => undefined);
          return;
        }
        mountedRoom.current = { id: room.id, token: room.desktopToken };
        setSessionId(room.id);
        setDesktopToken(room.desktopToken);
        setJoinToken(room.joinToken);
      } catch (err) {
        if (generation === roomGeneration.current && mounted.current) {
          setError(err instanceof Error ? err.message : "The photobooth could not start.");
        }
      } finally {
        if (generation === roomGeneration.current && mounted.current) setStarting(false);
      }
    })();

    roomRequest.current = request;
    void request.finally(() => {
      if (roomRequest.current === request) roomRequest.current = null;
    });
    return request;
  }, []);

  useEffect(() => {
    mounted.current = true;
    void openRoom();
    return () => {
      mounted.current = false;
      // A microtask lets Strict Mode's effect replay mark the component mounted
      // again before we decide that this really was an unmount.
      queueMicrotask(() => {
        if (mounted.current) return;
        roomGeneration.current += 1;
        activeRoomId.current = null;
        if (photoRetryTimer.current) window.clearTimeout(photoRetryTimer.current);
        photoRetryTimer.current = null;
        const room = mountedRoom.current;
        mountedRoom.current = null;
        if (!room) return;
        void fetch(`/api/photobooth/${room.id}`, {
          method: "DELETE",
          headers: { [PHOTOBOOTH_TOKEN_HEADER]: room.token },
          keepalive: true,
        }).catch(() => undefined);
      });
    };
  }, [openRoom]);

  /* ---------- render the QR code once we have an id ---------- */
  useEffect(() => {
    if (!sessionId || !joinToken) return;
    let cancelled = false;
    // The join capability stays in the URL fragment: it is never sent in a
    // page request, referrer header or server log.
    const url = `${window.location.origin}/photobooth/${sessionId}#join=${encodeURIComponent(joinToken)}`;
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
  }, [sessionId, joinToken]);

  const copyCameraLink = useCallback(async () => {
    if (!sessionId || !joinToken) return;
    const link = `${window.location.origin}/photobooth/${sessionId}#join=${encodeURIComponent(joinToken)}`;
    setError(null);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1_800);
    } catch {
      setError("Could not copy the camera link. Scan the QR code instead.");
    }
  }, [sessionId, joinToken]);

  /* ---------- poll the room ---------- */
  useEffect(() => {
    if (!sessionId || !desktopToken) return;
    let stopped = false;
    let inFlight = false;

    const tick = async () => {
      if (inFlight || stopped) return;
      inFlight = true;
      try {
        const response = await fetch(`/api/photobooth/${sessionId}`, {
          cache: "no-store",
          headers: { [PHOTOBOOTH_TOKEN_HEADER]: desktopToken },
        });
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
  }, [sessionId, desktopToken]);

  /* ---------- load any new shots' bytes ---------- */
  const photoKey = session?.photos.map((photo) => photo.id).join(",") ?? "";
  useEffect(() => {
    if (!sessionId || !desktopToken) return;
    const roomId = sessionId;
    for (const photo of photoMeta.current) {
      if (requested.current.has(photo.id)) continue;
      requested.current.add(photo.id);
      fetch(`/api/photobooth/${roomId}/photos/${photo.id}`, {
        cache: "no-store",
        headers: { [PHOTOBOOTH_TOKEN_HEADER]: desktopToken },
      })
        .then((response) => {
          if (!response.ok) throw new Error(`photo ${response.status}`);
          return response.json() as Promise<{ image?: string }>;
        })
        .then((data) => {
          if (!data.image) throw new Error("photo payload was empty");
          if (activeRoomId.current !== roomId) {
            requested.current.delete(photo.id);
            return;
          }
          photoFailures.current.delete(photo.id);
          setFlash(true);
          window.setTimeout(() => setFlash(false), 180);
          setShots((current) => {
            if (current.some((shot) => shot.id === photo.id)) return current;
            return [{ id: photo.id, image: data.image!, createdAt: photo.createdAt }, ...current].sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt)
            );
          });
        })
        .catch(() => {
          // A transient failure should be retried with bounded backoff.
          requested.current.delete(photo.id);
          if (activeRoomId.current !== roomId) return;
          const failures = (photoFailures.current.get(photo.id) ?? 0) + 1;
          photoFailures.current.set(photo.id, failures);
          const delay = Math.min(1_000 * 2 ** (failures - 1), 15_000);
          if (photoRetryTimer.current) window.clearTimeout(photoRetryTimer.current);
          photoRetryTimer.current = window.setTimeout(() => {
            photoRetryTimer.current = null;
            if (activeRoomId.current === roomId) setPhotoRetryNonce((value) => value + 1);
          }, delay);
        });
    }
  }, [photoKey, photoRetryNonce, sessionId, desktopToken]);

  /* ---------- take a shot from here ---------- */
  const snap = useCallback(async () => {
    if (!sessionId || !desktopToken || capturing) return;
    if (!session?.phoneOnline || session.status !== "live") return;
    setCapturing(true);
    setError(null);
    try {
      await postJson(`/api/photobooth/${sessionId}/capture`, undefined, desktopToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not take the shot.");
    } finally {
      setCapturing(false);
    }
  }, [sessionId, desktopToken, capturing, session]);

  const endRoom = useCallback(async () => {
    if (!sessionId || !desktopToken) {
      void openRoom(true);
      return;
    }
    try {
      const response = await fetch(`/api/photobooth/${sessionId}`, {
        method: "DELETE",
        headers: { [PHOTOBOOTH_TOKEN_HEADER]: desktopToken },
      });
      if (!response.ok && response.status !== 404) {
        setError("Could not clear the room. Please try again.");
        return;
      }
      mountedRoom.current = null;
      void openRoom(true);
    } catch {
      setError("Could not clear the room. Check your connection and try again.");
    }
  }, [sessionId, desktopToken, openRoom]);

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
  const roomClosed = session?.status === "closed";

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
                <p>
                  {starting
                    ? "Opening the room…"
                    : roomClosed
                      ? "This room is closed."
                      : error && !session
                        ? error
                        : "Waiting for a phone to connect…"}
                </p>
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

          {sessionId && joinToken && (
            <p className="photobooth__code">
              <span>room code</span>
              <strong>{sessionId}</strong>
              <button
                type="button"
                className="photobooth__code-link"
                onClick={() => void copyCameraLink()}
                aria-live="polite"
              >
                {linkCopied ? "camera link copied ✓" : "copy camera link →"}
              </button>
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