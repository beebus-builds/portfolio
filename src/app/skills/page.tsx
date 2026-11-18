import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { sitePages } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "Skills — Bibash Poudel",
  description: sitePages.skills.lede,
  alternates: { canonical: "/skills" },
};

export default function SkillsPage() {
  return <StandardPage slug="skills" />;
}
