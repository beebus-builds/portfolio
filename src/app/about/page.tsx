import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { sitePages } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "About — Bibash Poudel",
  description: sitePages.about.lede,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <StandardPage slug="about" />;
}
