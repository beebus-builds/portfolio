"use client";

/**
 * The thing that actually plays: an iframe for YouTube and Vimeo, an audio or
 * video element for files. It is mounted as an `<Html transform>` inside the
 * monitor, so the video sits on the screen in the room rather than on top of
 * the page — one CSS pixel is a sixtieth of a centimetre of monitor.
 *
 * `radio` and `link` items never reach this component: the radio is synthesised
 * in JavaScript and a plain link just opens in a new tab.
 */

import { Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { MediaItem } from "@/lib/studio";

/** The monitor's screen, in metres, measured on the model. */
const SCREEN_W = 1.28;
const SCREEN_H = 0.61;

/** `distanceFactor={1}` makes one CSS pixel 1/400 of a metre. */
const DPI = 400;

function Surface({ item, volume }: { item: MediaItem; volume: number }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // A click in the deck already granted audio, but some browsers still
    // refuse the first attempt; the second try is free.
    const start = (element: HTMLMediaElement | null | undefined) =>
      element?.play().catch(() => {
        window.setTimeout(() => void element?.play().catch(() => {}), 250);
      });
    start(audio.current ?? video.current);
  }, []);

  useEffect(() => {
    const element = audio.current ?? video.current;
    if (element) element.volume = volume;
  }, [volume]);

  if (item.kind === "audio") {
    return (
      <div className="studio__media-video studio__media--audio" role="document">
        <audio ref={audio} src={item.src} autoPlay loop controls className="studio__media-element" />
        <div className="studio__media-overlay">
          <span className="studio__media-title">{item.title}</span>
          {item.by && <span className="studio__media-artist">by {item.by}</span>}
        </div>
      </div>
    );
  }
  if (item.kind === "video") {
    return (
      <div className="studio__media-video" role="document">
        <video 
          ref={video} 
          src={item.src} 
          autoPlay 
          loop 
          playsInline 
          controls
          className="studio__media-element"
        />
        <div className="studio__media-overlay">
          <span className="studio__media-title">{item.title}</span>
          {item.by && <span className="studio__media-artist">by {item.by}</span>}
        </div>
      </div>
    );
  }
  return (
    <iframe
      className="studio__media-embed"
      src={item.src}
      title={item.title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

export default function MonitorMedia({
  item,
  volume = 0.8,
  onSelect,
}: {
  item: MediaItem | null;
  volume?: number;
  onSelect: (kind: string) => void;
}) {
  if (!item || (item.kind !== "youtube" && item.kind !== "vimeo" && item.kind !== "audio" && item.kind !== "video")) {
    return null;
  }
  return (
    <Html
      transform
      distanceFactor={1}
      position={[0, 0.385, 0.021]}
      zIndexRange={[40, 0]}
      style={{ width: SCREEN_W * DPI, height: SCREEN_H * DPI, fontFamily: "system-ui, sans-serif" }}
      pointerEvents="auto"
    >
      <div className="studio__media" role="document" aria-label={`${item.title} on the monitor`} onClick={(e) => {
        e.stopPropagation();
        onSelect(item.kind);
      }}>
        <Surface key={item.id} item={item} volume={volume} />
      </div>
    </Html>
  );
}