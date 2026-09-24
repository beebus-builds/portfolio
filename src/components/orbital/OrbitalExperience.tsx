"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { projects } from "@/lib/projects";
import { missionChapters, orbitalProfile, skillConstellation } from "@/lib/portfolio";
import styles from "./orbital.module.css";

const OrbitalScene = dynamic(() => import("./OrbitalScene"), {
  ssr: false,
  loading: () => (
    <div className={styles.sceneLoading} role="status" aria-label="Loading orbital station">
      <span className={styles.loadingOrb} />
      <span>CALIBRATING STATION</span>
    </div>
  ),
});

type PanelId = "briefing" | "missions" | "skills" | "log" | "contact";
type SceneMode = "checking" | "ready" | "fallback";

const STORAGE_KEY = "project-orbital-progress-v1";
const CORE_KEY = "project-orbital-core-v1";

function supportsWebGL() {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function FallbackScene() {
  return (
    <div className={styles.fallbackScene} aria-hidden="true">
      <span className={styles.fallbackOrb} />
      <span className={styles.fallbackRing} />
      <span className={styles.fallbackStation} />
      {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ top: `${8 + index * 4.2}%`, left: `${4 + index * 5.3}%`, opacity: 0.2 + (index % 4) * 0.14 }} />)}
    </div>
  );
}

function MissionDetail({
  mission,
  onBack,
  onCore,
  coreFound,
}: {
  mission: (typeof projects)[number];
  onBack: () => void;
  onCore: () => void;
  coreFound: boolean;
}) {
  return (
    <div className={styles.detailContent}>
      <button type="button" className={styles.backButton} onClick={onBack}>← All missions</button>
      <div className={styles.detailIndex} style={{ color: mission.color }}>MISSION / {mission.year}</div>
      <h3>{mission.title}</h3>
      <p>{mission.description}</p>
      <div className={styles.detailMeta}>
        <span>{mission.role}</span>
        <span>{mission.tag}</span>
      </div>
      <div className={styles.detailOutcomes}>
        {mission.highlights.slice(0, 3).map((highlight) => <span key={highlight}>{highlight}</span>)}
      </div>
      <div className={styles.detailTech}>
        {mission.tech.map((tech) => <span key={tech}>{tech}</span>)}
      </div>
      <div className={styles.detailActions}>
        <Link href={`/projects/${mission.slug}`} className={styles.primaryButton}>Open case study <span>↗</span></Link>
        {mission.url && <a href={mission.url} target="_blank" rel="noreferrer" className={styles.textLink}>Launch live build ↗</a>}
      </div>
      <div className={styles.coreReward}>
        <div>
          <span className={styles.coreDot} />
          <div><b>Data core</b><small>{coreFound ? "Signal recovered" : "Recover this mission’s hidden signal"}</small></div>
        </div>
        <button type="button" onClick={onCore} disabled={coreFound}>{coreFound ? "Recovered" : "+25 XP"}</button>
      </div>
    </div>
  );
}

function MissionList({ onSelect, discovered }: { onSelect: (slug: string) => void; discovered: string[] }) {
  return (
    <div className={styles.drawerMissions}>
      {projects.map((mission, index) => (
        <button
          type="button"
          className={styles.drawerMission}
          key={mission.slug}
          onClick={() => onSelect(mission.slug)}
          style={{ "--mission-accent": mission.color } as CSSProperties}
        >
          <span className={styles.drawerMissionNumber}>{String(index + 1).padStart(2, "0")}</span>
          <span className={styles.drawerMissionName}><b>{mission.title}</b><small>{mission.tag} · {mission.year}</small></span>
          <span className={styles.drawerMissionState}>{discovered.includes(mission.slug) ? "SYNCED" : "OPEN"}</span>
        </button>
      ))}
    </div>
  );
}

function SkillMap() {
  return (
    <div className={styles.skillMap}>
      {skillConstellation.map((skill, index) => (
        <div className={styles.skillRow} key={skill.name}>
          <div className={styles.skillOrb} data-tone={skill.tone}><span>{String(index + 1).padStart(2, "0")}</span></div>
          <div className={styles.skillInfo}><b>{skill.name}</b><small>{skill.detail}</small><i><span style={{ width: `${skill.level}%` }} /></i></div>
          <strong>{skill.level}%</strong>
        </div>
      ))}
    </div>
  );
}

function FlightLog() {
  return (
    <div className={styles.flightLog}>
      {missionChapters.map((chapter, index) => (
        <div className={styles.logRow} key={chapter.id}>
          <span className={styles.logNumber}>{chapter.number}</span>
          <div><b>{chapter.title}</b><small>{chapter.detail}</small></div>
          <span className={styles.logLine} data-active={index < 3} />
        </div>
      ))}
    </div>
  );
}

type ContactStatus = "idle" | "submitting" | "success" | "error";

