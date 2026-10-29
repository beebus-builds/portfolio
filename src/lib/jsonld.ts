import { profile, techStack } from "@/lib/profile";
import { absoluteUrl, siteUrl } from "@/lib/site";
import type { Post } from "@/lib/posts";

/**
 * Structured data for search engines. Kept in one place so the markup can
 * never drift from the profile or the post records it describes.
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

export function blogPostingJsonLd(post: Post): Record<string, unknown> {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    // Posts are published once and edited rarely; the published date is the
    // honest last-modified date the data model can offer.
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Person", name: profile.name, url: siteUrl },
    image: absoluteUrl(post.cover.src),
    mainEntityOfPage: url,
    url,
    keywords: post.tags.join(", "),
    timeRequired: `PT${post.minutes}M`,
    inLanguage: "en",
  };
}
