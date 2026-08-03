import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/call-agent", "/api/"],
      },
    ],
    sitemap: "https://bibashpoudel.dev/sitemap.xml",
  };
}
