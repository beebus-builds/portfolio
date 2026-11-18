import type { Metadata } from "next";
import CitySim from "@/components/city/CitySim";
import SitePage, { PageHero } from "@/components/site/SitePage";
import { profile } from "@/lib/profile";

export const metadata: Metadata = {
  title: `${profile.name} — ${profile.role} in ${profile.location}`,
  description:
    "Build a small city to explore the portfolio of Bibash Poudel, a creative developer working across Next.js, TypeScript, WordPress and the systems behind them.",
};

export default function Home() {
  return (
    <SitePage
      hero={
        <PageHero
          kicker="WELCOME, MAYOR"
          title="Bibashville"
          lede="This portfolio is a city you build. Lay down cottages, open workshops, grow a skyline — and unlock the districts that tell the story behind the work."
          meta={["A playable portfolio", "Progress saved in your browser", "Eight districts to explore"]}
        />
      }
    >
      <div className="doc">
        <CitySim />
      </div>
    </SitePage>
  );
}
