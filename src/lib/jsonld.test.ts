import { describe, expect, it } from "vitest";
import { blogPostingJsonLd, personJsonLd } from "./jsonld";
import { profile, techStack } from "@/lib/profile";
import { siteUrl } from "@/lib/site";
import type { Post } from "@/lib/posts";

describe("personJsonLd", () => {
  it("describes the profile as a schema.org Person", () => {
    const json = personJsonLd();

    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@type"]).toBe("Person");
    expect(json.name).toBe(profile.name);
    expect(json.url).toBe(siteUrl);
    expect(json.jobTitle).toBe(profile.role);
    expect(json.email).toBe("mailto:poudelbibash044@gmail.com");
    expect(json.knowsAbout).toBe(techStack);
    expect(json.address).toEqual({
      "@type": "PostalAddress",
      addressLocality: "Sindhuli",
      addressCountry: "NP",
    });
  });

  it("lists only absolute URLs in sameAs", () => {
    const json = personJsonLd();
    const sameAs = json.sameAs as string[];

    expect(sameAs).toContain("https://github.com/beebus-builds");
    expect(sameAs).toContain("https://linkedin.com/in/bibashpoudel");
    // The mailto link is not a profile page.
    expect(sameAs.every((href) => href.startsWith("http"))).toBe(true);
  });
});

describe("blogPostingJsonLd", () => {
  const post: Post = {
    slug: "splitting-the-stylesheet",
    title: "Splitting a 4,300-line stylesheet",
    date: "2026-10-28",
    excerpt: "How the CSS was cut apart without changing a byte.",
    tags: ["CSS", "Refactoring"],
    minutes: 7,
    body: ["Lead."],
    cover: { src: "/blog/cover.svg", alt: "Cover" },
  };

  it("builds absolute URLs for the page and image", () => {
    const json = blogPostingJsonLd(post);

    expect(json["@type"]).toBe("BlogPosting");
    expect(json.headline).toBe(post.title);
    expect(json.description).toBe(post.excerpt);
    expect(json.url).toBe(`${siteUrl}/blog/${post.slug}`);
    expect(json.mainEntityOfPage).toBe(`${siteUrl}/blog/${post.slug}`);
    expect(json.image).toBe(`${siteUrl}/blog/cover.svg`);
  });

  it("carries the publishing metadata", () => {
    const json = blogPostingJsonLd(post);

    expect(json.datePublished).toBe("2026-10-28");
    expect(json.dateModified).toBe("2026-10-28");
    expect(json.keywords).toBe("CSS, Refactoring");
    expect(json.timeRequired).toBe("PT7M");
    expect(json.author).toEqual({ "@type": "Person", name: profile.name, url: siteUrl });
    expect(json.inLanguage).toBe("en");
  });
});
