"use client";

/**
 * A little browser that lives on the studio monitor. It renders as an
 * `<Html transform>` on the screen in the room — the same trick the video
 * player uses — so it feels like a real browser inside the 3D world.
 *
 * It knows about the portfolio's own pages (About, Projects, …) plus a few
 * external links. Studio pages show a stylized summary; anything else offers
 * to open in a real tab. History is local to this session.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { ROUTES } from "@/lib/studio";
import { MONITOR_DPI, MONITOR_HTML_POSITION, MONITOR_SCREEN_H, MONITOR_SCREEN_W } from "./monitorGeometry";
import {
  BROWSER_SITES,
  HOME_KEY,
  TV_KEY,
  type AddressTarget,
  addressFor,
  resolveAddress,
} from "@/lib/browser";

type BrowserTab = {
  key: string;
  /** The address shown in the bar. */
  address: string;
  /** `studio://` sites or an external URL. */
  target: AddressTarget;
};

const HISTORY_LIMIT = 24;

/** Stylized summaries for the studio's own pages, shown inside the browser. */
const PAGE_CONTENT: Record<
  string,
  { title: string; blurb: string; points: string[] }
> = {
  about: {
    title: "About",
    blurb: "who I am",
    points: [
      "Bibash Poudel — creative developer based in Sindhuli, Nepal (UTC+05:45).",
      "Started in WordPress and PHP, now working across Next.js, TypeScript, and design systems.",
      "This portfolio is his desk: pull up a chair while he codes, sips coffee, and changes the music.",
    ],
  },
  projects: {
    title: "Projects",
    blurb: "what I shipped",
    points: [
      "Interfaces with intent, backends that hold their weight, and the unglamorous plumbing.",
      "Small teams, hard problems, and products where the details are the point.",
      "Open to work.",
    ],
  },
  skills: {
    title: "Skills",
    blurb: "what I can build",
    points: [
      "Next.js, TypeScript, React, Tailwind.",
      "Design systems and the last 10% of craft.",
      "Accessibility, performance, and shipping.",
    ],
  },
  experience: {
    title: "Experience",
    blurb: "where I've worked",
    points: [
      "WordPress and PHP roots.",
      "Browser-first product engineering.",
      "Remote teams everywhere.",
    ],
  },
  services: {
    title: "Services",
    blurb: "how I can help",
    points: [
      "Interface and product development.",
      "Design systems and frontend architecture.",
      "Available for new projects.",
    ],
  },
  resume: {
    title: "Resume",
    blurb: "the printed record",
    points: [
      "Work history and skills on one page.",
      "Download or get in touch.",
    ],
  },
  contact: {
    title: "Contact",
    blurb: "say hello",
    points: [
      "poudelbibash044@gmail.com",
      "GitHub and LinkedIn.",
      "Send the offer.",
    ],
  },
};

