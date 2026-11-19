"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { currentChapter, storyProgress, STORY } from "@/lib/cityStory";
import {
  BUILDINGS,
  BUILDING_ORDER,
  DISTRICTS,
  GRID_H,
  GRID_W,
  advanceCycle,
  checkPlacement,
  createInitialState,
  deserialize,
  goalsFor,
  levelFor,
  markVisited,
  placeBuilding,
  serialize,
  type BuildingKey,
  type CityState,
  type DistrictId,
} from "@/lib/citySim";

const CityScene = dynamic(() => import("./CityScene"), { ssr: false });

const SAVE_KEY = "bp07_city_v1";
const TICK_MS = 1400;

/** Where the mayor's message lives — updates briefly after each action. */
type Notice = { text: string; tone: "good" | "bad" };

function loadCity(): CityState {
  if (typeof window === "undefined") return createInitialState();
  try {
    return deserialize(window.localStorage.getItem(SAVE_KEY)) ?? createInitialState();
  } catch {
    return createInitialState();
  }
}

export default function CitySim() {
  const [city, setCity] = useState<CityState>(loadCity);
  const [selected, setSelected] = useState<BuildingKey>("home");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [view, setView] = useState<"3d" | "flat">("3d");
  const [chapterIndex, setChapterIndex] = useState<number | null>(null);

  // WebGL is optional: visitors without it (or with a stale GPU) get the same
  // city as an ordinary interactive map instead of a blank canvas.
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const supported = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      if (!supported) setView("flat");
    } catch {
      setView("flat");
    }
  }, []);

  // A lazy clock keeps the economy moving without draining a background tab.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setCity((current) => advanceCycle(current));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SAVE_KEY, serialize(city));
    } catch {
      /* storage is optional — the city still plays for this session */
    }
  }, [city]);

  const level = levelFor(city.xp);
  const goals = useMemo(() => goalsFor(city), [city]);
  const story = storyProgress(city);
  const activeChapter = chapterIndex !== null && story.unlocked.includes(chapterIndex)
    ? STORY[chapterIndex]!
    : currentChapter(city);

  const router = useRouter();
  const visit = useCallback((id: DistrictId) => {
    setCity((current) => markVisited(current, id));
  }, []);

  /** A 3D marker has no anchor element, so navigate explicitly. */
  const openDistrict = useCallback(
    (id: DistrictId) => {
      visit(id);
      router.push(`/${id}`);
    },
    [router, visit]
  );

  const build = useCallback(
    (x: number, y: number) => {
      const result = checkPlacement(city, selected, x, y);
      if (result !== "ok") {
        const text =
          result === "occupied"
            ? "That plot is taken. Pick an empty one."
            : result === "locked"
              ? "Earn more experience to unlock that building."
              : result === "poor"
                ? "Not enough credits yet. Wait for the next cycle."
                : "That plot cannot be built on.";
        setNotice({ text, tone: "bad" });
        return;
      }
      setCity((current) => placeBuilding(current, selected, x, y));
      setNotice({ text: `${BUILDINGS[selected].name} opened for business.`, tone: "good" });
    },
    [city, selected]
  );

  const reset = () => {
    setCity(createInitialState());
    setNotice({ text: "A fresh city, ready to build.", tone: "good" });
  };

  return (
    <div className="city">
      <div className="city__toolbar">
        <div className="city__stats" aria-label="City resources">
          <div>
            <span>Credits</span>
            <b>¤ {city.credits.toLocaleString()}</b>
          </div>
          <div>
            <span>Population</span>
            <b>{city.population}</b>
          </div>
          <div>
            <span>Morale</span>
            <b>{city.happiness}%</b>
          </div>
          <div>
            <span>Mayor level</span>
            <b>{level}</b>
          </div>
          <div>
            <span>Cycle</span>
            <b>{city.cycle}</b>
          </div>
        </div>
        <div className="city__toolbar-actions">
          <button
            type="button"
            className="city__reset"
            aria-label={`Switch to ${view === "3d" ? "text" : "3D"} view`}
            onClick={() => setView((current) => (current === "3d" ? "flat" : "3d"))}
          >
            {view === "3d" ? "Text view" : "3D view"}
          </button>
          <button type="button" className="city__reset" onClick={reset}>
            New city
          </button>
        </div>
      </div>

      {notice && (
        <p className="city__notice" data-tone={notice.tone} role="status">
          {notice.text}
        </p>
      )}

      <div className="city__layout">
        <section className="city__mapwrap" aria-label="City map">
          {view === "3d" && (
            <div className="city__scene">
              <CityScene city={city} selected={selected} onPlot={build} onDistrict={openDistrict} />
            </div>
          )}
          {view === "flat" && (
            <div
              className="city__map"
              style={{ gridTemplateColumns: `repeat(${GRID_W}, 1fr)`, gridTemplateRows: `repeat(${GRID_H}, 1fr)` }}
            >
            {city.tiles.map((tile, index) => {
              const x = index % GRID_W;
              const y = Math.floor(index / GRID_W);
              const key = `tile-${index}`;

              if (!tile) {
                return (
                  <button
                    type="button"
                    key={key}
                    className="city__plot"
                    aria-label={`Empty plot at ${x + 1}, ${y + 1}. Build ${BUILDINGS[selected].name}.`}
                    onClick={() => build(x, y)}
                  >
                    <span aria-hidden="true">+</span>
                  </button>
                );
              }
              if (tile.kind === "road") return <div key={key} className="city__road" aria-hidden="true" />;
              if (tile.kind === "hall") {
                return (
                  <div key={key} className="city__hall" title="City Hall">
                    <span aria-hidden="true">⌂</span>
                  </div>
                );
              }
              if (tile.kind === "district") {
                const district = DISTRICTS.find((entry) => entry.id === tile.id);
                if (!district) return null;
                const unlocked = level >= district.level;
                const visited = city.visited.includes(district.id);
                const className = `city__district${unlocked ? "" : " is-locked"}${visited ? " is-visited" : ""}`;
                const label = `${district.label}: ${district.blurb}${unlocked ? "" : " (locked)"}`;
                return unlocked ? (
                  <Link
                    key={key}
                    href={`/${district.id}`}
                    className={className}
                    title={label}
                    onClick={() => visit(district.id)}
                  >
                    <span aria-hidden="true">{district.icon}</span>
                    <small>{district.label}</small>
                  </Link>
                ) : (
                  <div key={key} className={className} title={label}>
                    <span aria-hidden="true">⌁</span>
                    <small>Lv {district.level}</small>
                  </div>
                );
              }
              const def = BUILDINGS[tile.key];
              return (
                <div key={key} className="city__building" title={`${def.name} — ${def.blurb}`}>
                  <span aria-hidden="true">{def.icon}</span>
                </div>
              );
            })}
            </div>
          )}
          <p className="city__hint">
            Pick a building, then click an empty plot. Each cycle collects revenue. Click a district marker to
            leave the map and read that part of the portfolio. Drag to orbit the 3D city; scroll to zoom.
          </p>
        </section>

        <aside className="city__sidebar">
          <section aria-label="Building palette">
            <h2>Build</h2>
            <div className="city__palette">
              {BUILDING_ORDER.map((key) => {
                const def = BUILDINGS[key];
                const locked = def.level > level;
                const affordable = city.credits >= def.cost;
                return (
                  <button
                    type="button"
                    key={key}
                    className="city__option"
                    data-selected={selected === key || undefined}
                    data-locked={locked || undefined}
                    aria-pressed={selected === key}
                    disabled={locked}
                    onClick={() => setSelected(key)}
                  >
                    <span className="city__option-icon" aria-hidden="true">
                      {def.icon}
                    </span>
                    <span className="city__option-text">
                      <b>{def.name}</b>
                      <small>{locked ? `Unlocks at level ${def.level}` : `¤ ${def.cost} · +${def.income}/cycle`}</small>
                    </span>
                    {!affordable && !locked && <span className="city__option-warn">low funds</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="city__story" aria-label="The story so far">
            <h2>The story so far</h2>
            <p className="city__story-kicker">{activeChapter.kicker}</p>
            <h3>{activeChapter.title}</h3>
            {activeChapter.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <div className="city__story-nav">
              {STORY.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  aria-label={`Read chapter ${index + 1}: ${chapter.title}`}
                  aria-current={index === chapterIndex || (chapterIndex === null && index === story.active) ? "step" : undefined}
                  data-unlocked={story.unlocked.includes(index) || undefined}
                  disabled={!story.unlocked.includes(index)}
                  onClick={() => setChapterIndex(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <small>Unlocked by: {activeChapter.unlockedBy}</small>
          </section>

          <section aria-label="Goals">
            <h2>Mayor&apos;s goals</h2>
            <ul className="city__goals">
              {goals.map((goal) => (
                <li key={goal.id} data-done={goal.done || undefined}>
                  <span aria-hidden="true">{goal.done ? "✓" : "○"}</span>
                  <div>
                    <b>{goal.label}</b>
                    <small>{goal.progress}</small>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Districts">
            <h2>Districts</h2>
            <ul className="city__district-list">
              {DISTRICTS.map((district) => {
                const unlocked = level >= district.level;
                return (
                  <li key={district.id} data-locked={!unlocked || undefined}>
                    <span aria-hidden="true">{district.icon}</span>
                    {unlocked ? (
                      <Link href={`/${district.id}`} onClick={() => visit(district.id)}>
                        {district.label} <small>— {district.blurb}</small>
                      </Link>
                    ) : (
                      <span>
                        {district.label} <small>— unlocks at level {district.level}</small>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
