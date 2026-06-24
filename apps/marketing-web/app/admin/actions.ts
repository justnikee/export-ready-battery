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
  seo_title: string;
  seo_description: string;
  noindex: boolean;
  categoryIds: string[];
  tagIds: string[];
}

function readForm(formData: FormData): PostFormInput {
  return {
    title: String(formData.get("title") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    cover_image: String(formData.get("cover_image") ?? "").trim(),
    seo_title: String(formData.get("seo_title") ?? "").trim(),
    seo_description: String(formData.get("seo_description") ?? "").trim(),
    noindex: formData.get("noindex") === "on",
    categoryIds: formData.getAll("category_ids").map(String),
    tagIds: formData.getAll("tag_ids").map(String),
  };
}

export async function createPost(formData: FormData) {
  const status = formData.get("status") === "published" ? "published" : "draft";
  await savePost(null, readForm(formData), status);
  redirect("/admin");
}

export async function updatePost(id: string, formData: FormData) {
  const status = formData.get("status") === "published" ? "published" : "draft";
  await savePost(id, readForm(formData), status);
  redirect("/admin");
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
    seo_title: input.seo_title || null,
    seo_description: input.seo_description || null,
    noindex: input.noindex,
    reading_time_minutes: estimateReadingMinutes(input.content),
    status,
    author: userData.user?.email ?? "Unknown",
    author_id: userData.user?.id ?? null,
    published_at: status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = id
    ? await supabase.from("posts").update(record).eq("id", id).select("id").single()
    : await supabase.from("posts").insert(record).select("id").single();

  if (error) {
    throw new Error(`Failed to save post: ${error.message}`);
  }

  const postId = saved.id;

  await supabase.from("post_categories").delete().eq("post_id", postId);
  if (input.categoryIds.length > 0) {
    await supabase.from("post_categories").insert(
      input.categoryIds.map((categoryId) => ({ post_id: postId, category_id: categoryId })),
    );
  }

  await supabase.from("post_tags").delete().eq("post_id", postId);
  if (input.tagIds.length > 0) {
    await supabase.from("post_tags").insert(
      input.tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })),
    );
  }

  revalidatePath("/admin");
  revalidatePath("/blog");
}

export async function deletePost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete post: ${error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/blog");
}
