"use client";

import { useState } from "react";
import { planets, profile, type SectionId } from "@/lib/profile";
import SectionContent from "./SectionContent";

/**
 * The whole portfolio without WebGL: same content, same panels, laid out as a
 * quiet two-column document. Used for reduced-motion, unsupported browsers and
 * anyone who prefers reading to flying.
 */
export default function FlatExplorer() {
  const [active, setActive] = useState<SectionId>("about");
  const planet = planets.find((item) => item.id === active) ?? planets[0];

  return (
    <div className="flat">
      <header className="flat__header">
        <div>
          <p className="flat__eyebrow">
            {profile.callSign} · {profile.coordinates}
          </p>
          <h1>{profile.name}</h1>
          <p className="flat__role">
            {profile.role} · {profile.location} · {profile.timezone}
          </p>
        </div>
        <p className="flat__status">
          <i /> {profile.status}
        </p>
      </header>

      <div className="flat__layout">
        <nav className="flat__nav" aria-label="Sections">
          {planets.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              data-active={item.id === active || undefined}
              style={{ ["--planet" as string]: item.glowColor }}
            >
              <span className="flat__nav-dot" />
              <span>
                <b>{item.label}</b>
                <small>{item.title} · {item.blurb}</small>
              </span>
            </button>
          ))}
          <a className="flat__resume" href="/resume.pdf" download>
            Download resume.pdf ↓
          </a>
        </nav>

        <article className="flat__panel" style={{ ["--planet" as string]: planet.glowColor }}>
          <header>
            <span className="flat__kicker">{planet.kicker}</span>
            <h2>{planet.label}</h2>
            <p>{planet.readout}</p>
          </header>
          <p className="flat__blurb">{planet.blurb}</p>
          <SectionContent id={planet.id} />
        </article>
      </div>
    </div>
  );
}
