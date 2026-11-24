import type { NextConfig } from "next";

/**
 * Every section has a classic page of its own, so only genuinely old
 * addresses need a permanent redirect now.
 */
const redirects = [
  // Legacy paths that never got their own page.
  { source: "/projects/:slug", destination: "/projects" },
  { source: "/education", destination: "/experience" },
  { source: "/rss.xml", destination: "/feed.xml" },
].map((rule) => ({ ...rule, permanent: true }));

const nextConfig: NextConfig = {
  // three ships untranspiled ES modules; Next needs to process them for the
  // 3D city scene the same way it did for the old flight.
  transpilePackages: ["three"],
  // Dev-only convenience: set DEV_ORIGINS in .env (e.g. your LAN IP) to reach
  // the dev server from other devices.
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
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
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
