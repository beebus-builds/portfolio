"use client";

/**
 * The in-between screen: shown while a room is opening, and while Bibash is
 * driving between the studio and the office. It is deliberately cinematic —
 * a dimmed room behind it, a label, a progress bar, and for drives a little
 * route that fills in as the car gets closer.
 */

export type LoadingKind = "dive" | "drive";

export default function LoadingScreen({
  active,
  title,
  detail,
  kind,
  minutes,
  to,
  onSkip,
}: {
  active: boolean;
  title: string;
  detail?: string;
  kind: LoadingKind;
  /** Drive length, only used for the route animation. */
  minutes?: number;
  to?: "studio" | "office" | string;
  onSkip?: () => void;
}) {
  return (
    <div className="studio__loading-screen" data-active={active ? "" : undefined} aria-hidden={active ? undefined : true}>
      <div className="studio__loading-card">
        <p className="studio__loading-kicker">
          {kind === "drive" ? "commute" : "loading"}
          <span className="studio__loading-dots">
            <span />
            <span />
            <span />
          </span>
        </p>
        <h2 className="studio__loading-title">{title}</h2>
        {detail && <p className="studio__loading-detail">{detail}</p>}

        {kind === "drive" ? (
          <div className="studio__route" aria-hidden="true">
            <span className="studio__route-stop">
              <b />
              studio
            </span>
            <span className="studio__route-line">
              <span className="studio__route-fill" />
              <span className="studio__route-car">🚗</span>
            </span>
            <span className="studio__route-stop">
              <b />
              {to ?? ""}
            </span>
          </div>
        ) : (
          <div className="studio__progress">
            <span className="studio__progress-fill" />
          </div>
        )}

        <div className="studio__loading-foot">
          <span>{minutes ? `${minutes} min` : "one moment"}</span>
          {onSkip && (
            <button type="button" className="studio__loading-skip" onClick={onSkip}>
              skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}