export interface MegaLink {
  title: string;
  description: string;
  href: string;
  badge?: string;
  color?: string;
  image?: string;
}

export const workLinks: MegaLink[] = [
  {
    title: "iVote — Secure Voting",
    description: "End-to-end encrypted voting using Paillier homomorphic encryption.",
    href: "/projects/ivote",
    badge: "Hot",
    color: "#54e6d4",
    image: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Pharma Connect",
    description: "Location-aware discovery connecting patients and pharmacies.",
    href: "/projects/pharma-connect",
    color: "#ff6b35",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Match Day Poster",
    description: "Real-time football tracking with automated Facebook summaries.",
    href: "/projects/match-day-poster",
    color: "#22c55e",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=200&auto=format&fit=crop",
  },
];

export const ecosystemLinks = [
  { label: "All Projects", href: "/projects", icon: "📁", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=100&auto=format&fit=crop" },
  { label: "Skills Matrix", href: "/skills", icon: "🛠", image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=100&auto=format&fit=crop" },
  { label: "Education Journey", href: "/education", icon: "🎓", image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=100&auto=format&fit=crop" },
];

export const labLinks: MegaLink[] = [
  {
    title: "Play Virtual Chess",
    description: "Challenge a hybrid engine in 2D or immersive Three.js 3D.",
    href: "/chess",
    badge: "Play",
    color: "#ff4af0",
    image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=200&auto=format&fit=crop",
  },
  {
    title: "Terminal CLI Playground",
    description: "Navigate my virtual filesystem directly from a custom command shell.",
    href: "/commands",
    color: "#ffd700",
    image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=200&auto=format&fit=crop",
  },
];
