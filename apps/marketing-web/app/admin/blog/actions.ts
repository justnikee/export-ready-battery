"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estimateReadingMinutes, slugify } from "@/lib/blog";
import type { BlogPostStatus } from "@/lib/types";

interface PostFormInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  seo_title: string;
  seo_description: string;
  tags: string;
}

function readForm(formData: FormData): PostFormInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    cover_image: String(formData.get("cover_image") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    seo_title: String(formData.get("seo_title") ?? "").trim(),
    seo_description: String(formData.get("seo_description") ?? "").trim(),
    tags: String(formData.get("tags") ?? "").trim(),
  };
}

export async function createPost(formData: FormData) {
  const status = formData.get("status") === "published" ? "published" : "draft";
  await savePost(null, readForm(formData), status);
  redirect("/admin/blog");
}

export async function updatePost(id: string, formData: FormData) {
  const status = formData.get("status") === "published" ? "published" : "draft";
  await savePost(id, readForm(formData), status);
  redirect("/admin/blog");
}

async function savePost(
  id: string | null,
  input: PostFormInput,
  status: BlogPostStatus,
) {
  if (!input.title) {
    throw new Error("Title is required");
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const record = {
    title: input.title,
    slug: input.slug || slugify(input.title),
    excerpt: input.excerpt || null,
    content: input.content,
    cover_image: input.cover_image || null,
    category: input.category || null,
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    reading_time_minutes: estimateReadingMinutes(input.content),
    tags: input.tags
      ? input.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [],
    status,
    author: userData.user?.email ?? "Unknown",
    author_id: userData.user?.id ?? null,
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { error } = id
    ? await supabase.from("posts").update(record).eq("id", id)
    : await supabase.from("posts").insert(record);

  if (error) {
    throw new Error(`Failed to save post: ${error.message}`);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
