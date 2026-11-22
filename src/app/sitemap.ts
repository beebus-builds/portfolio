import type { MetadataRoute } from "next";
import { siteUrl as baseUrl } from "@/lib/site";

const sitePageRoutes = ["/summary", "/about", "/skills", "/projects", "/services", "/experience", "/resume", "/contact"];

/** The studio at the root, each portfolio page, and the printable résumé. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...sitePageRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "/contact" ? 0.8 : 0.7,
    })),
    { url: `${baseUrl}/resume.pdf`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
