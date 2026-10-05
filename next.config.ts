import type { NextConfig } from "next";

/**
 * The site is a classic multi-route portfolio (/, /about, /skills,
 * /projects, /contact, /resume, /flight) with the space flight kept at
 * /flight and as an overlay on `?planet=` / `?flight=` deep links.
 * Only legacy paths with no counterpart land back at the front door.
 */
const redirects = [
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
