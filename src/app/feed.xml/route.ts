import { NextResponse } from "next/server";
import { listPosts } from "@/lib/postsStore";
import { profile } from "@/lib/profile";
import { absoluteUrl, siteUrl } from "@/lib/site";

export const runtime = "nodejs";
export const revalidate = 300;

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

/**
 * RSS 2.0 feed for the blog. Same read path as the blog index — when the
 * database is unreachable it degrades to an empty channel rather than a 500,
 * so a dead Neon never takes the feed (and feed readers' retry schedules)
 * hostage.
 */
export async function GET() {
  const channel = {
    title: `${profile.name} — blog`,
    link: siteUrl,
    description: `Writing on engineering, product and craft by ${profile.name}.`,
    language: "en",
  };

  let items = "";
  try {
    items = (await listPosts())
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${absoluteUrl(`/blog/${post.slug}`)}</link>
      <guid isPermaLink="true">${absoluteUrl(`/blog/${post.slug}`)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`
      )
      .join("");
  } catch (error) {
    console.error("GET /feed.xml failed:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${channel.link}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${channel.language}</language>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
