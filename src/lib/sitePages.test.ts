import { describe, expect, it } from "vitest";
import { sitePages, type PageSlug } from "@/lib/sitePages";

const slugs: PageSlug[] = [
  "about",
  "skills",
  "projects",
  "contact",
  "resume",
  "experience",
  "stats",
  "services",
];

describe("classic page content", () => {
  it.each(slugs)("%s has at least ten uniquely identified sections", (slug) => {
    const page = sitePages[slug];
    expect(page.sections.length).toBeGreaterThanOrEqual(10);
    const ids = page.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of page.sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.blocks.length).toBeGreaterThan(0);
    }
  });

  it("gives every page a closing call to action", () => {
    for (const slug of slugs) {
      expect(sitePages[slug].end.primary.href).toMatch(/^(https?:|mailto:|\/)/);
      expect(sitePages[slug].end.secondary.href).toMatch(/^https?:|^mailto:|^\//);
    }
  });
});
