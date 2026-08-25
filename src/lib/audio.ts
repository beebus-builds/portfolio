"use client";

// Global, lazy-initialized AudioContext manager to synthesize satisfying mechanical keyboard tick sounds on the fly.
// No MP3 files needed — pure procedural engineering.

let audioCtx: AudioContext | null = null;
let isMuted = false;

if (typeof window !== "undefined") {
  isMuted = localStorage.getItem("sys_audio_muted") === "true";
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

export function playTick() {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // 1. Oscillators for the high-frequency snap
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(1400, now);
  // Extremely fast frequency drop to simulate mechanical contact release
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.008);

  gainNode.gain.setValueAtTime(0.015, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.008);

  // 2. High-pass filter noise block for the realistic switch "tactile click" pop
  const bufferSize = ctx.sampleRate * 0.005; // 5ms buffer
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseNode = ctx.createBufferSource();
  noiseNode.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.008, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.005);

  noiseNode.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noiseNode.start(now);
  noiseNode.stop(now + 0.005);
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
