"use client";

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private pingInterval: any = null;

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.startAmbient();
    this.startRadarPings();
  }

  private startAmbient() {
    if (!this.audioCtx) return;

    this.ambientOsc = this.audioCtx.createOscillator();
    this.ambientGain = this.audioCtx.createGain();

    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(45, this.audioCtx.currentTime); // Deep rumbling frequency
    
    this.ambientGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
    
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.audioCtx.destination);
    
    this.ambientOsc.start();
  }

  private startRadarPings() {
    if (!this.audioCtx) return;

    // Rhythmic radar ping every 5 seconds to simulate ship bridge
    this.pingInterval = setInterval(() => {
      this.playRadarPing();
    }, 5000);
  }

  private playRadarPing() {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.audioCtx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.015, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.15);
  }

  playThruster(intensity: number) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(35 + intensity * 25, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(15, this.audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.02 * intensity, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  playBlip() {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, this.audioCtx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.08);
  }
}

export const audioManager = new AudioManager();
