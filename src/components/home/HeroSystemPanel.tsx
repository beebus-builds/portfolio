"use client";

import { useEffect, useState } from "react";

interface Telemetry {
  status: string;
  latencyMs: number;
  metrics: { blogPosts: number; activeProjects: number; totalBlogViews: number };
}

interface GhStats {
  public_repos: number;
  followers: number;
}

export default function HeroSystemPanel() {
  const [time, setTime] = useState("");
  const [tel, setTel] = useState<Telemetry | null>(null);
  const [gh, setGh] = useState<GhStats | null>(null);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date())
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/telemetry").then((r) => r.json()).then(setTel).catch(() => {});
    fetch("https://api.github.com/users/beebus-builds")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setGh({ public_repos: d.public_repos, followers: d.followers }))
      .catch(() => {});
  }, []);

  const rows: { k: string; v: string | number }[] = [
    { k: "local_time", v: time || "--:--:--" },
    { k: "status", v: tel ? tel.status : "connecting…" },
    { k: "latency", v: tel ? `${tel.latencyMs}ms` : "—" },
    { k: "repos", v: gh ? gh.public_repos : "—" },
    { k: "followers", v: gh ? gh.followers : "—" },
    { k: "blog_posts", v: tel ? tel.metrics.blogPosts : "—" },
  ];

  return (
    <div className="hero-system-panel" aria-label="Live system status">
      <div className="hero-system-titlebar">
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-dot" />
        <span className="term-path">~/status --watch</span>
      </div>
      <div className="hero-system-body">
        {rows.map((r) => (
          <div key={r.k} className="hero-system-row">
            <span>{r.k}</span>
            <b>{r.v}</b>
          </div>
        ))}
        <div className="hero-system-row hero-system-live">
          <span className="hero-system-dot" />
          all systems nominal
          <span className="caret-blink">▊</span>
        </div>
      </div>
    </div>
  );
}
