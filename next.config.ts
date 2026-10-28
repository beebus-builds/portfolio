import type { NextConfig } from "next";

/**
 * The flight experience is the site, so `/` is the entry point. The classic
 * section pages are gone; these permanent redirects keep old links, bookmarks
 * and search results working by sending each path to the flight world that now
 * carries its content.
 */
const redirects = [
  // The flight used to live at its own address.
  { source: "/flight", destination: "/" },
  // Section pages → the world that holds the same content.
  { source: "/about", destination: "/?planet=about" },
  { source: "/skills", destination: "/?planet=skills" },
  { source: "/projects", destination: "/?planet=projects" },
  { source: "/projects/:slug", destination: "/?planet=projects" },
  { source: "/contact", destination: "/?planet=contact" },
  { source: "/resume", destination: "/?planet=resume" },
  { source: "/experience", destination: "/?planet=resume" },
  { source: "/stats", destination: "/" },
  // Legacy paths from before the current structure.
  { source: "/chess", destination: "/" },
  { source: "/commands", destination: "/" },
  { source: "/education", destination: "/" },
  { source: "/rss.xml", destination: "/" },
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
