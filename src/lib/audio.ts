"use client";

// Global, lazy-initialized AudioContext manager to synthesize satisfying mechanical keyboard tick sounds on the fly.
// No MP3 files needed — pure procedural engineering.

export type SoundProfile = "blue" | "brown" | "red";

interface ProfileParams {
  oscType: OscillatorType;
  oscFreq: number;
  oscEnd: number;
  oscGain: number;
  oscDur: number;
  noiseGain: number;
  noiseFreq: number;
  noiseDur: number;
}

const PROFILES: Record<SoundProfile, ProfileParams> = {
  // Cherry MX Blue — clicky, sharp high snap + pronounced tactile pop
  blue: { oscType: "sine", oscFreq: 1500, oscEnd: 320, oscGain: 0.016, oscDur: 0.008, noiseGain: 0.009, noiseFreq: 1900, noiseDur: 0.005 },
  // Cherry MX Brown — tactile, softer thock with a muted mid click
  brown: { oscType: "triangle", oscFreq: 680, oscEnd: 220, oscGain: 0.022, oscDur: 0.012, noiseGain: 0.004, noiseFreq: 1200, noiseDur: 0.004 },
  // Cherry MX Red — linear, deep smooth thock, almost no click
  red: { oscType: "sine", oscFreq: 340, oscEnd: 130, oscGain: 0.03, oscDur: 0.018, noiseGain: 0.002, noiseFreq: 700, noiseDur: 0.003 },
};

export const SOUND_PROFILE_LABELS: Record<SoundProfile, string> = {
  blue: "Cherry MX Blue (Clicky)",
  brown: "Cherry MX Brown (Tactile)",
  red: "Cherry MX Red (Linear)",
};

let audioCtx: AudioContext | null = null;
let isMuted = false;
let soundProfile: SoundProfile = "blue";

if (typeof window !== "undefined") {
  isMuted = localStorage.getItem("sys_audio_muted") === "true";
  const saved = localStorage.getItem("sys_sound_profile") as SoundProfile | null;
  if (saved && PROFILES[saved]) soundProfile = saved;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playProfile(p: ProfileParams) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Pitch jitter for organic, non-repetitive feel
  const jitter = 0.92 + Math.random() * 0.16;
  const f = p.oscFreq * jitter;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = p.oscType;
  osc.frequency.setValueAtTime(f, now);
  osc.frequency.exponentialRampToValueAtTime(p.oscEnd, now + p.oscDur);
  gainNode.gain.setValueAtTime(p.oscGain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + p.oscDur);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + p.oscDur);

  if (p.noiseGain > 0) {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * p.noiseDur));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = p.noiseFreq;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(p.noiseGain, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + p.noiseDur);
    noiseNode.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseNode.start(now);
    noiseNode.stop(now + p.noiseDur);
  }
}

export function playTick() {
  playProfile(PROFILES[soundProfile]);
}

export function setSoundProfile(profile: SoundProfile) {
  soundProfile = profile;
  if (typeof window !== "undefined") {
    localStorage.setItem("sys_sound_profile", profile);
  }
}

export function getSoundProfile(): SoundProfile {
  return soundProfile;
}

export function playClick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Primary mechanical click oscillator
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.035);

  gainNode.gain.setValueAtTime(0.04, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.035);

  // High snap modifier
  const snap = ctx.createOscillator();
  const snapGain = ctx.createGain();

  snap.type = "sine";
  snap.frequency.setValueAtTime(1000, now);
  snap.frequency.exponentialRampToValueAtTime(400, now + 0.01);

  snapGain.gain.setValueAtTime(0.01, now);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

  snap.connect(snapGain);
  snapGain.connect(ctx.destination);

  snap.start(now);
  snap.stop(now + 0.01);
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (typeof window !== "undefined") {
    localStorage.setItem("sys_audio_muted", String(isMuted));
  }
  return isMuted;
}

export function getMuteState(): boolean {
  return isMuted;
}

// ─── BGM (background music) ─────────────────────────────────────
// Plays `public/bgm.mp3` (falls back to .ogg/.wav) when present,
// otherwise plays a built-in generative ambient loop. No audio
// assets are required — drop a track into `public/` to use your own.

const BGM_ENABLED_KEY = "sys_bgm_enabled";
const BGM_VOLUME_KEY = "sys_bgm_volume";
const BGM_TRACKS = ["/bgm.mp3", "/bgm.ogg", "/bgm.wav"];

