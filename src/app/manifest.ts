import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PROJECT ORBITAL — Bibash Poudel",
    short_name: "PROJECT ORBITAL",
    description: "An orbital developer station by Bibash Poudel.",
    start_url: "/",
    display: "standalone",
    background_color: "#05080d",
    theme_color: "#6fe6f4",
    orientation: "any",
    categories: ["portfolio", "development", "technology"],
    lang: "en",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Mission control", url: "/", description: "Enter PROJECT ORBITAL" },
      { name: "Projects", url: "/projects", description: "View missions" },
      { name: "Contact", url: "/contact", description: "Open a channel" },
    ],
  };
}
