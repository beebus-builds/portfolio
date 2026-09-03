import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/posts";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bibashpoudel.dev";

  const staticPages = [
    "",
    "/about",
    "/blog",
    "/chess",
    "/commands",
    "/contact",
    "/education",
    "/projects",
    "/skills",
  ];

  const now = new Date();

  const pages = staticPages.map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.7,
  }));

    let blogPosts: MetadataRoute.Sitemap = [];
  try {
    blogPosts = (await getBlogPosts()).map((post) => {
      const time = new Date(post.date).getTime();
      return {
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: Number.isFinite(time) ? new Date(time) : now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    });
  } catch (err) {
    console.error("sitemap: failed to load posts", err);
  }

  const projectPages = [
    "/projects/ivote",
    "/projects/pharma-connect",
    "/projects/automate",
    "/projects/match-day-poster",
    "/projects/nico-paz",
    "/projects/himalayan-plugin",
  ].map((p) => ({
    url: `${baseUrl}${p}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...blogPosts, ...projectPages];
}
