import type { Track } from "./studio";

/**
 * A tiny procedural lo-fi player built on Web Audio: soft electric-piano
 * chords, a round bass, swung drums and vinyl crackle. Everything is
 * synthesised, so there are no audio files to license or download.
 *
 * Browsers only allow audio after a user gesture, so `play()` must be called
 * from a click or key handler the first time.
 */
export type LofiPlayer = {
  play: (track: Track) => void;
  pause: () => void;
  readonly playing: boolean;
  /** Called once the current track has played all of its bars. */
  onEnd: (() => void) | null;
  /** Called on every beat with the beat index, so visuals can nod along. */
  onBeat: ((beat: number) => void) | null;
  dispose: () => void;
};

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

function midiToHz(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/** Small deterministic RNG so each track's melody is the same every play. */
function rng(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10000) / 10000;
  };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function createLofiPlayer(): LofiPlayer {
  const AudioCtor: typeof AudioContext | undefined =
    typeof window === "undefined"
      ? undefined
      : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let bus: BiquadFilterNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let crackle: AudioBufferSourceNode | null = null;
  let timer: number | null = null;
  let track: Track | null = null;
  let step = 0;
  let nextTime = 0;
  let random = rng(1);
  let playing = false;

  const player: LofiPlayer = {
    play,
    pause,
    get playing() {
      return playing;
    },
    onEnd: null,
    onBeat: null,
    dispose,
  };

  function ensureGraph() {
    if (ctx || !AudioCtor) return;
    ctx = new AudioCtor();
    master = ctx.createGain();
    master.gain.value = 0;
    // A gentle low-pass over everything is most of the "lo-fi" sound.
    bus = ctx.createBiquadFilter();
    bus.type = "lowpass";
    bus.frequency.value = 2600;
    bus.Q.value = 0.4;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    bus.connect(comp);
    comp.connect(master);
    master.connect(ctx.destination);

    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  function startCrackle() {
    if (!ctx || !bus || !noiseBuffer || crackle) return;
    // Pops: sparse impulses on top of filtered hiss.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.04 + (Math.random() < 0.0004 ? (Math.random() - 0.5) * 1.6 : 0);
    }
    crackle = ctx.createBufferSource();
    crackle.buffer = buffer;
    crackle.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 3200;
    band.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    crackle.connect(band).connect(gain).connect(bus);
    crackle.start();
  }

  function keys(note: number, time: number, length: number, velocity: number) {
    if (!ctx || !bus) return;
    const freq = midiToHz(note);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.07 * velocity, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.025 * velocity, time + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(1800, time);
    tone.frequency.exponentialRampToValueAtTime(700, time + length);
    tone.connect(gain).connect(bus);
    // Two slightly detuned voices give the soft, wobbly Rhodes-ish body.
    for (const [type, detune] of [
      ["sine", -6],
      ["triangle", 7],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      osc.connect(tone);
      osc.start(time);
      osc.stop(time + length + 0.05);
    }
  }

  function bass(note: number, time: number, length: number) {
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = midiToHz(note);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.32, time + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    osc.connect(gain).connect(bus);
    osc.start(time);
    osc.stop(time + length + 0.05);
  }

  function kick(time: number) {
    if (!ctx || !bus) return;
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.18);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.75, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.35);
    osc.connect(gain).connect(bus);
    osc.start(time);
    osc.stop(time + 0.4);
  }

  function noiseHit(time: number, freq: number, length: number, level: number, type: BiquadFilterType) {
    if (!ctx || !bus || !noiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(level, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    src.connect(filter).connect(gain).connect(bus);
    src.start(time, Math.random());
    src.stop(time + length + 0.02);
  }

  function scheduleStep(current: Track, index: number, time: number) {
    const sixteenth = 60 / current.bpm / 4;
    const bar = Math.floor(index / 16);
    const s = index % 16;
    const chord = current.chords[bar % current.chords.length]!;
    // Swing pushes every off-beat sixteenth late.
    const swung = s % 2 === 1 ? time + sixteenth * 0.28 : time;

    if (s === 0) {
      chord.forEach((note, i) => keys(note + 12, time + i * 0.012, sixteenth * 15, 0.9));
      bass(chord[0]! - 12, time, sixteenth * 5);
    }
    if (s === 8) chord.slice(1).forEach((note, i) => keys(note + 12, swung + i * 0.02, sixteenth * 7, 0.5));
    if (s === 10) bass(chord[0]! - 12, swung, sixteenth * 3);
    if (s === 14 && bar % 2 === 1) bass(chord[2]! - 12, swung, sixteenth * 2);

    // A sparse melody that only uses chord tones, an octave up.
    if (s % 4 === 2 && random() < 0.32) {
      const note = chord[Math.floor(random() * chord.length)]! + 24;
      keys(note, swung, sixteenth * 3, 0.55);
    }

    // Drums drop out for the first bar of each track: a soft intro.
    if (bar > 0) {
      if (s === 0 || s === 10 || (s === 7 && bar % 4 === 3)) kick(swung);
      if (s === 4 || s === 12) noiseHit(swung, 1800, 0.18, 0.28, "bandpass");
      if (s % 2 === 0) noiseHit(swung, 8000, 0.04, s % 4 === 0 ? 0.08 : 0.05, "highpass");
    }

    if (s % 4 === 0) {
      const beat = index / 4;
      const delay = Math.max(0, (time - (ctx?.currentTime ?? 0)) * 1000);
      window.setTimeout(() => player.onBeat?.(beat), delay);
    }
  }

  function tick() {
    if (!ctx || !track) return;
    const sixteenth = 60 / track.bpm / 4;
    while (nextTime < ctx.currentTime + SCHEDULE_AHEAD) {
      if (step >= track.bars * 16) {
        const ended = track;
        window.setTimeout(() => {
          if (track === ended) player.onEnd?.();
        }, Math.max(0, (nextTime - ctx.currentTime) * 1000));
        // Keep the groove going until the owner picks the next track.
        step = 0;
      }
      scheduleStep(track, step, nextTime);
      nextTime += sixteenth;
      step += 1;
    }
  }

  function play(next: Track) {
    ensureGraph();
    if (!ctx || !master) return;
    void ctx.resume();
    const changed = !track || track.id !== next.id;
    track = next;
    if (changed || !playing) {
      if (changed) {
        step = 0;
        random = rng(hash(next.id));
      }
      nextTime = ctx.currentTime + 0.08;
    }
    startCrackle();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.4);
    if (timer === null) timer = window.setInterval(tick, LOOKAHEAD_MS);
    playing = true;
  }

  function pause() {
    if (!ctx || !master) return;
    playing = false;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function dispose() {
    pause();
    player.onEnd = null;
    player.onBeat = null;
    try {
      crackle?.stop();
    } catch {
      /* already stopped */
    }
    void ctx?.close();
    ctx = null;
  }

  return player;
}
