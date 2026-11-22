import type { MetadataRoute } from "next";
import { profile } from "@/lib/profile";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${profile.name} — 3D Studio Portfolio`,
    short_name: "Bibash Poudel",
    description: "Step into the 3D studio of Bibash Poudel — a creative developer. Browse the about, skills, projects, contact and resume pages.",
    start_url: "/",
    display: "standalone",
    background_color: "#04050c",
    theme_color: "#04050c",
    orientation: "any",
    categories: ["portfolio", "development", "technology"],
    lang: "en",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "About", url: "/about", description: "Who builds here and why" },
      { name: "Projects", url: "/projects", description: "The work, from first sketch to shipped" },
      { name: "Contact", url: "/contact", description: "An open line — say hello" },
    ],
  };
}
