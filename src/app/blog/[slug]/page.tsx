import { getBlogPost } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { incrementPostViews, getPostViews, listComments, addComment } from "@/lib/db";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return (
      <PageShell title="Not Found" subtitle="">
        <div className="neon-card border border-white/5 rounded-xl p-8 bg-terminal-900/50 text-center">
          <p className="text-sm font-mono text-white/50">Post not found.</p>
          <Link href="/blog" className="inline-block mt-4 text-xs font-mono text-neon-400">
            ← Back to Blog
          </Link>
        </div>
      </PageShell>
    );
  }

  // Increment view count
  await incrementPostViews(slug);
  const views = await getPostViews(slug);

  // Fetch existing comments
  const comments = await listComments(slug);

  return (
    <PageShell title={post.title} subtitle="">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            datePublished: post.date,
            description: post.excerpt,
            keywords: post.tags.join(", "),
            author: { "@type": "Person", name: "Bibash Poudel", url: "https://bibashpoudel.dev" },
          }),
        }}
      />
      <article className="thread">
        {post.cover && (
          <div className="relative aspect-[21/9] rounded-xl overflow-hidden border border-white/10 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <section className="mb-8 thread-dot">
          <div className="section-accent" />
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-white/30">{post.date}</span>
            <span className="text-[10px] font-mono text-white/20">·</span>
            <span className="text-[10px] font-mono text-white/30">{post.readingTime} min read</span>
            <span className="text-[10px] font-mono text-white/20 ml-4">👁 {views} views</span>
          </div>
        </section>

        <section className="mb-16 rail-card">
          <div
            className="md-body border-l-2 border-neon-400/20 pl-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
          />
        </section>

        {/* Comments Section */}
        <section className="mb-16">
          <div className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs font-mono text-white/30">Comments</span>
              {comments.length > 0 && (
                <span className="text-xs font-mono text-white/40">
                  {comments.length} {comments.length === 1 ? "comment" : "comments"}
                </span>
              )}
            </div>

            {/* Comments List */}
            <div className="space-y-3 mt-4">
              {comments.map((comment) => (
                <div key={comment.id} className="neon-card p-4 border border-white/5 rounded-xl bg-terminal-900/50">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{comment.name}</span>
                    <span className="text-[9px] font-mono text-white/20">·</span>
                  </div>
                  <p className="text-sm font-mono text-white/60 leading-relaxed">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-xs font-mono text-white/50">No comments yet.</p>
              )}
            </div>

            {/* Comment Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name") as string;
                const content = formData.get("content") as string;
                if (!name || !content) return;
                await addComment(slug, name, content);
                // Refresh comments by re-fetching
                window.location.reload();
              }}
              className="neon-card border border-white/5 rounded-xl p-5 bg-terminal-900/50 space-y-3 w-full max-w-md"
            >
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1">
                  Your Name
                  <span className="text-red-400">*</span>
                </label>
                <input
                  name="name"
                  required
                  className="w-full bg-terminal-800 border border-white/10 text-white rounded px-3 py-2 text-xs focus:border-neon-400 outline-none"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1">
                  Comment
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="content"
                  rows={3}
                  required
                  className="w-full bg-terminal-800 border border-white/10 text-white rounded px-3 py-2 text-xs resize-none focus:border-neon-400 outline-none"
                  placeholder="Write a comment..."
                />
              </div>
              <button type="submit" className="btn-neon w-full text-xs py-2">
                Post Comment
              </button>
            </form>
          </div>
        </section>
      </article>
    </PageShell>
  );
}