import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { sitePages } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "Resume — Bibash Poudel",
  description: sitePages.resume.lede,
  alternates: { canonical: "/resume" },
};

export default function ResumePage() {
  return <StandardPage slug="resume" />;
}
