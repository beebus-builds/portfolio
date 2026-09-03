"use client";

import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { playTick, playClick, toggleMute, getMuteState } from "@/lib/audio";

// Meaningful sub-components (A)
import LogoTilt from "./header/LogoTilt";
import MegaMenuWork from "./header/MegaMenuWork";
import MegaMenuBytes from "./header/MegaMenuBytes";
import MegaMenuAbout from "./header/MegaMenuAbout";
import RightCluster from "./header/RightCluster";
import MobileDrawer from "./header/MobileDrawer";
import AnnouncementBar from "./header/AnnouncementBar";

function ScrambleText({ text, active }: { text: string; active?: boolean }) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chars = "01$#@%&?_[]{}-+=*^";
  const triggerScramble = () => {
    playTick();
    if (intervalRef.current) clearInterval(intervalRef.current);
    let iteration = 0;
    intervalRef.current = setInterval(() => {
      setDisplayText(
        text.split("").map((char, index) => (index < iteration ? text[index] : chars[Math.floor(Math.random() * chars.length)])).join("")
      );
      if (iteration >= text.length) { if (intervalRef.current) clearInterval(intervalRef.current); }
      iteration += 1 / 3;
    }, 25);
  };
  useEffect(() => { if (active) triggerScramble(); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return <span onMouseEnter={triggerScramble} className="tabular-nums transition-colors duration-200">{displayText}</span>;
}

export default function Header() {
  // compact + centered layout flags for B + C — set false to revert
  const COMPACT = true; // C: no ribbon, 56px
  const CENTERED = true; // B: grid 1fr auto 1fr

  const [activeMenu, setActiveMenu] = useState<"work" | "bytes" | "about" | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ktmTime, setKtmTime] = useState("");
  const [audioMuted, setAudioMuted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tickerIndex] = useState(0); // kept for Ribbon optional use
  const [spot, setSpot] = useState({ x: -500, y: -500, visible: false });
  const [mem] = useState(34.2);
  const [memHistory] = useState<number[]>(() => Array.from({ length: 20 }, () => 34 + Math.random() * 2));

  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const headerRef = useRef<HTMLElement | null>(null);
  const workRef = useRef<HTMLDivElement | null>(null);
  const bytesRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);
  const openSourceRef = useRef<"hover" | "click" | null>(null);

  useEffect(() => { setAudioMuted(getMuteState()); }, []);

  useEffect(() => {
    const updateTime = () => setKtmTime(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kathmandu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()));
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (y / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // click-outside + Esc
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!activeMenu) return;
      const t = e.target as Node;
      if (!workRef.current?.contains(t) && !bytesRef.current?.contains(t) && !aboutRef.current?.contains(t)) { setActiveMenu(null); openSourceRef.current = null; }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { if (activeMenu) { setActiveMenu(null); openSourceRef.current = null; } if (mobileOpen) setMobileOpen(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [activeMenu, mobileOpen]);

  const handleHeaderMove = (e: React.MouseEvent) => {
    const r = headerRef.current?.getBoundingClientRect();
    if (!r) return;
    setSpot({ x: e.clientX - r.left, y: e.clientY - r.top, visible: true });
  };
  const handleHeaderLeave = () => setSpot((s) => ({ ...s, visible: false }));

  // PCB canvas — compact: slightly fainter, paused when hidden
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let af: number;
    let paused = false;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);
    let accentRGB = "184,255,77";
    const readAccent = () => {
      const hex = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
      if (m) accentRGB = `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`;
    };
    readAccent();
    window.addEventListener("theme-change", readAccent);
    const onVis = () => { paused = document.hidden; if (!paused) draw(); };
    document.addEventListener("visibilitychange", onVis);
    const onResize = () => { width = canvas.width = canvas.offsetWidth; height = canvas.height = canvas.offsetHeight; gen(); };
    window.addEventListener("resize", onResize);
    const onMove = (e: MouseEvent) => { const rect = canvas.getBoundingClientRect(); mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }; };
    const onLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };
    canvas.parentElement?.addEventListener("mousemove", onMove);
    canvas.parentElement?.addEventListener("mouseleave", onLeave);
    interface Pt { x: number; y: number }
    interface Trace { points: Pt[]; width: number }
    interface Packet { traceIndex: number; progress: number; speed: number; size: number }
    let traces: Trace[] = [];
    const packets: Packet[] = [];
    const gen = () => {
      traces = [];
      for (let i = 0; i < 5; i++) {
        const sy = (height / 5) * i + height / 10;
        const pts: Pt[] = [{ x: 0, y: sy }];
        let cx = 0; let cy = sy;
        while (cx < width) { cx += 90 + Math.random() * 110; cy = Math.max(6, Math.min(height - 6, cy + (Math.random() > 0.45 ? (Math.random() > 0.5 ? 22 : -22) : 0))); pts.push({ x: cx, y: cy }); }
        traces.push({ points: pts, width: Math.random() > 0.7 ? 1.4 : 0.7 });
      }
    };
    gen();
    const draw = () => {
      if (paused) return;
      ctx.clearRect(0, 0, width, height);
      const alpha = scrolled ? 0.022 : 0.045;
      ctx.strokeStyle = `rgba(${accentRGB},${alpha})`;
      traces.forEach((t) => { ctx.lineWidth = t.width; ctx.beginPath(); ctx.moveTo(t.points[0].x, t.points[0].y); for (let i = 1; i < t.points.length; i++) ctx.lineTo(t.points[i].x, t.points[i].y); ctx.stroke(); });
      if (packets.length < 14 && Math.random() < 0.09) packets.push({ traceIndex: Math.floor(Math.random() * traces.length), progress: 0, speed: 0.0025 + Math.random() * 0.004, size: 1.4 + Math.random() * 1.2 });
      packets.forEach((p, idx) => {
        const tr = traces[p.traceIndex];
        if (!tr || tr.points.length < 2) { packets.splice(idx, 1); return; }
        const total = tr.points.length - 1;
        const f = p.progress * total; const si = Math.floor(f); const sp = f - si;
        const a = tr.points[si]; const b = tr.points[si + 1] || a;
        const cx = a.x + (b.x - a.x) * sp; const cy = a.y + (b.y - a.y) * sp;
        const dx = mouseRef.current.x - cx; const dy = mouseRef.current.y - cy; const d = Math.sqrt(dx * dx + dy * dy);
        let s = p.speed; if (d < 110) s = p.speed * (1.6 + (110 - d) / 50);
        p.progress += s;
        if (p.progress >= 1) packets.splice(idx, 1);
        else { ctx.beginPath(); const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, p.size * 3); g.addColorStop(0, `rgba(${accentRGB},1)`); g.addColorStop(0.4, `rgba(${accentRGB},0.45)`); g.addColorStop(1, `rgba(${accentRGB},0)`); ctx.fillStyle = g; ctx.arc(cx, cy, p.size * 3, 0, Math.PI * 2); ctx.fill(); }
      });
      af = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("theme-change", readAccent); cancelAnimationFrame(af); };
  }, [scrolled]);

  const handleMouseEnter = (menu: "work" | "bytes" | "about") => { if (timeoutRef.current) clearTimeout(timeoutRef.current); setActiveMenu(menu); openSourceRef.current = "hover"; };
  const handleMouseLeave = () => { if (openSourceRef.current === "click") return; timeoutRef.current = setTimeout(() => { setActiveMenu(null); openSourceRef.current = null; }, 180); };
  const toggleMenu = (menu: "work" | "bytes" | "about") => {
    if (activeMenu === menu && openSourceRef.current === "click") {
      setActiveMenu(null);
      openSourceRef.current = null;
    } else {
      setActiveMenu(menu);
      openSourceRef.current = "click";
    }
  };
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);
  useEffect(() => { setActiveMenu(null); setMobileOpen(false); openSourceRef.current = null; }, [pathname]);

  const crumbs = useMemo(() => {
    if (pathname === "/") return [{ label: "~", href: "/" }, { label: "home", href: "/" }];
    const segs = pathname.split("/").filter(Boolean);
    const map: Record<string, string> = { projects: "work", blog: "bytes", chess: "lab", commands: "lab", skills: "ecosystem", education: "ecosystem", about: "about", contact: "contact", admin: "admin" };
    const out: { label: string; href: string }[] = [{ label: "~", href: "/" }];
    let acc = "";
    segs.forEach((s) => { acc += `/${s}`; out.push({ label: map[s] ?? s, href: acc }); });
    return out;
  }, [pathname]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));

  // sparkPath kept for Ribbon (when not compact) — memoized
  const _sparkPath = useMemo(() => {
    const w = 60, h = 14; const min = Math.min(...memHistory), max = Math.max(...memHistory); const range = max - min || 1;
    return memHistory.map((v, i) => { const x = (i / (memHistory.length - 1)) * w; const y = h - ((v - min) / range) * h; return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`; }).join(" ");
  }, [memHistory]);
  void _sparkPath; void tickerIndex; void mem;

  // audio toggle for Ribbon (compact hides it, but keep handler)
  const handleAudioToggle = (e: React.MouseEvent) => { e.stopPropagation(); const m = toggleMute(); setAudioMuted(m); if (!m) setTimeout(playClick, 20); };
  void handleAudioToggle; void ktmTime; void audioMuted;

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header
        ref={headerRef as unknown as React.RefObject<HTMLDivElement>}
        onMouseMove={handleHeaderMove}
        onMouseLeave={handleHeaderLeave}
        className={`sticky top-0 z-50 w-full border-b transition-all duration-500 ${scrolled ? "bg-terminal-900/90 backdrop-blur-xl border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(84,230,212,0.06)]" : "bg-terminal-900/55 backdrop-blur-[6px] border-transparent"}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300" style={{ opacity: spot.visible ? 0.9 : 0, background: `radial-gradient(260px circle at ${spot.x}px ${spot.y}px, rgba(84,230,212,0.07), transparent 70%)` }} />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/5">
          <motion.div className="h-full bg-neon-400 shadow-[0_0_8px_rgba(84,230,212,0.9)]" style={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        </div>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none select-none z-0" />

        {/* ─── BIG ANIMATED ANNOUNCEMENTS — above navbar, flowing marquee with blog relay + image ─── */}
        <div className="relative z-40 border-b border-neon-400/10">
          <AnnouncementBar />
        </div>

        {/* C: no ribbon in compact mode — Ribbon.tsx preserved for non-compact use */}
        {/* {!COMPACT && <Ribbon ... />} */}

        {/* Main row — B: centered logo via grid, C: 56px compact */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-50">
          <div className={`${CENTERED ? "flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:items-center" : "flex items-center justify-between"} ${COMPACT ? "h-[56px]" : "h-[64px]"} gap-4`}>
            {/* Left: nav (desktop) */}
            <nav className="hidden md:flex items-center gap-7 justify-self-start h-full" aria-label="Primary">
              <div ref={aboutRef} className="relative h-full flex items-center" onMouseEnter={() => handleMouseEnter("about")} onMouseLeave={handleMouseLeave}>
                <button
                  aria-expanded={activeMenu === "about"}
                  aria-haspopup="true"
                  onClick={() => toggleMenu("about")}
                  className={`nav-link flex items-center gap-1 text-[11px] font-mono tracking-widest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm ${activeMenu === "about" || ["/about", "/education", "/skills", "/resume.pdf"].some((p) => pathname === p || pathname.startsWith(p)) ? "text-neon-400" : "text-white/50 hover:text-white"}`}
                >
                  <ScrambleText text="About" active={activeMenu === "about"} />
                  <span className={`text-[8px] transition-transform duration-200 ${activeMenu === "about" ? "rotate-180" : ""} opacity-50`}>▾</span>
                </button>
                {activeMenu === "about" && <MegaMenuAbout />}
              </div>

              <div ref={workRef} className="relative h-full flex items-center" onMouseEnter={() => handleMouseEnter("work")} onMouseLeave={handleMouseLeave}>
                <button
                  aria-expanded={activeMenu === "work"}
                  aria-haspopup="true"
                  onClick={() => toggleMenu("work")}
                  className={`nav-link flex items-center gap-1 text-[11px] font-mono tracking-widest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm ${activeMenu === "work" || pathname.startsWith("/projects") ? "text-neon-400" : "text-white/50 hover:text-white"}`}
                >
                  <ScrambleText text="Work" active={activeMenu === "work"} />
                  <span className={`text-[8px] transition-transform duration-200 ${activeMenu === "work" ? "rotate-180" : ""} opacity-50`}>▾</span>
                </button>
                {activeMenu === "work" && <MegaMenuWork />}
              </div>

              <div ref={bytesRef} className="relative h-full flex items-center" onMouseEnter={() => handleMouseEnter("bytes")} onMouseLeave={handleMouseLeave}>
                <button
                  aria-expanded={activeMenu === "bytes"}
                  aria-haspopup="true"
                  onClick={() => toggleMenu("bytes")}
                  className={`nav-link flex items-center gap-1 text-[11px] font-mono tracking-widest transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm ${activeMenu === "bytes" || ["/blog", "/chess", "/commands"].some((p) => pathname.startsWith(p)) ? "text-neon-400" : "text-white/50 hover:text-white"}`}
                >
                  <ScrambleText text="Bytes" active={activeMenu === "bytes"} />
                  <span className={`text-[8px] transition-transform duration-200 ${activeMenu === "bytes" ? "rotate-180" : ""} opacity-50`}>▾</span>
                </button>
                {activeMenu === "bytes" && <MegaMenuBytes />}
              </div>
            </nav>

            {/* Center: logo */}
            <div className={`${CENTERED ? "justify-self-center" : "justify-self-start"} flex items-center`}>
              <LogoTilt />
            </div>

            {/* Right: Contact + cluster (desktop) */}
            <div className="hidden md:flex items-center gap-6 justify-self-end justify-end">
              <Link
                href="/contact"
                onClick={() => playClick()}
                aria-current={isActive("/contact") ? "page" : undefined}
                title="Available for internships — avg reply within a day"
                className={`nav-link inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-sm ${isActive("/contact") ? "text-neon-400" : "text-white/50 hover:text-white"}`}
              >
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                <ScrambleText text="Contact" />
              </Link>
              <div className="flex items-center gap-1">
                <span className="w-px h-4 bg-white/10" aria-hidden />
                <RightCluster ribbonClosed={false} onRestore={() => {}} />
              </div>
            </div>

            {/* Mobile button — always at end on mobile */}
            <button
              onClick={() => { playClick(); setMobileOpen(!mobileOpen); }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="md:hidden relative w-9 h-9 flex items-center justify-center text-white/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-400/40 rounded-md shrink-0"
            >
              <span className="sr-only">Toggle menu</span>
              <motion.span animate={mobileOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }} className="absolute w-5 h-0.5 bg-current rounded-full" style={{ transformOrigin: "center" }} transition={{ duration: 0.18 }} />
              <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} className="absolute w-5 h-0.5 bg-current rounded-full" transition={{ duration: 0.12 }} />
              <motion.span animate={mobileOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }} className="absolute w-5 h-0.5 bg-current rounded-full" style={{ transformOrigin: "center" }} transition={{ duration: 0.18 }} />
            </button>
          </div>

          <MobileDrawer open={mobileOpen} crumbs={crumbs} ktmTime={ktmTime} isActive={isActive} onClose={() => setMobileOpen(false)} />
        </div>
      </header>
    </>
  );
}
