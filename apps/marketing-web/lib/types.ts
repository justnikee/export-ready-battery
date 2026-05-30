export type BlogPostStatus = "draft" | "published" | "archived";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  author: string;
  status: BlogPostStatus;
  tags: string[];
  category?: string;
  seo_title?: string;
  seo_description?: string;
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
  tags: string[];
  category?: string;
  seo_title?: string;
  seo_description?: string;
  reading_time_minutes?: number;
  author?: string;
}
