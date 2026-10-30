/**
 * Client-side store for the live fleet: other visitors' ships on the flight
 * deck plus the Cheer Park comms channel.
 *
 * One singleton polls `/api/fleet` every few seconds with the local ship's
 * telemetry and receives every other live pilot plus any chat lines past the
 * local cursor. Snapshots are exposed through `useSyncExternalStore`-shaped
 * getters, so render loops (three.js drones) and DOM panels can both subscribe
 * without re-rendering each other.
 */

export type FleetMode = "cruise" | "docked" | "landing";

export type Telemetry = {
  p: [number, number, number];
  q: [number, number, number, number];
  speed: number;
  boosting: boolean;
  mode: FleetMode;
};

/** One other pilot's latest snapshot; `at` is a performance.now() stamp. */
export type PilotState = {
  id: string;
  callsign: string;
  accent: string;
  p: [number, number, number];
  q: [number, number, number, number];
  speed: number;
  boosting: boolean;
  mode: FleetMode;
  at: number;
};

export type PilotBrief = { id: string; callsign: string; accent: string };

export type ChatMessage = {
  id: number;
  from: string;
  callsign: string;
  body: string;
  at: string;
  mine: boolean;
  system: boolean;
};

export type FleetStatus = "off" | "connecting" | "live" | "backoff";

type RawChatMessage = { id: number; from: string; callsign: string; body: string; at: string };

type FleetResponse = {
  you: { id: string; callsign: string };
  pilots: {
    id: string;
    callsign: string;
    accent: string;
    p: [number, number, number];
    q: [number, number, number, number];
    speed: number;
    boosting: boolean;
    mode: FleetMode;
  }[];
  messages: RawChatMessage[];
};

const POLL_MS = 3000;
const BACKOFF_MS = 6000;
/** Rendering cap; the server already caps its response at 24. */
const MAX_DRONES = 12;
const MAX_MESSAGES = 100;
const MAX_UNREAD = 99;

const CALLSIGN_KEY = "bp07_callsign";
const ACCENT_KEY = "bp07_accent";

/** Ship colours a new pilot can pick from; one is assigned at random. */
export const ACCENTS = [
  "#38bdf8",
  "#f472b6",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#f97316",
];

/** Mirrors the server's cleaner; the server re-checks anyway. */
function sanitizeCallsign(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[^\w \-]/g, "")
    .trim()
    .slice(0, 24);
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

class FleetStore {
  private listeners = new Set<() => void>();
  private pilots = new Map<string, PilotState>();
  private pilotListCache: PilotBrief[] = [];
  private pilotListDirty = false;
  private messages: ChatMessage[] = [];
  private statusValue: FleetStatus = "off";
  private unread = 0;
  private panelOpen = false;
  private inParkValue = false;
  private welcomed = false;
  private hadFirstSync = false;
  private callsign = "";
  private accent = ACCENTS[0] ?? "#38bdf8";
  private youId = "";
  private lastChatId = 0;
  private timer: number | null = null;
  private running = false;
  private syncing = false;
  private getState: (() => Telemetry) | null = null;
  private onVisible: (() => void) | null = null;
  private onHide: (() => void) | null = null;

