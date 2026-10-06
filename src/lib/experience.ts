export interface Role {
  company: string;
  role: string;
  period: string;
  location: string;
  points: string[];
}

export const experience: Role[] = [
  {
    company: "Freelance / Independent",
    role: "Creative developer & full-stack engineer",
    period: "2024 — Present",
    location: "Sindhuli, Nepal · Remote",
    points: [
      "Shipped client products end to end: voting platforms, pharmacy logistics, and WordPress builds for international brands.",
      "Own the whole stack — Next.js front ends, typed APIs, Postgres schemas, and Vercel deployments.",
      "Partner with small teams where one developer has to mean a full department.",
    ],
  },
  {
    company: "University — BSc Computing",
    role: "Student developer, campus tools club",
    period: "2022 — 2026",
    location: "Kathmandu, Nepal",
    points: [
      "Led the build of iVote, an encrypted online voting platform used in campus elections.",
      "Mentored juniors on TypeScript, Git workflows, and not fearing the terminal.",
      "Turned coursework into production: every project shipped with a real deploy, not a zip file.",
    ],
  },
  {
    company: "Early web experiments",
    role: "Self-taught WordPress & PHP",
    period: "2020 — 2022",
    location: "Sindhuli, Nepal",
    points: [
      "Built theme and plugin sites for local businesses and shipped the first custom WordPress theme.",
      "Learned performance, SEO, and accessibility the hard way — by breaking real sites.",
      "Discovered that good software is 30% code and 70% asking the right question.",
    ],
  },
];