function ContactPanel() {
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          subject: "Project Orbital channel",
          message: String(formData.get("message") ?? ""),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "The channel could not receive that message.");
      form.reset();
      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The channel could not receive that message.");
      setStatus("error");
    }
  };

  return (
    <div className={styles.contactPanel}>
      <div className={styles.contactSignal}><span /><b>CHANNEL OPEN</b></div>
      <h3>Have a signal worth sending?</h3>
      <p>Tell me what you are building, what is broken, or what you want to understand next. The best missions usually start as a single clear question.</p>
      <form className={styles.contactForm} onSubmit={handleSubmit}>
        <div className={styles.contactField}>
          <label htmlFor="orbital-name">Name</label>
          <input id="orbital-name" name="name" autoComplete="name" maxLength={100} placeholder="Your name" required />
        </div>
        <div className={styles.contactField}>
          <label htmlFor="orbital-email">Email</label>
          <input id="orbital-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required />
        </div>
        <div className={styles.contactField}>
          <label htmlFor="orbital-message">Message</label>
          <textarea id="orbital-message" name="message" maxLength={5000} placeholder="What are we building?" required />
        </div>
        <button type="submit" className={styles.primaryButton} disabled={status === "submitting"}>{status === "submitting" ? "Transmitting…" : "Transmit message"}<span>↗</span></button>
        {status === "success" && <p className={styles.formStatus} data-tone="success" role="status">Signal received. I&apos;ll get back to you soon.</p>}
        {status === "error" && <p className={styles.formStatus} data-tone="error" role="alert">{errorMessage}</p>}
      </form>
      <Link href="/contact" className={styles.textLink}>Open the full contact page ↗</Link>
      <div className={styles.contactMeta}><span>Based in {orbitalProfile.location}</span><span>Response window / 24h</span></div>
    </div>
  );
}

