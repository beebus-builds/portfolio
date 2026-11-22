import { describe, expect, it } from "vitest";
import { anchorId } from "./anchors";
import { worldFor } from "./pageWorlds";
import { sitePages, type PageSlug } from "./sitePages";

const PAGES: PageSlug[] = ["about", "projects", "skills", "experience", "services", "resume", "contact"];

/** Every id the rendered page will contain: sections, cards and timeline entries. */
function idsOn(slug: PageSlug): Set<string> {
  const ids = new Set<string>();
  for (const section of sitePages[slug].sections) {
    ids.add(section.id);
    for (const block of section.blocks) {
      if (block.kind === "cards" || block.kind === "timeline") block.items.forEach((item) => ids.add(anchorId(item.title)));
    }
  }
  return ids;
}

describe("anchorId", () => {
  it("makes stable, URL-safe ids", () => {
    expect(anchorId("iVote — Secure Online Voting")).toBe("ivote-secure-online-voting");
    expect(anchorId("  Café & Co. ")).toBe("cafe-co");
    expect(anchorId("—")).toBe("item");
  });
});

describe("worldFor", () => {
  it.each(PAGES)("gives %s a room whose objects all lead somewhere on the page", (slug) => {
    const world = worldFor(slug)!;
    expect(world).not.toBeNull();
    expect(world.items.length).toBeGreaterThan(0);
    const ids = idsOn(slug);
    for (const item of world.items) {
      expect(ids.has(item.target), `${slug}: ${item.label} → #${item.target}`).toBe(true);
      for (const section of item.sections) expect(ids.has(section), `${slug}: section ${section}`).toBe(true);
    }
  });

  it("uses a different layout for every page", () => {
    const layouts = PAGES.map((slug) => worldFor(slug)!.layout);
    expect(new Set(layouts).size).toBe(PAGES.length);
  });

  it("scales skill pillars by proficiency", () => {
    for (const item of worldFor("skills")!.items) {
      expect(item.value).toBeGreaterThan(0);
      expect(item.value).toBeLessThanOrEqual(1);
    }
  });
});
