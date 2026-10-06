import { describe, expect, it } from "vitest";
import { parsePostContent, serializePostContent, postToContent } from "./postBody";
import { validatePostInput } from "./postValidation";
import { posts } from "./posts";

const SAMPLE = `A lead paragraph that wraps across
two source lines and reads as one sentence.

> The punchline of the post.

## First section

A paragraph in the section.

- one
- two

\`\`\`ts
const x: number = 1;
\`\`\`

## Second section

Closing thoughts.`;

describe("parsePostContent", () => {
  const parsed = parsePostContent(SAMPLE);

  it("joins wrapped lines into single paragraphs", () => {
    expect(parsed.body).toEqual([
      "A lead paragraph that wraps across two source lines and reads as one sentence.",
    ]);
  });

  it("captures the pull quote", () => {
    expect(parsed.quote).toBe("The punchline of the post.");
  });

  it("splits sections at ## headings", () => {
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0].heading).toBe("First section");
    expect(parsed.sections[1].heading).toBe("Second section");
  });

  it("collects bullets and code per section", () => {
    expect(parsed.sections[0].bullets).toEqual(["one", "two"]);
    expect(parsed.sections[0].code).toEqual({ lang: "ts", snippet: "const x: number = 1;" });
    expect(parsed.sections[1].code).toBeUndefined();
  });

  it("handles CRLF input", () => {
    const crlf = parsePostContent(SAMPLE.replace(/\n/g, "\r\n"));
    expect(crlf.body[0]).toBe(parsed.body[0]);
    expect(crlf.sections[0].heading).toBe("First section");
  });

  it("returns empty structures for empty input", () => {
    const empty = parsePostContent("");
    expect(empty.body).toEqual([]);
    expect(empty.sections).toEqual([]);
    expect(empty.quote).toBeUndefined();
  });
});

describe("serializePostContent", () => {
  it("round-trips a parsed post without loss", () => {
    const parsed = parsePostContent(SAMPLE);
    const reserialized = serializePostContent(parsed);
    expect(parsePostContent(reserialized)).toEqual(parsed);
  });

  it("round-trips every seeded post", () => {
    for (const post of posts) {
      const content = postToContent(post);
      const parsed = parsePostContent(content);
      expect(parsed.body).toEqual(post.body);
      expect(parsed.quote).toBe(post.quote);
      expect(parsed.sections).toEqual(post.sections ?? []);
    }
  });
});

describe("validatePostInput", () => {
  const valid = {
    slug: "a-perfectly-good-slug",
    title: "A sufficiently long post title",
    date: "2026-10-06",
    excerpt: "An excerpt that is long enough to serve as share text for a link preview.",
    tags: ["Next.js", "Testing"],
    minutes: 7,
    body: ["A lead paragraph."],
    sections: [],
    cover_src: "/blog/a-perfectly-good-slug.svg",
    cover_alt: "A radar sweep with concentric arcs over a dark blue sky",
  };

  it("accepts a well-formed payload", () => {
    const result = validatePostInput(valid);
    expect(result.ok).toBe(true);
  });

  it("lowercases the slug", () => {
    const result = validatePostInput({ ...valid, slug: "Mixed-Case-Slug" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.slug).toBe("mixed-case-slug");
  });

  it("honours a slug forced by the route path", () => {
    const result = validatePostInput({ ...valid, slug: "ignored" }, "from-the-path");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.slug).toBe("from-the-path");
  });

  it("rejects a slug with spaces or symbols", () => {
    const result = validatePostInput({ ...valid, slug: "Not a slug!" });
    expect(result.ok).toBe(false);
  });

  it("requires a date in YYYY-MM-DD", () => {
    expect(validatePostInput({ ...valid, date: "06/10/2026" }).ok).toBe(false);
    expect(validatePostInput({ ...valid, date: "2026-13-45" }).ok).toBe(false);
  });

  it("requires an excerpt long enough to be useful as share text", () => {
    expect(validatePostInput({ ...valid, excerpt: "Too short." }).ok).toBe(false);
  });

  it("requires at least one tag", () => {
    expect(validatePostInput({ ...valid, tags: [] }).ok).toBe(false);
  });

  it("requires an opening paragraph", () => {
    expect(validatePostInput({ ...valid, body: [] }).ok).toBe(false);
  });

  it("caps read time at a sane range", () => {
    expect(validatePostInput({ ...valid, minutes: 0 }).ok).toBe(false);
    expect(validatePostInput({ ...valid, minutes: 900 }).ok).toBe(false);
  });

  it("refuses a cover path outside the generated set", () => {
    expect(validatePostInput({ ...valid, cover_src: "/uploads/evil.svg" }).ok).toBe(false);
    expect(validatePostInput({ ...valid, cover_src: "https://evil.test/x.svg" }).ok).toBe(false);
  });

  it("accepts the generated cover route", () => {
    const result = validatePostInput({ ...valid, cover_src: "/api/cover/my-post" });
    expect(result.ok).toBe(true);
  });

  it("validates the accent colour and variant", () => {
    expect(validatePostInput({ ...valid, cover_accent: "red" }).ok).toBe(false);
    expect(validatePostInput({ ...valid, cover_variant: 99 }).ok).toBe(false);
    const good = validatePostInput({ ...valid, cover_accent: "#38BDF8", cover_variant: 3 });
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.input.cover_accent).toBe("#38bdf8");
  });

  it("requires descriptive cover alt text", () => {
    expect(validatePostInput({ ...valid, cover_alt: "image" }).ok).toBe(false);
  });

  it("drops empty bullets and code from sections", () => {
    const result = validatePostInput({
      ...valid,
      sections: [{ heading: "Kept", paragraphs: ["Text."], bullets: [], code: "" }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.sections[0].bullets).toBeUndefined();
      expect(result.input.sections[0].code).toBeUndefined();
    }
  });

  it("treats published: false as a draft", () => {
    const result = validatePostInput({ ...valid, published: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.published).toBe(false);
  });

  it("reports several problems at once", () => {
    const result = validatePostInput({ ...valid, slug: "BAD SLUG", body: [], tags: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});