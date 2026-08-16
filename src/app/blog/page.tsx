import { getBlogPosts } from "@/lib/posts";
import { incrementPostViews } from "@/lib/db";
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
    <PageShell>
      <section className="mb-12">
        <p className="comment-label mb-3">blog/index.tsx</p>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-2">
          <h1 className="text-4xl md:text-5xl font-mono text-white tracking-tight leading-tight">
            Writing
          </h1>
          <a href="/rss.xml" className="text-[10px] font-mono text-white/30 hover:text-neon-400 transition-colors">
            rss feed ↗
          </a>
        </div>
        <p className="text-sm font-mono text-white/40 max-w-lg leading-relaxed mb-2">
          Writings about building, designing, and creating.
        </p>
        <span className="text-xs font-mono text-white/25">{posts.length} post{posts.length === 1 ? "" : "s"}</span>
      </section>

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
    </PageShell>
  );
}
