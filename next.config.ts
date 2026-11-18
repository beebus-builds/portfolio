import type { NextConfig } from "next";

/**
 * `/` remains the flight. Every section also has a classic page of its own, so
 * only genuinely old addresses need a permanent redirect now.
 */
const redirects = [
  // The flight used to live at its own address.
  { source: "/flight", destination: "/" },
  // Legacy paths that never got their own page.
  { source: "/projects/:slug", destination: "/projects" },
  { source: "/education", destination: "/experience" },
  { source: "/chess", destination: "/" },
  { source: "/commands", destination: "/" },
  { source: "/rss.xml", destination: "/feed.xml" },
].map((rule) => ({ ...rule, permanent: true }));

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  // Dev-only convenience: set DEV_ORIGINS in .env (e.g. your LAN IP) to reach
  // the dev server from other devices, like a phone running the touch controls.
  allowedDevOrigins: process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : [],
  async redirects() {
    return redirects;
  },
  async rewrites() {
    return [
      // Post bodies written before uploads moved into Postgres reference
      // /uploads/<name>. Files committed at build time still win (rewrites run
      // after the filesystem); anything missing on disk now resolves to the
      // database-backed image route.
      { source: "/uploads/:name", destination: "/api/images/:name" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/resume.pdf",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
