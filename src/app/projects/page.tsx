import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { sitePages } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "Projects — Bibash Poudel",
  description: sitePages.projects.lede,
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return <StandardPage slug="projects" />;
}