export default function OrbitalExperience() {
  const [mode, setMode] = useState<SceneMode>("checking");
  const [engaged, setEngaged] = useState(false);
  const [panel, setPanel] = useState<PanelId>("briefing");
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [cores, setCores] = useState(0);
  const [coreFound, setCoreFound] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMode(reducedMotion || !supportsWebGL() ? "fallback" : "ready");
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const savedCores = window.localStorage.getItem(CORE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setDiscovered(parsed.filter((id): id is string => typeof id === "string"));
      }
      if (savedCores) {
        const parsedCores = Number(savedCores) || 0;
        setCores(parsedCores);
        setCoreFound(parsedCores > 0);
      }
    } catch {
      setDiscovered([]);
    }
  }, []);

  const mission = useMemo(() => projects.find((item) => item.slug === selectedMission) ?? null, [selectedMission]);
  const completedMissions = discovered.filter((id) => projects.some((item) => item.slug === id)).length;
  const progress = Math.round((completedMissions / projects.length) * 100);

  const discover = (id: string) => {
    setDiscovered((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const openPanel = (nextPanel: PanelId) => {
    setPanel(nextPanel);
    if (nextPanel !== "briefing") setEngaged(true);
  };

  const openMission = (slug: string) => {
    discover(slug);
    setSelectedMission(slug);
    setPanel("missions");
    setEngaged(true);
  };

  const recoverCore = () => {
    if (coreFound) return;
    setCoreFound(true);
    setCores((current) => {
      const next = current + 25;
      try { window.localStorage.setItem(CORE_KEY, String(next)); } catch {}
      return next;
    });
    discover("hidden-core");
  };

  return (
    <main id="main-content" className={styles.orbitalShell} data-mode={mode}>
      <div className={styles.sceneFrame} aria-hidden="true">
        {mode === "ready" ? <OrbitalScene engaged={engaged} discovered={discovered} discoveredCount={completedMissions} selectedMission={selectedMission} onSelectMission={openMission} /> : <FallbackScene />}
        <div className={styles.sceneShade} />
        <div className={styles.sceneGrid} />
      </div>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <Link href="/" className={styles.brand} aria-label="Project Orbital home">
            <span className={styles.brandMark}><i /><i /></span>
            <span><b>PROJECT</b><strong>ORBITAL</strong></span>
          </Link>
          <nav className={styles.primaryNav} aria-label="Orbital navigation">
            <button type="button" className={panel === "briefing" ? styles.navActive : ""} onClick={() => openPanel("briefing")}>Mission control <span>01</span></button>
            <button type="button" className={panel === "skills" ? styles.navActive : ""} onClick={() => openPanel("skills")}>Skill map <span>02</span></button>
            <button type="button" className={panel === "log" ? styles.navActive : ""} onClick={() => openPanel("log")}>Flight log <span>03</span></button>
          </nav>
          <div className={styles.systemStatus}><i /><span>LIVE SYSTEM</span><b>{orbitalProfile.callSign}</b></div>
        </header>
        <div className={styles.sceneHint} aria-hidden="true"><i /> CLICK A FLOATING SIGNAL TO SYNC A MISSION</div>

        <div className={styles.mainGrid}>
          <section className={styles.heroCopy} aria-labelledby="orbital-title">
            <div className={styles.eyebrow}><i /> PERSONAL DEVELOPER STATION <span>{orbitalProfile.coordinates}</span></div>
            <h1 id="orbital-title"><span>BUILD</span><span>THE <em>UNSEEN.</em></span></h1>
            <p>{orbitalProfile.intro}</p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryButton} onClick={() => { setEngaged(true); setPanel("missions"); }}>Enter the station <span>↗</span></button>
              <button type="button" className={styles.secondaryButton} onClick={() => openPanel("contact")}>Open a channel <span>↗</span></button>
            </div>
            <div className={styles.heroMeta}><span>01 / {String(projects.length).padStart(2, "0")} MISSIONS</span><span>02 / {cores} DATA CORES</span><span>03 / LOCAL PROFILE</span></div>
          </section>

          <aside className={styles.stationCard} aria-label="Station progress">
            <div className={styles.cardTopline}><span>STATION STATUS</span><b><i /> NOMINAL</b></div>
            <div className={styles.progressBlock}>
              <div className={styles.progressRing} style={{ "--progress-angle": `${progress * 3.6}deg` } as CSSProperties}><span>{progress}<small>%</small></span></div>
              <div><span className={styles.cardLabel}>ARCHIVE SYNC</span><strong>{String(completedMissions).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</strong><small>missions recovered</small></div>
            </div>
            <div className={styles.currentVector}><span className={styles.cardLabel}>CURRENT VECTOR</span><b>Make the complex feel inevitable.</b><p>Full-stack systems · interface craft · thoughtful shipping</p></div>
            <div className={styles.cardFooter}><span>Last sync / just now</span><button type="button" onClick={recoverCore}>{coreFound ? "Signal recovered" : "Scan for signal"} <span>↗</span></button></div>
          </aside>
        </div>

        <section className={styles.missionDeck} id="missions" aria-labelledby="mission-heading">
          <div className={styles.deckHeader}>
            <div><span className={styles.sectionKicker}>01 / MISSION ARCHIVE</span><h2 id="mission-heading">Six signals.<br /><em>One orbit.</em></h2></div>
            <div className={styles.deckCounter}><b>{String(completedMissions).padStart(2, "0")}</b><span>of {String(projects.length).padStart(2, "0")} synced</span></div>
          </div>
          <div className={styles.missionGrid}>
            {projects.map((item, index) => {
              const synced = discovered.includes(item.slug);
              return (
                <button
                  type="button"
                  className={`${styles.missionCard} ${synced ? styles.missionCardSynced : ""}`}
                  key={item.slug}
                  onClick={() => openMission(item.slug)}
                  style={{ "--mission-accent": item.color } as CSSProperties}
                  aria-label={`Open mission ${item.title}`}
                >
                  <div className={styles.missionCardTop}><span>0{index + 1}</span><b>{synced ? "SYNCED" : "OPEN SIGNAL"}</b></div>
                  <div className={styles.missionCardTitle}>{item.title}</div>
                  <p>{item.tag} <span>/</span> {item.year}</p>
                  <div className={styles.missionCardBottom}><span>{item.tech.slice(0, 2).join(" · ")}</span><span>↗</span></div>
                </button>
              );
            })}
          </div>
        </section>

        <footer className={styles.footerBar}><span>© 2026 {orbitalProfile.name}</span><span>PROJECT ORBITAL / BP-07</span><span>SCROLL TO EXPLORE <i>↓</i></span></footer>
      </div>

      <AnimatePresence mode="wait">
        {panel !== "briefing" && (
          <>
            <motion.button type="button" className={styles.drawerScrim} aria-label="Close panel" onClick={() => setPanel("briefing")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside className={styles.drawer} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 28 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} aria-label={`${panel} panel`}>
              <div className={styles.drawerHeader}><div><span className={styles.sectionKicker}>{panel === "missions" ? "02 / ARCHIVE" : panel === "skills" ? "03 / CAPABILITIES" : panel === "log" ? "04 / FLIGHT LOG" : "05 / COMMS"}</span><h2>{panel === "missions" ? "Mission archive" : panel === "skills" ? "Skill constellation" : panel === "log" ? "Flight log" : "Open channel"}</h2></div><button type="button" className={styles.closeButton} onClick={() => setPanel("briefing")} aria-label="Close panel">×</button></div>
              <div className={styles.drawerBody}>
                {panel === "missions" && (mission ? <MissionDetail mission={mission} onBack={() => setSelectedMission(null)} onCore={recoverCore} coreFound={coreFound} /> : <MissionList onSelect={openMission} discovered={discovered} />)}
                {panel === "skills" && <SkillMap />}
                {panel === "log" && <FlightLog />}
                {panel === "contact" && <ContactPanel />}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
