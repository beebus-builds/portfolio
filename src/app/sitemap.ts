import type { MetadataRoute } from "next";
import { listPosts } from "@/lib/postsStore";
import { siteUrl as baseUrl } from "@/lib/site";

// Posts come from Neon now, so the sitemap reads them at request time and is
// rebuilt on the same revalidation window as the blog.
export const revalidate = 3600;

/**
 * The site is a single flight experience, so the sitemap is deliberately short:
 * the entry point, the logbook, and the printable record. Every section lives
 * on a world you dock with inside the canvas rather than at its own URL.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await listPosts();

  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const resume: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/resume.pdf`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  return [...pages, ...postPages, ...resume];
}