  constructor() {
    if (!hasStorage()) return;
    try {
      this.callsign = sanitizeCallsign(localStorage.getItem(CALLSIGN_KEY) ?? "");
      const saved = localStorage.getItem(ACCENT_KEY);
      this.accent =
        saved && /^#[0-9a-fA-F]{6}$/.test(saved)
          ? saved
          : (ACCENTS[Math.floor(Math.random() * ACCENTS.length)] ?? "#38bdf8");
    } catch {
      /* storage unavailable: defaults hold */
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  /** Stable-identity list of other pilots, for keyed rendering. */
  getPilotList = (): PilotBrief[] => {
    if (this.pilotListDirty) {
      this.pilotListCache = [...this.pilots.values()].map((pilot) => ({
        id: pilot.id,
        callsign: pilot.callsign,
        accent: pilot.accent,
      }));
      this.pilotListDirty = false;
    }
    return this.pilotListCache;
  };

  getPilot = (id: string): PilotState | undefined => this.pilots.get(id);

  getMessages = (): ChatMessage[] => this.messages;

  /** Everybody on the deck, including you while the flight deck runs. */
  getOnline = (): number => (this.running ? this.pilots.size + 1 : this.pilots.size);

  getStatus = (): FleetStatus => this.statusValue;

  getUnread = (): number => this.unread;

  getInPark = (): boolean => this.inParkValue;

  getCallsign = (): string => this.callsign;

  getAccent = (): string => this.accent;

  /** Begin polling. Repeated starts rebind the telemetry source only. */
  start(getState: () => Telemetry): void {
    this.getState = getState;
    if (this.running) return;
    this.running = true;
    this.statusValue = "connecting";

    this.onVisible = () => {
      if (!document.hidden && this.running) void this.tick();
    };
    document.addEventListener("visibilitychange", this.onVisible);

    // Leaving the page (or the flight deck) withdraws the presence at once.
    this.onHide = () => {
      if (!this.youId) return;
      try {
        navigator.sendBeacon?.(
          "/api/fleet",
          new Blob([JSON.stringify({ offline: true })], { type: "application/json" })
        );
      } catch {
        /* beacon unavailable: the TTL prunes us shortly anyway */
      }
    };
    window.addEventListener("pagehide", this.onHide);

    this.emit();
    void this.tick();
  }

  /** Stop polling and clear the sky; called when the canvas unmounts. */
  stop(): void {
    if (this.timer !== null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.onVisible) document.removeEventListener("visibilitychange", this.onVisible);
    if (this.onHide) window.removeEventListener("pagehide", this.onHide);
    this.onVisible = null;
    this.onHide = null;
    this.running = false;
    this.getState = null;
    this.pilots.clear();
    this.pilotListDirty = true;
    this.statusValue = "off";
    this.inParkValue = false;
    this.emit();
    if (this.youId) {
      try {
        navigator.sendBeacon?.(
          "/api/fleet",
          new Blob([JSON.stringify({ offline: true })], { type: "application/json" })
        );
      } catch {
        /* same as above */
      }
    }
  }

  setPanelOpen(open: boolean): void {
    this.panelOpen = open;
    if (open && this.unread !== 0) {
      this.unread = 0;
      this.emit();
    }
  }

  clearUnread(): void {
    this.setPanelOpen(true);
  }

  setCallsign(value: string): void {
    const next = sanitizeCallsign(value);
    if (next === this.callsign) return;
    this.callsign = next;
    if (hasStorage()) {
      try {
        localStorage.setItem(CALLSIGN_KEY, next);
      } catch {
        /* ignore */
      }
    }
    this.emit();
  }

  setAccent(value: string): void {
    if (!/^#[0-9a-fA-F]{6}$/.test(value) || value === this.accent) return;
    this.accent = value;
    if (hasStorage()) {
      try {
        localStorage.setItem(ACCENT_KEY, value);
      } catch {
        /* ignore */
      }
    }
    this.emit();
  }

  /** Park proximity, sampled each frame by the fleet component. */
  setInPark(inside: boolean): void {
    if (inside === this.inParkValue) return;
    this.inParkValue = inside;
    if (inside && !this.welcomed) {
      this.welcomed = true;
      this.systemNote("Welcome to Cheer Park — every new pilot spawns here. Press X to talk.");
    }
    this.emit();
  }

  /** A local-only notice rendered like a system line. */
  systemNote(body: string): void {
    this.messages = [
      ...this.messages,
      { id: -Date.now(), from: "", callsign: "", body, at: new Date().toISOString(), mine: false, system: true },
    ].slice(-MAX_MESSAGES);
    this.emit();
  }

  async sendChat(body: string): Promise<"ok" | "limited" | "error"> {
    const text = body.trim().slice(0, 280);
    if (!text) return "ok";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: text, callsign: this.callsign }),
      });
      if (res.status === 429) return "limited";
      if (!res.ok) return "error";
      const data = (await res.json()) as { message: RawChatMessage };
      const message: ChatMessage = { ...data.message, mine: true, system: false };
      this.messages = [...this.messages, message].slice(-MAX_MESSAGES);
      this.lastChatId = Math.max(this.lastChatId, message.id);
      this.emit();
      return "ok";
    } catch {
      return "error";
    }
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    let delay = POLL_MS;
    const previous = this.statusValue;

    if (!document.hidden && !this.syncing && this.getState) {
      this.syncing = true;
      try {
        const res = await fetch("/api/fleet", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...this.getState(),
            callsign: this.callsign,
            accent: this.accent,
            since: this.lastChatId,
          }),
        });
        if (res.ok) {
          this.absorb((await res.json()) as FleetResponse);
          this.statusValue = "live";
        } else {
          this.statusValue = "backoff";
          delay = BACKOFF_MS;
        }
      } catch {
        this.statusValue = "backoff";
        delay = BACKOFF_MS;
      } finally {
        this.syncing = false;
      }
    }

    if (!this.running) return;
    this.timer = window.setTimeout(() => void this.tick(), delay);
    if (this.statusValue !== previous) this.emit();
  }

  private absorb(data: FleetResponse): void {
    this.youId = data.you.id;
    if (!this.callsign && data.you.callsign) {
      this.setCallsign(data.you.callsign);
    }

    const seen = new Set<string>();
    let listDirty = this.pilotListDirty;
    for (const pilot of data.pilots.slice(0, MAX_DRONES)) {
      seen.add(pilot.id);
      const previous = this.pilots.get(pilot.id);
      if (!previous && this.hadFirstSync) {
        this.pushSystem(`${pilot.callsign} warped in`);
      }
      if (!previous || previous.callsign !== pilot.callsign || previous.accent !== pilot.accent) {
        listDirty = true;
      }
      this.pilots.set(pilot.id, { ...pilot, at: performance.now() });
    }
    for (const id of [...this.pilots.keys()]) {
      if (!seen.has(id)) {
        this.pilots.delete(id);
        listDirty = true;
      }
    }
    this.pilotListDirty = listDirty;

    if (data.messages.length > 0) {
      const incoming = data.messages.map<ChatMessage>((message) => ({
        ...message,
        mine: message.from === this.youId,
        system: false,
      }));
      this.messages = [...this.messages, ...incoming].slice(-MAX_MESSAGES);
      this.lastChatId = Math.max(this.lastChatId, ...incoming.map((message) => message.id));
      if (!this.panelOpen) {
        const fresh = incoming.filter((message) => !message.mine).length;
        this.unread = Math.min(MAX_UNREAD, this.unread + fresh);
      }
    }

    this.hadFirstSync = true;
    this.emit();
  }

  private pushSystem(body: string): void {
    this.messages = [
      ...this.messages,
      { id: -Date.now(), from: "", callsign: "", body, at: new Date().toISOString(), mine: false, system: true },
    ].slice(-MAX_MESSAGES);
  }
}

export const fleet = new FleetStore();
