import type { NextConfig } from "next";

/**
 * The space-flight rewrite collapsed a multi-route site into one page, so every
 * old path is now a 404. Five of them have an exact counterpart in the new
 * experience and hand off to it via the `?planet=` deep link that the sitemap
 * already advertises; the rest have nowhere to land but the front door.
 *
 * The old /api/* endpoints are deliberately absent: they were machine-facing,
 * so a 404 is the honest answer.
 */
const redirects = [
  { source: "/about", destination: "/?planet=about" },
  { source: "/skills", destination: "/?planet=skills" },
  { source: "/projects", destination: "/?planet=projects" },
  { source: "/projects/:slug", destination: "/?planet=projects" },
  { source: "/contact", destination: "/?planet=contact" },
  { source: "/resume", destination: "/?planet=resume" },
  { source: "/blog", destination: "/" },
  { source: "/blog/:slug", destination: "/" },
  { source: "/chess", destination: "/" },
  { source: "/commands", destination: "/" },
  { source: "/education", destination: "/" },
  { source: "/rss.xml", destination: "/" },
  { source: "/admin", destination: "/" },
  { source: "/admin/:path*", destination: "/" },
].map((rule) => ({ ...rule, permanent: true }));

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  allowedDevOrigins: ["192.168.1.*"],
  async redirects() {
    return redirects;
  },
};

export default nextConfig;
