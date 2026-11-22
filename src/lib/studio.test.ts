import { describe, expect, it } from "vitest";
import {
  NUDGES,
  OFFICE_HOUR,
  HOME_HOUR,
  PLAYLIST,
  RADIO,
  ROUTES,
  nextTrackIndex,
  nudgeAt,
  parseCommand,
  parseMediaInput,
  phaseForHour,
  sip,
  trackIndexForPhase,
  trackSeconds,
  whereIs,
} from "./studio";

function goSlug(input: string) {
  const command = parseCommand(input);
  return command.type === "go" ? command.route.slug : command.type;
}

describe("parseCommand", () => {
  it("opens pages from cd, open, bare names, aliases and digits", () => {
    expect(goSlug("cd projects")).toBe("projects");
    expect(goSlug("open about")).toBe("about");
    expect(goSlug("  Contact ")).toBe("contact");
    expect(goSlug("cd ./resume/")).toBe("resume");
    expect(goSlug("whoami")).toBe("about");
    expect(goSlug("cv")).toBe("resume");
    expect(goSlug("2")).toBe("projects");
    expect(goSlug("cd exp")).toBe("experience");
  });

  it("understands music, coffee, help, tour and clear", () => {
    expect(parseCommand("music")).toEqual({ type: "music", action: "toggle" });
    expect(parseCommand("music next")).toEqual({ type: "music", action: "next" });
    expect(parseCommand("pause")).toEqual({ type: "music", action: "pause" });
    expect(parseCommand("play")).toEqual({ type: "music", action: "play" });
    expect(parseCommand("sip").type).toBe("coffee");
    expect(parseCommand("help").type).toBe("help");
    expect(parseCommand("tour").type).toBe("tour");
    expect(parseCommand("clear").type).toBe("clear");
  });

  it("reports empty and unknown input", () => {
    expect(parseCommand("   ").type).toBe("empty");
    expect(parseCommand("rm -rf /")).toEqual({ type: "unknown", input: "rm -rf /" });
    expect(parseCommand("cd nowhere").type).toBe("unknown");
    // Two-letter prefixes are too ambiguous to guess.
    expect(parseCommand("cd ex").type).toBe("unknown");
  });
});

describe("routes", () => {
  it("gives every page a unique digit and slug", () => {
    expect(new Set(ROUTES.map((r) => r.key)).size).toBe(ROUTES.length);
    expect(new Set(ROUTES.map((r) => r.slug)).size).toBe(ROUTES.length);
    ROUTES.forEach((route) => expect(route.href).toBe(`/${route.slug}`));
  });
});

describe("media links", () => {
  it("plays YouTube links of every shape as an embed", () => {
    for (const raw of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      const item = parseMediaInput(raw);
      expect(item?.kind).toBe("youtube");
      expect(item?.src).toContain("dQw4w9WgXcQ");
      expect(item?.src).toContain("youtube-nocookie.com/embed/");
    }
  });

  it("plays vimeo, audio and video files, and falls back to a link", () => {
    expect(parseMediaInput("vimeo.com/76979871")?.src).toBe("https://player.vimeo.com/video/76979871?autoplay=1&title=0");
    const audio = parseMediaInput("https://example.com/tracks/a.mp3");
    expect(audio?.kind).toBe("audio");
    expect(audio?.src).toBe("https://example.com/tracks/a.mp3");
    expect(parseMediaInput("https://example.com/clip.mp4")?.kind).toBe("video");
    const other = parseMediaInput("open.spotify.com/track/xyz");
    expect(other?.kind).toBe("link");
    expect(other?.src).toBe("https://open.spotify.com/track/xyz");
  });

  it("keeps a pasted title and makes a stable id", () => {
    const first = parseMediaInput("youtu.be/dQw4w9WgXcQ", "Never");
    const second = parseMediaInput("youtu.be/dQw4w9WgXcQ", "Never");
    expect(first?.title).toBe("Never");
    expect(first?.id).toBe(second?.id);
    expect(parseMediaInput("nope")).toBeNull();
  });

  it("offers one radio station per playlist track", () => {
    expect(RADIO.length).toBe(PLAYLIST.length);
    RADIO.forEach((item) => expect(item.kind).toBe("radio"));
  });

  it("routes media and commute words through the terminal", () => {
    expect(parseCommand("media").type).toBe("media");
    expect(parseCommand("youtube https://youtu.be/dQw4w9WgXcQ")).toEqual({ type: "link", url: "https://youtu.be/dQw4w9WgXcQ" });
    expect(parseCommand("https://youtu.be/dQw4w9WgXcQ")).toEqual({ type: "link", url: "https://youtu.be/dQw4w9WgXcQ" });
    expect(parseCommand("drive")).toEqual({ type: "commute", to: "office" });
    expect(parseCommand("drive home")).toEqual({ type: "commute", to: "studio" });
    // Plain commands still win over link matching.
    expect(goSlug("2")).toBe("projects");
    expect(goSlug("about")).toBe("about");
  });
});

describe("the commute", () => {
  it("leaves for the office at 9:30 and comes back at 6", () => {
    expect(whereIs(6)).toBe("studio");
    expect(whereIs(9.29)).toBe("studio");
    expect(whereIs(OFFICE_HOUR)).toBe("office");
    expect(whereIs(13)).toBe("office");
    expect(whereIs(HOME_HOUR)).toBe("studio");
    expect(whereIs(23)).toBe("studio");
  });
});

describe("time of day and playlist", () => {
  it("maps hours to phases", () => {
    expect(phaseForHour(7)).toBe("morning");
    expect(phaseForHour(13)).toBe("afternoon");
    expect(phaseForHour(18)).toBe("evening");
    expect(phaseForHour(23)).toBe("night");
    expect(phaseForHour(3)).toBe("night");
  });

  it("has a track for every phase and cycles through them", () => {
    for (const phase of ["morning", "afternoon", "evening", "night"] as const) {
      expect(PLAYLIST[trackIndexForPhase(phase)]!.phase).toBe(phase);
    }
    expect(nextTrackIndex(PLAYLIST.length - 1)).toBe(0);
  });

  it("keeps tracks between one and three minutes", () => {
    for (const track of PLAYLIST) {
      expect(trackSeconds(track)).toBeGreaterThan(60);
      expect(trackSeconds(track)).toBeLessThan(180);
    }
  });
});

describe("character", () => {
  it("drinks coffee in five sips and never goes negative", () => {
    let level = 1;
    for (let i = 0; i < 5; i++) level = sip(level);
    expect(level).toBe(0);
    expect(sip(0)).toBe(0);
  });

  it("rotates nudges and points them at real pages", () => {
    expect(nudgeAt(NUDGES.length)).toBe(NUDGES[0]);
    expect(nudgeAt(-1)).toBe(NUDGES[NUDGES.length - 1]);
    const slugs = new Set(ROUTES.map((r) => r.slug));
    for (const nudge of NUDGES) {
      for (const option of nudge.options ?? []) {
        if (option.slug) expect(slugs.has(option.slug)).toBe(true);
      }
    }
  });
});
