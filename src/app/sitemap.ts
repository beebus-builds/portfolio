import type { MetadataRoute } from "next";
import { planets } from "@/lib/profile";

const baseUrl = "https://bibashpoudel.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const root: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  const sections: MetadataRoute.Sitemap = planets.map((planet) => ({
    url: `${baseUrl}/?planet=${planet.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const resume: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/resume.pdf`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  return [...root, ...sections, ...resume];
}