let bgmEnabled = false;
let bgmVolume = 0.5;
let bgmPlaying = false;
let bgmTrackLabel = "generative ambient";
let bgmTrack: string | null | undefined;
let bgmEl: HTMLAudioElement | null = null;
let bgmElWired = false;
let bgmBus: GainNode | null = null;
let bgmMaster: GainNode | null = null;
let bgmAnalyser: AnalyserNode | null = null;
let genRunId = 0;
let genTimers: number[] = [];
let genNoise: AudioBufferSourceNode | null = null;
const bgmListeners = new Set<() => void>();

if (typeof window !== "undefined") {
  bgmEnabled = localStorage.getItem(BGM_ENABLED_KEY) === "true";
  const savedVol = parseFloat(localStorage.getItem(BGM_VOLUME_KEY) ?? "");
  if (Number.isFinite(savedVol)) bgmVolume = Math.min(Math.max(savedVol, 0), 1);
}

function emitBgm() {
  for (const fn of bgmListeners) {
    try { fn(); } catch { /* listener error — ignore */ }
  }
}

export function onBgmChange(fn: () => void): () => void {
  bgmListeners.add(fn);
  return () => { bgmListeners.delete(fn); };
}

export function isBgmEnabled(): boolean {
  return bgmEnabled;
}

export function isBgmPlaying(): boolean {
  return bgmPlaying;
}

export function getBgmVolume(): number {
  return bgmVolume;
}

export function getBgmTrackLabel(): string {
  return bgmTrackLabel;
}

export function setBgmVolume(v: number) {
  bgmVolume = Math.min(Math.max(v, 0), 1);
  if (typeof window !== "undefined") {
    localStorage.setItem(BGM_VOLUME_KEY, String(bgmVolume));
  }
  if (audioCtx && bgmMaster) {
    bgmMaster.gain.setTargetAtTime(bgmVolume, audioCtx.currentTime, 0.05);
  }
  if (bgmEl && !bgmElWired) bgmEl.volume = bgmVolume;
  emitBgm();
}