export default function MonitorBrowser({
  open,
  onClose,
  onOpenSite,
  onOpenExternal,
}: {
  open: boolean;
  onClose: () => void;
  /** The visitor chose a studio page: open it for real on the site. */
  onOpenSite: (href: string) => void;
  /** The visitor chose an external link: open it in a new tab. */
  onOpenExternal: (url: string) => void;
}) {
  const [history, setHistory] = useState<BrowserTab[]>([
    { key: HOME_KEY, address: addressFor(HOME_KEY), target: { kind: "site", key: HOME_KEY } },
  ]);
  const [draft, setDraft] = useState("");
  const [addressFocused, setAddressFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addressInput = useRef<HTMLInputElement | null>(null);

  const current = history[history.length - 1];
  const canBack = history.length > 1;

  const goBack = useCallback(() => {
    if (!canBack) return;
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setDraft("");
    setAddressFocused(false);
    setError(null);
  }, [canBack]);

  const navigate = useCallback(
    (raw: string) => {
      const target = resolveAddress(raw);
      if (!target) {
        setError("That address didn't resolve.");
        return;
      }
      setError(null);
      setAddressFocused(false);
      setDraft(addressForTarget(target));
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        // Repeating the current address should not add a redundant history step.
        if (last && targetKey(last.target) === targetKey(target)) return prev;
        const next = [...prev, { key: targetKey(target), address: addressForTarget(target), target }];
        return next.slice(-HISTORY_LIMIT);
      });
    },
    []
  );

  const submitDraft = useCallback(() => {
    if (!draft.trim()) return;
    navigate(draft);
  }, [draft, navigate]);

  const openSite = useCallback(
    (slug: string) => {
      onOpenSite(slug);
      onClose();
    },
    [onOpenSite, onClose]
  );

  const openExternal = useCallback(
    (url: string) => {
      onOpenExternal(url);
    },
    [onOpenExternal]
  );

  const content = useMemo(() => {
    if (!current) return null;
    const { target } = current;
    if (target.kind === "site") {
      const page = PAGE_CONTENT[target.key];
      if (page) {
        const route = ROUTES.find((r) => r.slug === target.key);
        return { kind: "page", page, route };
      }
      const site = BROWSER_SITES.find((s) => s.key === target.key);
      return { kind: "site", key: target.key, title: site?.title ?? target.key };
    }
    return { kind: "external", url: target.url };
  }, [current]);

  const pageEntry = content?.kind === "page" ? content : null;
  const externalEntry = content?.kind === "external" ? content : null;
  const siteEntry = content?.kind === "site" ? content : null;

  const pageRoute = pageEntry?.route?.slug ?? "";
  const pageTitle = pageEntry?.page?.title ?? "";
  const pageBlurb = pageEntry?.page?.blurb ?? "";
  const pagePoints = pageEntry?.page?.points ?? [];
  const externalUrl = externalEntry?.url ?? "";
  const siteTitle = siteEntry?.title ?? "";
  const siteKey = siteEntry?.key ?? "";
  const showStartPage = !pageEntry && !externalEntry && (!siteEntry || siteKey === HOME_KEY);

  if (!open) return null;

  return (
    <Html
      transform
      distanceFactor={1}
      position={MONITOR_HTML_POSITION}
      zIndexRange={[50, 0]}
      style={{ width: MONITOR_SCREEN_W * MONITOR_DPI, height: MONITOR_SCREEN_H * MONITOR_DPI }}
      pointerEvents="auto"
    >
      <div className="studio__browser" role="document" aria-label="Browser on the monitor">
        {/* Chrome */}
        <header className="studio__browser-chrome">
          <button
            type="button"
            className={`studio__browser-back${canBack ? "" : " studio__browser-back--disabled"}`}
            onClick={goBack}
            aria-label="Back"
            disabled={!canBack}
          >
            ←
          </button>
          <input
            ref={addressInput}
            className="studio__browser-address"
            type="text"
            value={addressFocused ? draft : current?.address ?? ""}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Enter") {
                event.preventDefault();
                submitDraft();
              }
            }}
            onFocus={() => {
              setDraft(current?.address ?? "");
              setAddressFocused(true);
            }}
            onBlur={() => setAddressFocused(false)}
            placeholder="studio://about · github · https://…"
            aria-label="Address bar"
          />
          <button type="button" className="studio__browser-go" onClick={submitDraft} aria-label="Go">
            Go
          </button>
          <button type="button" className="studio__browser-close" onClick={onClose} aria-label="Close the browser">
            ✕
          </button>
        </header>

        {/* Content */}
        <div className="studio__browser-body">
          {pageRoute && (
            <section className="studio__browser-page">
              <h2>{pageTitle}</h2>
              <p className="studio__browser-page-blurb">{pageBlurb}</p>
              <ul className="studio__browser-points">
                {pagePoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
              <button
                type="button"
                className="studio__browser-open-site"
                onClick={() => openSite(pageRoute)}
              >
                ↗ open {pageTitle} on the site
              </button>
            </section>
          )}

          {externalUrl && (
            <section className="studio__browser-page">
              <h2>{externalUrl}</h2>
              <p className="studio__browser-page-blurb">External link — opens in a new tab.</p>
              <button type="button" className="studio__browser-open-site" onClick={() => openExternal(externalUrl)}>
                ↗ open in new tab
              </button>
            </section>
          )}

          {siteEntry && siteKey !== HOME_KEY && (
            <section className="studio__browser-page">
              <h2>{siteTitle}</h2>
              <p className="studio__browser-page-blurb">
                {siteKey === TV_KEY
                  ? "Lo-fi radio and your pinned links play on the monitor. Press m to open the media deck."
                  : "Visit this page on the site."}
              </p>
            </section>
          )}

          {/* Start page: tiles for everything we know. */}
          {showStartPage && (
            <section className="studio__browser-start">
              <h2>start</h2>
              <p className="studio__browser-start-blurb">Sites you can visit from the monitor.</p>

              <div className="studio__browser-tiles">
                {BROWSER_SITES.map((site) => {
                  const route = ROUTES.find((r) => r.slug === site.key);
                  return (
                    <button
                      key={site.key}
                      type="button"
                      className="studio__browser-tile"
                      onClick={() => {
                        navigate(site.path);
                        addressInput.current?.blur();
                      }}
                    >
                      <span className="studio__browser-tile-icon">{site.icon}</span>
                      <span className="studio__browser-tile-title">{site.title}</span>
                      <span className="studio__browser-tile-blurb">{site.blurb}</span>
                      {route && (
                        <span className="studio__browser-tile-key" aria-hidden="true">
                          {route.key}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="studio__browser-tile-group">
                <h3>elsewhere</h3>
                <div className="studio__browser-tiles">
                  {[
                    { key: "github", title: "GitHub", icon: "⌨", url: "https://github.com/beebus-builds" },
                    { key: "linkedin", title: "LinkedIn", icon: "💼", url: "https://linkedin.com/in/bibashpoudel" },
                    { key: "mail", title: "Email", icon: "✉", url: "mailto:poudelbibash044@gmail.com" },
                  ].map((link) => (
                    <button
                      key={link.key}
                      type="button"
                      className="studio__browser-tile studio__browser-tile--external"
                      onClick={() => {
                        navigate(link.url);
                        addressInput.current?.blur();
                      }}
                    >
                      <span className="studio__browser-tile-icon">{link.icon}</span>
                      <span className="studio__browser-tile-title">{link.title}</span>
                      <span className="studio__browser-tile-blurb">opens in a new tab</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {error && <p className="studio__browser-error">{error}</p>}
        </div>

        <footer className="studio__browser-foot">
          <span className="studio__browser-hint">
            {canBack ? "← back · " : ""}type an address and press Enter
          </span>
        </footer>
      </div>
    </Html>
  );
}

function addressForTarget(target: AddressTarget): string {
  if (target.kind === "site") return addressFor(target.key);
  return target.url;
}

function targetKey(target: AddressTarget): string {
  if (target.kind === "site") return target.key;
  return target.url;
}
