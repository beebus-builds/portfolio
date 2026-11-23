"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, ViewTransition } from "react";
import { createEggMatcher, type Egg } from "@/lib/eggs";
import { isSleepingHour, nepalClock, nepalHour, type ClockTime, type Weather } from "@/lib/live";
import { createLofiPlayer, type LofiPlayer } from "@/lib/lofi";
import {
  COMMUTE_MINUTES,
  PLAYLIST,
  ROUTES,
  phaseForHour,
  routeByKey,
  routeBySlug,
  sip,
  trackIndexForPhase,
  type DayPhase,
  type MediaItem,
  type Where,
  whereIs,
} from "@/lib/studio";
import type { SceneTarget } from "./StudioScene";
import LoadingScreen from "./LoadingScreen";
import MediaDeck from "./MediaDeck";

const StudioScene = dynamic(() => import("./StudioScene"), {
  ssr: false,
  loading: () => <div className="studio__loading">Setting up the desk…</div>,
});

const AUTO_SIP_MS = 19000;
const SIP_LANDS_MS = 1500;
const REFILL_MS = 2600;
/** How long the camera glides toward a clicked object before navigating. */
const DIVE_MS = 750;
/** The character turns round to wave hello for this long on arrival. */
const GREETING_MS = 2600;
const PARTY_BPM = 124;
/** How long the drive loading screen stays up, before the office is open. */
const COMMUTE_LOADING_MS = 2_000;
/** How often the room re-reads the Sindhuli clock, and refreshes live data. */
const CLOCK_TICK_MS = 15_000;
const LIVE_REFRESH_MS = 30 * 60 * 1000;