function ensureBgmBus(ctx: AudioContext) {
  if (!bgmBus || !bgmMaster || !bgmAnalyser) {
    bgmBus = ctx.createGain();
    bgmBus.gain.value = 0;
    bgmAnalyser = ctx.createAnalyser();
    bgmAnalyser.fftSize = 64;
    bgmAnalyser.smoothingTimeConstant = 0.8;
    bgmMaster = ctx.createGain();
    bgmMaster.gain.value = bgmVolume;
    bgmBus.connect(bgmAnalyser);
    bgmAnalyser.connect(bgmMaster);
    bgmMaster.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

async function resolveTrack(): Promise<string | null> {
  if (bgmTrack !== undefined) return bgmTrack;
  for (const t of BGM_TRACKS) {
    try {
      const res = await fetch(t, { method: "HEAD" });
      if (res.ok) {
        bgmTrack = t;
        return t;
      }
    } catch { /* try next candidate */ }
  }
  bgmTrack = null;
  return null;
}

async function playFileTrack(track: string) {
  const ctx = getAudioContext();
  if (!bgmEl) {
    bgmEl = new Audio(track);
    bgmEl.loop = true;
    bgmEl.preload = "auto";
  }
  if (ctx) {
    ensureBgmBus(ctx);
    if (!bgmElWired) {
      ctx.createMediaElementSource(bgmEl).connect(bgmBus!);
      bgmElWired = true;
    }
    bgmEl.volume = 1; // level is controlled by bgmMaster
    bgmBus!.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
  } else {
    bgmEl.volume = bgmVolume;
  }
  bgmTrackLabel = track.split("/").pop() ?? "bgm";
  await bgmEl.play();
}

// Slow lo-fi chord pads + pentatonic plucks with echo + vinyl dust.
const GEN_CHORDS: number[][] = [
  [110, 164.81, 261.63], // Am
  [87.31, 174.61, 220], // F
  [130.81, 164.81, 246.94], // Cmaj7
  [98, 146.83, 246.94], // G
];
const GEN_SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

function playGenerative() {
  const ctx = getAudioContext();
  if (!ctx) throw new Error("WebAudio unavailable");
  ensureBgmBus(ctx);
  if (!bgmBus) throw new Error("WebAudio unavailable");
  bgmBus.gain.setTargetAtTime(1, ctx.currentTime, 0.8);
  bgmTrackLabel = "generative ambient";
  const run = ++genRunId;
  const bus = bgmBus;

  // Vinyl dust
  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (Math.random() < 0.0015 ? 1 : 0.02);
  }
  genNoise = ctx.createBufferSource();
  genNoise.buffer = noiseBuf;
  genNoise.loop = true;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2000;
  const ng = ctx.createGain();
  ng.gain.value = 0.015;
  genNoise.connect(hp);
  hp.connect(ng);
  ng.connect(bus);
  genNoise.start();

  // Dubby echo for the plucks
  const delay = ctx.createDelay(1);
  delay.delayTime.value = 0.42;
  const fb = ctx.createGain();
  fb.gain.value = 0.35;
  const wet = ctx.createGain();
  wet.gain.value = 0.3;
  delay.connect(fb);
  fb.connect(delay);
  delay.connect(wet);
  wet.connect(bus);

  // Pads — one chord every ~6.5s with slow attack/release
  let chordIdx = Math.floor(Math.random() * GEN_CHORDS.length);
  const schedulePad = () => {
    if (run !== genRunId) return;
    const t = ctx.currentTime;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 750;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 2.5);
    g.gain.setValueAtTime(0.05, t + 5);
    g.gain.linearRampToValueAtTime(0, t + 8);
    lp.connect(g);
    g.connect(bus);
    for (const f of GEN_CHORDS[chordIdx % GEN_CHORDS.length]) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.002);
      o.connect(lp);
      o.start(t);
      o.stop(t + 8.2);
    }
    chordIdx++;
    genTimers.push(window.setTimeout(schedulePad, 6500));
  };
  schedulePad();

  // Plucks — lazy pentatonic random walk
  let step = 3;
  const schedulePluck = () => {
    if (run !== genRunId) return;
    const r = Math.random();
    step += r < 0.35 ? -1 : r < 0.7 ? 1 : r < 0.8 ? 2 : 0;
    step = Math.max(0, Math.min(GEN_SCALE.length - 1, step));
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = GEN_SCALE[step];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(g);
    g.connect(bus);
    g.connect(delay);
    o.start(t);
    o.stop(t + 1.5);
    genTimers.push(window.setTimeout(schedulePluck, 1100 + Math.random() * 1900));
  };
  genTimers.push(window.setTimeout(schedulePluck, 1500));
}

export async function startBgm(): Promise<boolean> {
  if (typeof window === "undefined" || bgmPlaying) return bgmPlaying;
  try {
    const track = await resolveTrack();
    if (track) await playFileTrack(track);
    else playGenerative();
    bgmEnabled = true;
    localStorage.setItem(BGM_ENABLED_KEY, "true");
    bgmPlaying = true;
    emitBgm();
    return true;
  } catch {
    bgmPlaying = false;
    emitBgm();
    return false;
  }
}

export function stopBgm() {
  genRunId++;
  if (typeof window !== "undefined") {
    for (const t of genTimers) window.clearTimeout(t);
  }
  genTimers = [];
  try { genNoise?.stop(); } catch { /* already stopped */ }
  genNoise = null;
  if (audioCtx && bgmBus) {
    bgmBus.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
  }
  if (bgmEl) {
    const el = bgmEl;
    window.setTimeout(() => el.pause(), 450);
  }
  bgmEnabled = false;
  if (typeof window !== "undefined") {
    localStorage.setItem(BGM_ENABLED_KEY, "false");
  }
  bgmPlaying = false;
  emitBgm();
}

export async function toggleBgm(): Promise<boolean> {
  if (isBgmPlaying()) {
    stopBgm();
    return false;
  }
  return startBgm();
}

const levelBuf = new Uint8Array(32);

// Live 0..1 levels per bin for visualizers. Flat baseline when idle.
export function sampleBgmLevels(bins = 5): number[] {
  if (!bgmPlaying || !bgmAnalyser) return new Array(bins).fill(0.06);
  bgmAnalyser.getByteFrequencyData(levelBuf);
  const out: number[] = [];
  const usable = 20;
  for (let i = 0; i < bins; i++) {
    const idx = Math.min(levelBuf.length - 1, Math.floor((i / bins) * usable));
    out.push(Math.max(0.06, (levelBuf[idx] ?? 0) / 255));
  }
  return out;
}
