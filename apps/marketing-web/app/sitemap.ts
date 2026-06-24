import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getPublishedPosts } from "@/lib/blog";

const staticRoutes = ["", "/battery", "/textile", "/pricing", "/request-access", "/blog"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  let posts: Awaited<ReturnType<typeof getPublishedPosts>> = [];
  try {
    posts = await getPublishedPosts();
  } catch {
    // Supabase not configured yet — sitemap still serves the static routes.
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
  }));

  return [...staticEntries, ...postEntries];
}
