import { listPosts, getPostBySlug } from "./db";
import { BlogPost } from "./markdown";

export async function getBlogPosts(): Promise<BlogPost[]> {
  return listPosts();
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return getPostBySlug(slug);
}
