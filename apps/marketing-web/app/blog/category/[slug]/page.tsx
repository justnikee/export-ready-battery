import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublishedPostsByCategorySlug } from "@/lib/blog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getPublishedPostsByCategorySlug(slug);

  if (!category) {
    return {};
  }

  return {
    title: `${category.name} | Anviora Blog`,
    description: category.description || `Posts in ${category.name}.`,
    alternates: { canonical: `/blog/category/${category.slug}` },
  };
}

export default async function CategoryArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { category, posts } = await getPublishedPostsByCategorySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <header className="mb-16 space-y-3">
        <p className="eyebrow">Category</p>
        <h1 className="font-serif text-5xl text-ink display-lg">{category.name}</h1>
        {category.description && (
          <p className="text-ink-mute text-base max-w-lg">{category.description}</p>
        )}
      </header>

      {posts.length === 0 ? (
        <p className="text-ink-mute py-16 text-center">No posts in this category yet.</p>
      ) : (
        <div className="divide-y divide-hairline">
          {posts.map((post) => (
            <article key={post.id} className="py-8 first:pt-0">
              <Link href={`/blog/${post.slug}`} className="group block space-y-2">
                <h2 className="font-serif text-2xl text-ink leading-snug group-hover:text-accent transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-ink-mute text-sm line-clamp-2">{post.excerpt}</p>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
