"use server";

import { addComment } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addCommentAction(slug: string, formData: FormData) {
  const name = formData.get("name") as string;
  const content = formData.get("content") as string;
  if (!name || !content) return;
  await addComment(slug, name, content);
  revalidatePath(`/blog/${slug}`);
}
