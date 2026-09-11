"use client";

import { useEffect, useMemo, useState } from "react";

const CHAPTERS = [
  ["about", "01", "THE PERSON", "Origin / identity"],
  ["education", "02", "THE QUESTIONS", "Curiosity / learning"],
  ["blog", "03", "THE FAILURE", "Experiments / mistakes"],
  ["projects", "04", "THE BUILDING", "Systems / shipped work"],
  ["skills", "05", "THE TOOLKIT", "Craft / technology"],
  ["contact", "06", "THE UNKNOWN", "Future / invitation"],
] as const;

const LINES = [
  "A portfolio should leave evidence, not just impressions.",
  "Curiosity became the engine. Every question opened another route.",
  "Some systems failed. Those failures became part of the architecture.",
  "Ideas became interfaces, products, experiments and worlds.",
  "The toolkit is never finished. It keeps changing with the work.",
  "You found the edge of the map. What happens next is deliberately unfinished.",
];

export default function JourneyDirector({ discovered, secrets, complete }: { discovered: string[]; secrets: string[]; complete: boolean }) {
  const [open, setOpen] = useState(true);
  const [pulse, setPulse] = useState(0);
  const [seen, setSeen] = useState(0);

  const activeIndex = Math.min(CHAPTERS.length - 1, discovered.length);
  const currentIndex = complete ? 5 : Math.max(0, activeIndex);
  const progress = Math.round((discovered.length / CHAPTERS.length) * 100);

  useEffect(() => {
    const id = window.setInterval(() => setPulse((value) => value + 1), 3200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!discovered.length) return;
    setSeen((value) => value + 1);
  }, [discovered.length]);

  const signal = useMemo(() => {
    if (complete) return "UNKNOWN SIGNAL / STABLE";
    if (discovered.length >= 4) return "WORLD STATE / AWAKENING";
    if (discovered.length >= 2) return "WORLD STATE / RESPONDING";
    return "WORLD STATE / DORMANT";
  }, [complete, discovered.length]);

  return (
    <aside className={`journey-director ${open ? "is-open" : "is-closed"}`} aria-label="Journey director">
      <div className="journey-director-glow" />
      <header>
        <div>
          <span className="journey-director-eyebrow">JOURNEY DIRECTOR</span>
          <strong>BP / 026</strong>
        </div>
        <button onClick={() => setOpen((value) => !value)} aria-label={open ? "Collapse journey director" : "Open journey director"}>{open ? "−" : "+"}</button>
      </header>

      {open && <>
        <section className="journey-director-signal">
          <div><i className={complete ? "hot" : ""} />{signal}</div>
          <span>{String(pulse % 100).padStart(2, "0")} / LIVE</span>
        </section>

        <section className="journey-director-map" aria-label="Story map">
          <div className="journey-director-line" />
          {CHAPTERS.map(([id, number, title, sub], index) => {
            const found = discovered.includes(id) || (complete && id === "contact");
            const active = index === currentIndex;
            return <div className={`journey-node ${found ? "found" : ""} ${active ? "active" : ""}`} key={id}>
              <span className="journey-node-dot" />
              <div><small>{number}</small><b>{title}</b><em>{sub}</em></div>
            </div>;
          })}
        </section>

        <section className="journey-director-objective">
          <span>DIRECTIVE</span>
          <p>{LINES[currentIndex]}</p>
          <div className="journey-director-progress"><i style={{ width: `${progress}%` }} /></div>
          <footer><b>{String(discovered.length).padStart(2, "0")} / 06 CHAPTERS</b><span>{secrets.length} MEMORY SHARDS</span></footer>
        </section>

        <div className="journey-director-footer"><span>DISCOVERY EVENTS {seen}</span><span>LOCAL STATE SAVED</span></div>
      </>}
    </aside>
  );
}
