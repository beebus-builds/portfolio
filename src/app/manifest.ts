import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bibash Poudel — Nepal Dev Terminal",
    short_name: "Nepal Dev",
    description: "Interactive portfolio of Bibash Poudel — Developer from Nepal",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a1a",
    theme_color: "#4af0ff",
    orientation: "any",
    categories: ["portfolio", "development", "technology"],
    lang: "en",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Terminal", url: "/", description: "Open the terminal" },
      { name: "About", url: "/about", description: "About Bibash" },
      { name: "Projects", url: "/projects", description: "View projects" },
      { name: "Contact", url: "/contact", description: "Get in touch" },
    ],
  };
}
