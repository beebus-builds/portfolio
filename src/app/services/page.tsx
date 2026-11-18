import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { sitePages } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "Services — Bibash Poudel",
  description: sitePages.services.lede,
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <StandardPage slug="services" />;
}
