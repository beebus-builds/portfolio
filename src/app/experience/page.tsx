import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { sitePages } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "Experience — Bibash Poudel",
  description: sitePages.experience.lede,
  alternates: { canonical: "/experience" },
};

export default function ExperiencePage() {
  return <StandardPage slug="experience" />;
}
