import { getBlogPosts } from "@/lib/posts";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import BlogList from "./BlogList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Blog",
  description: "Writings about building, designing, and creating.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  // Fetch view counts for each post
  const postsWithViews = await Promise.all(
    posts.map((post) => incrementPostViews(post.slug).then((v) => ({ ...post, views: v })))
  );

  return (
    <PageShell title="Blog" subtitle="Writings about building, designing, and creating.">
      <section className="mb-12 thread">
        <div className="section-accent" />
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <span className="text-xs font-mono text-white/30">{posts.length} post{posts.length === 1 ? "" : "s"}</span>
          <a href="/rss.xml" className="text-[10px] font-mono text-white/30 hover:text-neon-400 transition-colors">
            rss feed ↗
          </a>
        </div>
        {posts.length === 0 ? (
          <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
            <p className="text-sm font-mono text-white/50">No posts yet. Check back soon.</p>
            <Link href="/admin/new" className="inline-block mt-4 text-xs font-mono text-neon-400 border border-neon-400/30 rounded-lg px-4 py-2 hover:bg-neon-400/10 transition-all">
              Write a post →
            </Link>
          </div>
        ) : (
          <BlogList posts={postsWithViews} />
        )}
      </section>
    </PageShell>
  );
}
