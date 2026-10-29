import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/postsStore", () => ({
  listPosts: vi.fn(),
}));

import { listPosts } from "@/lib/postsStore";

const listPostsMock = vi.mocked(listPosts);

beforeEach(() => {
  listPostsMock.mockReset();
  listPostsMock.mockResolvedValue([]);
});

describe("GET /feed.xml", () => {
  it("serves a valid RSS 2.0 channel", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/rss+xml");
    const xml = await res.text();
    expect(xml).toContain('<rss version="2.0">');
    expect(xml).toContain("<channel>");
  });

  it("lists posts with absolute links and RFC-822 dates", async () => {
    listPostsMock.mockResolvedValue([
      {
        slug: "splitting-the-stylesheet",
        title: "Splitting a 4,300-line stylesheet",
        date: "2026-10-28",
        excerpt: "How the CSS was cut apart without changing a byte.",
        tags: ["CSS"],
        minutes: 7,
        body: [],
        cover: { src: "/c.svg", alt: "" },
      },
    ]);

    const xml = await (await GET()).text();
    const link = "https://poudel.vercel.app/blog/splitting-the-stylesheet";

    expect(xml).toContain(`<link>${link}</link>`);
    expect(xml).toContain(`<guid isPermaLink="true">${link}</guid>`);
    expect(xml).toContain("<title>Splitting a 4,300-line stylesheet</title>");
    expect(xml).toContain("<pubDate>Wed, 28 Oct 2026 00:00:00 GMT</pubDate>");
  });

  it("escapes markup characters in titles and excerpts", async () => {
    listPostsMock.mockResolvedValue([
      {
        slug: "dots-and-angles",
        title: "A & B <C> \"D\" 'E'",
        date: "2026-10-27",
        excerpt: "Quote: <b>bold</b> & 'quoted'",
        tags: [],
        minutes: 3,
        body: [],
        cover: { src: "/c.svg", alt: "" },
      },
    ]);

    const xml = await (await GET()).text();

    expect(xml).toContain("A &amp; B &lt;C&gt; &quot;D&quot; &apos;E&apos;");
    expect(xml).toContain("&lt;b&gt;bold&lt;/b&gt; &amp; &apos;quoted&apos;");
    expect(xml).not.toContain("<b>bold</b>");
  });

  it("degrades to an empty channel instead of a 500 when the library is unreachable", async () => {
    listPostsMock.mockRejectedValue(new Error("pool gone"));

    const res = await GET();
    const xml = await res.text();

    expect(res.status).toBe(200);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
  });
});
