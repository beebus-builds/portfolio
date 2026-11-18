import type { MetadataRoute } from "next";
import { listPosts } from "@/lib/postsStore";
import { siteUrl as baseUrl } from "@/lib/site";

const sitePageRoutes = [
  "/about",
  "/skills",
  "/projects",
  "/services",
  "/experience",
  "/resume",
  "/stats",
  "/contact",
  "/blog",
];

// Posts come from Neon now, so the sitemap reads them at request time and is
// rebuilt on the same revalidation window as the blog.
export const revalidate = 3600;

/**
 * The flight stays at the root, and every section now also has a classic page
 * with its own address. Posts and the printable record are appended below.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const posts = await listPosts();

  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...sitePageRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "/contact" ? 0.8 : 0.7,
    })),
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