function isTypingInField(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

/**
 * The homepage is just the room: the character, the desk and the things around
 * it. Clicking an object in the scene is how you move through the portfolio.
 * The window shows Sindhuli's real time and weather, the monitor types real
 * commits, and a few secrets reward anyone who types the right thing.
 */
export default function Studio() {
  const router = useRouter();
  // The room follows Sindhuli's clock; the "lights" egg can override it.
  const [clock, setClock] = useState<ClockTime | null>(null);
  const [lightsOverride, setLightsOverride] = useState<DayPhase | null>(null);
  const livePhase: DayPhase = clock ? phaseForHour(clock.hours) : "night";
  const phase = lightsOverride ?? livePhase;
  const sleeping = !!clock && isSleepingHour(clock.hours) && !lightsOverride;
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [reduced, setReduced] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(true);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [gitLog, setGitLog] = useState<string[] | null>(null);
  const [party, setParty] = useState(false);
  const [hired, setHired] = useState(false);
  /** The room whose blurb is showing under the dock. */
  const [hint, setHint] = useState<string | null>(null);
  /** Temporary hint shown when clicking desk gadgets (weather, clock). */
  const [tempHint, setTempHint] = useState<string | null>(null);
  const player = useRef<LofiPlayer | null>(null);

  const [coffee, setCoffee] = useState(1);
  const [sipCount, setSipCount] = useState(0);
  const coffeeRef = useRef(1);
  const busySipping = useRef(false);
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  /* ---------- commute state ---------- */
  /** Where Bibash is right now: studio (home) or office. Follows Sindhuli's clock. */
  const liveHour = nepalHour(new Date());
  const [location, setLocation] = useState<Where>(whereIs(liveHour));
  /** Mid-drive: walking out, or coming back. */
  const [commute, setCommute] = useState<"out" | "in" | null>(null);
  const roamToken = useRef(0);
  /** Shown while the drive plays out. */
  const [driving, setDriving] = useState(false);

  const onDoor = useCallback(() => {
    // He has walked out the door: play the drive loading screen, then he's at the office.
    if (commute !== "out") return;
    setDriving(true);
    later(() => {
      setLocation("office");
      setCommute(null);
      setDriving(false);
    }, COMMUTE_LOADING_MS);
  }, [commute, later]);

  const onSeated = useCallback(() => {
    // He has walked back in and sat down: he's home at the desk again.
    if (commute !== "in") return;
    setLocation("studio");
    setCommute(null);
    setDriving(false);
  }, [commute]);

  /** Bibash leaves for the office at 9:30 and comes back at 6. */
  useEffect(() => {
    const update = () => {
      const hour = nepalHour(new Date());
      const at = whereIs(hour);
      if (at !== location && !commute && !driving) {
        if (location === "studio") setCommute("out");
        else setCommute("in");
      }
    };
    setInterval(update, 10_000);
  }, [location, commute, driving]);

  /* ---------- media on the monitor ---------- */
  const [mediaDeckOpen, setMediaDeckOpen] = useState(false);
  const [mediaPlaying, setMediaPlaying] = useState<MediaItem | null>(null);
  const playMedia = useCallback((item: MediaItem) => setMediaPlaying(item), []);

  const stopMedia = useCallback(() => {
    setMediaPlaying(null);
  }, []);

  useEffect(() => {
    // The room keeps Sindhuli's clock, not the visitor's, and keeps it live.
    setClock(nepalClock(Date.now()));
    const tick = window.setInterval(() => setClock(nepalClock(Date.now())), CLOCK_TICK_MS);
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReduced(prefersReduced);
    try {
      const canvas = document.createElement("canvas");
      setWebgl(!!(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
    const greet = window.setTimeout(() => setGreeting(false), prefersReduced ? 0 : GREETING_MS);

    // Live details are a bonus: if the request fails the room is unchanged.
    // Re-read every half hour so a long visit sees the weather change.
    const controller = new AbortController();
    const loadLive = () =>
      fetch("/api/live", { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { weather: Weather | null; gitLog: string[] | null } | null) => {
          if (!data) return;
          setWeather(data.weather);
          setGitLog(data.gitLog);
        })
        .catch(() => {});
    void loadLive();
    const refresh = window.setInterval(() => {
      if (!document.hidden) void loadLive();
    }, LIVE_REFRESH_MS);

    const pending = timers.current;
    return () => {
      window.clearTimeout(greet);
      window.clearInterval(tick);
      window.clearInterval(refresh);
      controller.abort();
      pending.forEach((id) => window.clearTimeout(id));
      player.current?.dispose();
      player.current = null;
    };
  }, []);

  const drinkCoffee = useCallback(() => {
    if (busySipping.current) return;
    busySipping.current = true;
    if (coffeeRef.current <= 0) {
      later(() => {
        coffeeRef.current = 1;
        setCoffee(1);
        busySipping.current = false;
      }, REFILL_MS);
      return;
    }
    setSipCount((count) => count + 1);
    later(() => {
      const left = sip(coffeeRef.current);
      coffeeRef.current = left;
      setCoffee(left);
    }, SIP_LANDS_MS);
    later(() => {
      busySipping.current = false;
    }, 3700);
  }, [later]);

  // The character reaches for the mug on their own now and then.
  useEffect(() => {
    if (sleeping) return;
    const id = window.setInterval(() => {
      if (!document.hidden) drinkCoffee();
    }, AUTO_SIP_MS);
    return () => window.clearInterval(id);
  }, [drinkCoffee, sleeping]);

  /* ---------- easter eggs ---------- */

  const togglePartyMusic = useCallback((on: boolean) => {
    if (on) {
      player.current ??= createLofiPlayer();
      player.current.play(PLAYLIST[trackIndexForPhase("afternoon")]!);
    } else {
      player.current?.pause();
    }
  }, []);

  const hatch = useCallback(
    (egg: Egg) => {
      if (egg === "coffee") drinkCoffee();
      else if (egg === "lights")
        setLightsOverride((current) => (current ? null : livePhase === "night" || livePhase === "evening" ? "afternoon" : "night"));
      else if (egg === "hire") setHired(true);
      else if (egg === "party") {
        setParty((current) => {
          togglePartyMusic(!current);
          return !current;
        });
      }
    },
    [drinkCoffee, livePhase, togglePartyMusic]
  );

  useEffect(() => {
    const match = createEggMatcher();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setHired(false);
        return;
      }
      if (isTypingInField(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const egg = match(event.key);
      if (egg) hatch(egg);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hatch]);

  /* ---------- navigation ---------- */

  const onTarget = useCallback(
    (target: SceneTarget) => {
      if (target.kind === "page") {
        const route = routeBySlug(target.slug);
        if (!route || leaving) return;
        // Glide toward the object first, then let the room morph into the page.
        setLeaving(route.slug);
        router.prefetch(route.href);
        later(() => router.push(route.href), reduced ? 0 : DIVE_MS);
      } else if (target.kind === "coffee") {
        drinkCoffee();
      } else if (target.kind === "media") {
        setMediaDeckOpen(true);
      } else if (target.kind === "character") {
        // Get up and stretch, or sit back down.
        roamToken.current = roamToken.current + 1;
      } else if (target.kind === "weather") {
        if (weather) {
          const words = { clear: "clear skies", cloudy: "cloudy", fog: "foggy", rain: "raining", storm: "stormy", snow: "snowing" }[weather.kind];
          const temp = weather.tempC !== null ? `${weather.tempC}°C · ` : "";
          setTempHint(`Sindhuli right now: ${temp}${words}`);
        } else {
          setTempHint("No weather data for Sindhuli yet.");
        }
        later(() => setTempHint(null), 4000);
      } else if (target.kind === "clock") {
        if (clock) {
          setTempHint(`Sindhuli time: ${String(clock.hours).padStart(2, "0")}:${String(clock.minutes).padStart(2, "0")}`);
        } else {
          setTempHint("Reading Sindhuli's clock…");
        }
        later(() => setTempHint(null), 4000);
      }
    },
    [drinkCoffee, later, leaving, reduced, router, clock, weather]
  );

  // Numbers jump straight to a room: 1 About … 7 Contact.
  // `m` opens the media deck; `d` drives to the office or back home.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingInField(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "m" && !leaving) {
        event.preventDefault();
        setMediaDeckOpen((open) => !open);
        return;
      }
      if (event.key === "d" && !leaving && !commute) {
        event.preventDefault();
        if (driving) return;
        setCommute(location === "studio" ? "out" : "in");
        return;
      }
      const route = routeByKey(event.key);
      if (!route || leaving) return;
      event.preventDefault();
      onTarget({ kind: "page", slug: route.slug });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leaving, onTarget, location, commute, driving]);

  return (
    <div className="studio" data-phase={phase} data-party={party ? "" : undefined}>
      <ViewTransition name="stage" share="stage-morph" default="none">
        <div className="studio__stage">
          {webgl === null && <div className="studio__loading">Setting up the desk…</div>}
          {webgl && (
            <StudioScene
              phase={phase}
              musicBpm={party ? PARTY_BPM : null}
              sipCount={sipCount}
              coffeeLevel={coffee}
              asking={greeting && !leaving}
              leaving={leaving}
              terminalText={null}
              reduced={reduced}
              onTarget={onTarget}
              weather={weather}
              gitLog={gitLog}
              sleeping={sleeping}
              media={mediaPlaying}
              away={location === "office"}
              commute={commute}
              roamToken={roamToken.current}
              onDoor={onDoor}
              onSeated={onSeated}
            />
          )}
          {webgl === false && (
            <div className="studio__flat">
              <span className="studio__flat-desk" aria-hidden="true">
                🧑‍💻☕🎧
              </span>
              <p>Bibash is at the desk. Your browser can’t show the 3D room, but every room below still opens.</p>
            </div>
          )}

          {/* Driving between the studio and the office. */}
          {driving && (
            <LoadingScreen
              active
              kind="drive"
              title={commute === "out" ? "Driving to the office" : "Driving home"}
              detail="12 min down the mountain road"
              minutes={COMMUTE_MINUTES}
              to={commute === "out" ? "office" : "studio"}
            />
          )}

          {/* Opening a page: glide into the object first. */}
          {leaving && (
            <LoadingScreen
              active
              kind="dive"
              title={leaving.charAt(0).toUpperCase() + leaving.slice(1)}
              detail="gliding into the desk"
            />
          )}
        </div>
      </ViewTransition>

      {/* The media deck lives on the monitor — it opens on top of the room. */}
      {mediaDeckOpen && (
        <MediaDeck
          open
          playing={mediaPlaying}
          onPlay={playMedia}
          onClose={() => setMediaDeckOpen(false)}
          onClear={stopMedia}
        />
      )}

      {/* Lights flicker on as you arrive. */}
      {webgl && !reduced && <div className="studio__intro" aria-hidden="true" />}

      {/* The room index: every page is one click (or one number) away. */}
      <nav className="studio__dock" aria-label="Portfolio pages">
        <ol className="studio__rooms">
          {ROUTES.map((route) => (
            <li key={route.slug}>
              <Link
                href={route.href}
                className="studio__room"
                aria-current={leaving === route.slug ? "true" : undefined}
                onPointerEnter={() => setHint(route.blurb)}
                onPointerLeave={() => setHint(null)}
                onFocus={() => setHint(route.blurb)}
                onBlur={() => setHint(null)}
                onClick={(event) => {
                  event.preventDefault();
                  onTarget({ kind: "page", slug: route.slug });
                }}
              >
                <span className="studio__room-key" aria-hidden="true">
                  {route.key}
                </span>
                <span className="studio__room-label">{route.label}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/summary"
              className="studio__room studio__room--summary"
              onPointerEnter={() => setHint("everything, on one page")}
              onPointerLeave={() => setHint(null)}
              onFocus={() => setHint("everything, on one page")}
              onBlur={() => setHint(null)}
            >
              <span className="studio__room-key" aria-hidden="true">
                ⌘
              </span>
              <span className="studio__room-label">Summary</span>
            </Link>
          </li>
        </ol>
        <p className="studio__dock-hint" aria-live="polite">
          {tempHint ?? hint ?? "Pick a room — or press 1–7"}
        </p>
      </nav>

      {hired && (
        <div className="studio__egg" role="dialog" aria-modal="false" aria-labelledby="egg-title">
          <p className="studio__egg-code">
            <span>$</span> sudo hire bibash
            <br />
            <span>[sudo]</span> permission granted ✓
          </p>
          <h2 id="egg-title">Bibash has been added to your team.</h2>
          <p>Pending one small thing: the actual offer.</p>
          <div className="studio__egg-actions">
            <Link href="/contact" className="btn">
              Send the offer
            </Link>
            <a
              href="#"
              className="btn btn--ghost"
              onClick={(event) => {
                event.preventDefault();
                setHired(false);
              }}
            >
              Close (esc)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
