"use client";

export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window, window.webkitAudioContext))();
    this.startAmbient();
  }

  private startAmbient() {
    if (!this.audioCtx) return;

    // Deep space drone (brown noise / low sine)
    this.ambientOsc = this.audioCtx.createOscillator();
    this.ambientGain = this.audioCtx.createGain();

    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(55, this.audioCtx.currentTime); // Low A
    
    this.ambientGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.audioCtx.destination);
    
    this.ambientOsc.start();
  }

  playThruster(intensity: number) {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40 + intensity * 20, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.audioCtx.currentTime + 0.1);

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
    osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.05);
  }
}

export const audioManager = new AudioManager();
