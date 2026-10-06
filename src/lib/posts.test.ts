import { describe, expect, it } from "vitest";
import { posts } from "./posts";

describe("posts library", () => {
  it("has no duplicate slugs", () => {
    const slugs = posts.map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses kebab-case slugs", () => {
    for (const post of posts) {
      expect(post.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it("gives every post a cover image and alt text", () => {
    for (const post of posts) {
      expect(post.cover.src).toMatch(/^\/blog\/[a-z0-9-]+\.svg$/);
      expect(post.cover.alt.length).toBeGreaterThan(20);
    }
  });

  it("declares sensible read times and tags", () => {
    for (const post of posts) {
      expect(post.minutes).toBeGreaterThanOrEqual(3);
      expect(post.minutes).toBeLessThanOrEqual(15);
      expect(post.tags.length).toBeGreaterThanOrEqual(2);
      expect(post.excerpt.length).toBeGreaterThan(60);
      expect(post.body.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses ISO dates that parse", () => {
    for (const post of posts) {
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(post.date))).toBe(false);
    }
  });

  it("gives every post at least one prose section", () => {
    for (const post of posts) {
      expect(post.sections && post.sections.length).toBeGreaterThan(0);
      for (const section of post.sections ?? []) {
        expect(section.heading.length).toBeGreaterThan(5);
        expect(section.paragraphs.length).toBeGreaterThan(0);
      }
    }
  });
});