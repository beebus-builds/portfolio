import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { countMessages } from "@/lib/contact";
import { achievements } from "@/lib/medals";
import { getProgressStats } from "@/lib/progress";
import { sitePages, type Block, type PageSection } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "Stats — Bibash Poudel",
  description: sitePages.stats.lede,
  alternates: { canonical: "/stats" },
};

/** Live counters are cached briefly at the data layer; the page follows that. */
export const revalidate = 60;

export default async function StatsPage() {
  const [stats, messages] = await Promise.all([getProgressStats(), countMessages()]);

  const live: Block = {
    kind: "metrics",
    items: [
      { value: String(stats.visitors), label: "Visitors", note: "Anonymous flight logs" },
      { value: String(stats.planetsVisited), label: "Worlds visited", note: "Unique docks per pilot" },
      { value: String(stats.achievementsUnlocked), label: "Medals unlocked", note: "Across all visitors" },
      { value: String(messages), label: "Signals received", note: "Messages in the inbox" },
    ],
  };

  const topAchievements: Block = {
    kind: "bullets",
    items:
      stats.topAchievements.length > 0
        ? stats.topAchievements.map((entry) => {
            const medal = achievements.find((achievement) => achievement.id === entry.id);
            return `${medal?.title ?? entry.id} — ${entry.unlocks} unlocks`;
          })
        : ["No medals have been unlocked yet. The flight is waiting."],
  };

  const sections: PageSection[] = sitePages.stats.sections.map((section, index) => {
    if (index === 0) return { ...section, blocks: [live, ...section.blocks] };
    if (section.id === "leaderboard") return { ...section, blocks: [topAchievements, ...section.blocks] };
    return section;
  });

  return <StandardPage slug="stats" content={{ ...sitePages.stats, sections }} />;
}
