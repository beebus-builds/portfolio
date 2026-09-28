import type { MetadataRoute } from "next";
import { planets } from "@/lib/profile";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bibash Poudel — Interactive Space Portfolio",
    short_name: "BP-07",
    description: "Fly a spaceship through five planets holding an about page, skills, projects, contact and resume.",
    start_url: "/",
    display: "standalone",
    background_color: "#04050c",
    theme_color: "#04050c",
    orientation: "any",
    categories: ["portfolio", "development", "technology"],
    lang: "en",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: planets.slice(0, 4).map((planet) => ({
      name: planet.label,
      url: `/?planet=${planet.id}`,
      description: planet.blurb,
    })),
  };
}
