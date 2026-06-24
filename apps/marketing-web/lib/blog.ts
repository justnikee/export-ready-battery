import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { BlogFormData, BlogPost } from "@/lib/types";

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load posts: ${error.message}`);
  }
  return data ?? [];
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load post: ${error.message}`);
  }
  return data;
}

export async function getAllPostsForAdmin(): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load posts: ${error.message}`);
  }
  return data ?? [];
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load post: ${error.message}`);
  }
  return data;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function estimateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export type { BlogFormData, BlogPost };
