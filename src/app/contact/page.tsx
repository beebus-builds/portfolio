import type { Metadata } from "next";
import StandardPage from "@/components/site/StandardPage";
import { sitePages } from "@/lib/sitePages";

export const metadata: Metadata = {
  title: "Contact — Bibash Poudel",
  description: sitePages.contact.lede,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <StandardPage slug="contact" />;
}
