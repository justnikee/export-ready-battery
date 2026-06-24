import { createClient as createServerSupabase } from "@/lib/supabase/server";
import type { BlogFormData, BlogPost, Category, Tag } from "@/lib/types";

const POST_SELECT = `*, post_categories(categories(*)), post_tags(tags(*))`;

interface PostRow {
  post_categories?: { categories: Category | null }[] | null;
  post_tags?: { tags: Tag | null }[] | null;
  [key: string]: unknown;
}

function mapPostRow(row: PostRow): BlogPost {
  const { post_categories, post_tags, ...rest } = row;
  return {
    ...(rest as Omit<BlogPost, "categories" | "tags">),
    categories: (post_categories ?? [])
      .map((entry) => entry.categories)
      .filter((category): category is Category => category !== null),
    tags: (post_tags ?? [])
      .map((entry) => entry.tags)
      .filter((tag): tag is Tag => tag !== null),
  };
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load posts: ${error.message}`);
  }
  return (data ?? []).map(mapPostRow);
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load post: ${error.message}`);
  }
  return data ? mapPostRow(data) : null;
}

export async function getPublishedPostsByCategorySlug(
  slug: string,
): Promise<{ category: Category | null; posts: BlogPost[] }> {
  const supabase = await createServerSupabase();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    return { category: null, posts: [] };
  }

  const { data, error } = await supabase
    .from("posts")
    .select(`${POST_SELECT}, post_categories!inner(category_id)`)
    .eq("status", "published")
    .eq("post_categories.category_id", category.id)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load posts: ${error.message}`);
  }
  return { category, posts: (data ?? []).map(mapPostRow) };
}

export async function getPublishedPostsByTagSlug(
  slug: string,
): Promise<{ tag: Tag | null; posts: BlogPost[] }> {
  const supabase = await createServerSupabase();
  const { data: tag } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!tag) {
    return { tag: null, posts: [] };
  }

  const { data, error } = await supabase
    .from("posts")
    .select(`${POST_SELECT}, post_tags!inner(tag_id)`)
    .eq("status", "published")
    .eq("post_tags.tag_id", tag.id)
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load posts: ${error.message}`);
  }
  return { tag, posts: (data ?? []).map(mapPostRow) };
}

export async function getAllPostsForAdmin(): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load posts: ${error.message}`);
  }
  return (data ?? []).map(mapPostRow);
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load post: ${error.message}`);
  }
  return data ? mapPostRow(data) : null;
}

export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  return data ?? [];
}

export async function getAllTags(): Promise<Tag[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load tags: ${error.message}`);
  }
  return data ?? [];
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

export type { BlogFormData, BlogPost, Category, Tag };
