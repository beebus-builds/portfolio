export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  minutes: number;
}

export const posts: Post[] = [
  {
    slug: "homomorphic-voting-notes",
    title: "Notes on shipping an encrypted voting platform",
    date: "2026-09-12",
    excerpt:
      "Paillier encryption sounds like a whitepaper, but the real work is the chicken-and-egg problem: you need the tally to be correct and nobody — including you — to see the votes.",
    tags: ["Cryptography", "Security", "Lessons"],
    minutes: 6,
  },
  {
    slug: "gpx-on-a-phone",
    title: "Parsing GPX tracks so they feel instant on a phone",
    date: "2026-08-03",
    excerpt:
      "Elevation profiles felt sluggish until I moved parsing into the browser and stopped apologizing for mountains.",
    tags: ["Performance", "Maps"],
    minutes: 4,
  },
  {
    slug: "wordpress-honest-audits",
    title: "The audit fixes WordPress sites need every month",
    date: "2026-06-21",
    excerpt:
      "Most WordPress emergencies are the same five tickets wearing different costumes. A checklist beats a fire drill.",
    tags: ["WordPress", "Maintenance"],
    minutes: 5,
  },
  {
    slug: "three-oceans-portfolio",
    title: "Why this portfolio is a solar system, not a template",
    date: "2026-05-10",
    excerpt:
      "Templates are for borrowing. A 3D flight deck is for remembering. The thinking behind building a portfolio you can actually fly through.",
    tags: ["Three.js", "Design"],
    minutes: 7,
  },
];
