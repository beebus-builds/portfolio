import { profile, techStack } from "@/lib/profile";
import { siteUrl } from "@/lib/site";

/**
 * Structured data for search engines. Kept in one place so the markup can
 * never drift from the profile.
 */

export function personJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    url: siteUrl,
    jobTitle: profile.role,
    email: profile.links.find((link) => link.label === "Email")?.href ?? "",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Sindhuli",
      addressCountry: "NP",
    },
    sameAs: profile.links.filter((link) => link.href.startsWith("http")).map((link) => link.href),
    knowsAbout: techStack,
  };
}

