"use client";

/**
 * The monitor's media deck. It lists the built-in lo-fi radio (synthesised in
 * the browser, so it always works offline) and any links Bibash has pinned,
 * plus whatever the visitor pastes in — YouTube, Vimeo, an mp3 or mp4 file, or
 * anything else playable, which then plays on the monitor in the room.
 */

import { useEffect, useState } from "react";
import { MEDIA_LINKS, mediaLibrary, parseMediaInput, RADIO, type MediaItem } from "@/lib/studio";

const STORE_KEY = "studio.media.links";

function loadLinks(): { title?: string; url: string }[] {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is { title?: string; url: string } => {
      return typeof entry === "object" && entry !== null && typeof (entry as { url?: unknown }).url === "string";
    });
  } catch {
    return [];
  }
}

export default function MediaDeck({
  open,
  playing,
  onPlay,
  onClose,
  onClear,
}: {
  open: boolean;
  playing: MediaItem | null;
  onPlay: (item: MediaItem) => void;
  onClose: () => void;
  onClear: () => void;
}) {
  const [links, setLinks] = useState<{ title?: string; url: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setLinks(loadLinks());
  }, [open]);

  const commit = (next: { title?: string; url: string }[]) => {
    setLinks(next);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* private mode: the links just won't survive a reload */
    }
  };

  const add = () => {
    const item = parseMediaInput(draft);
    if (!item) {
      setError("That doesn't look like a link I can play.");
      return;
    }
    setError(null);
    setDraft("");
    commit([...links.filter((entry) => entry.url !== item.url), { title: item.title, url: item.url }]);
    onPlay(item);
  };

  const library = mediaLibrary([...MEDIA_LINKS, ...links]);
  const groups: { label: string; items: MediaItem[] }[] = [
    { label: "radio · synthesised here", items: RADIO },
    { label: "links", items: library.filter((item) => item.kind !== "radio") },
  ];

  return (
    <aside className="studio__deck" data-open={open ? "" : undefined} aria-label="Media on the monitor" aria-hidden={open ? undefined : true}>
      <header className="studio__deck-head">
        <div>
          <p className="studio__deck-title">studio.tv</p>
          <p className="studio__deck-now">{playing ? `playing · ${playing.title}` : "nothing playing"}</p>
        </div>
        <button type="button" className="studio__deck-close" onClick={onClose} aria-label="Close the media deck">
          ✕
        </button>
      </header>

      <div className="studio__deck-body">
        {groups.map((group) => (
          <section key={group.label} className="studio__deck-group">
            <h3>{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="studio__deck-item"
                    data-active={playing?.id === item.id ? "" : undefined}
                    onClick={() => onPlay(item)}
                  >
                    <span className="studio__deck-item-main">
                      <span className="studio__deck-item-title">{item.title}</span>
                      <span className="studio__deck-item-by">
                        {item.by ?? item.kind}
                        {item.blurb ? ` · ${item.blurb}` : ""}
                      </span>
                    </span>
                    <span className="studio__deck-item-kind">{item.kind}</span>
                  </button>
                </li>
              ))}
              {group.label === "links" && group.items.length === 0 && (
                <li className="studio__deck-empty">Paste a YouTube, Vimeo or mp3 link below and it plays on the monitor.</li>
              )}
            </ul>
          </section>
        ))}

        {links.length > 0 && (
          <section className="studio__deck-group">
            <h3>your links</h3>
            <ul>
              {links.map((link, index) => (
                <li key={link.url}>
                  <span className="studio__deck-item studio__deck-item--static">
                    <span className="studio__deck-item-main">
                      <span className="studio__deck-item-title">{link.title ?? link.url}</span>
                      <span className="studio__deck-item-by">{link.url}</span>
                    </span>
                    <button
                      type="button"
                      className="studio__deck-remove"
                      onClick={() => commit(links.filter((_, i) => i !== index))}
                      aria-label={`Remove ${link.title ?? link.url}`}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="studio__deck-foot">
        <label className="studio__deck-paste">
          <span>Play a link</span>
          <input
            type="text"
            inputMode="url"
            placeholder="youtu.be/… · vimeo.com/… · song.mp3"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
              event.stopPropagation();
            }}
          />
        </label>
        <div className="studio__deck-actions">
          <button type="button" className="studio__deck-add" onClick={add} disabled={!draft.trim()}>
            Play on the monitor
          </button>
          {playing && (
            <button type="button" className="studio__deck-stop" onClick={onClear}>
              Stop
            </button>
          )}
        </div>
        {error && <p className="studio__deck-error">{error}</p>}
      </footer>
    </aside>
  );
}