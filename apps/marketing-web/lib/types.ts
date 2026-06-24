export type BlogPostStatus = "draft" | "published" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  author: string;
  status: BlogPostStatus;
  categories: Category[];
  tags: Tag[];
  seo_title?: string;
  seo_description?: string;
  noindex: boolean;
  reading_time_minutes?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogFormData {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  status: BlogPostStatus;
  category_ids: string[];
  tag_ids: string[];
  seo_title?: string;
  seo_description?: string;
  noindex?: boolean;
  author?: string;
}
