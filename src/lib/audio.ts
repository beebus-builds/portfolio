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
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
