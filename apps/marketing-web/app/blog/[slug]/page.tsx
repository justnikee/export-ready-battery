import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { getPublishedPostBySlug } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: post.noindex ? { index: false, follow: false } : undefined,
    openGraph: post.cover_image
      ? { images: [{ url: post.cover_image }] }
      : undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image ?? undefined,
    author: { "@type": "Person", name: post.author },
    publisher: { "@type": "Organization", name: SITE_NAME },
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <article className="max-w-2xl mx-auto px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <header className="mb-10 space-y-4">
        {post.categories.length > 0 && (
          <p className="flex flex-wrap gap-3">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog/category/${category.slug}`}
                className="eyebrow text-xs hover:underline"
              >
                {category.name}
              </Link>
            ))}
          </p>
        )}
        <h1 className="font-serif text-4xl sm:text-5xl text-ink display-lg">
          {post.title}
        </h1>
        <p className="text-ink-mute-2 text-sm">
          {post.author}
          {post.published_at &&
            ` · ${new Date(post.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`}
          {post.reading_time_minutes && ` · ${post.reading_time_minutes} min read`}
        </p>
      </header>

      {post.cover_image && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-paper-soft mb-10">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="prose prose-editorial max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {post.tags.length > 0 && (
        <footer className="mt-12 pt-6 border-t border-hairline flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/blog/tag/${tag.slug}`}
              className="rounded-full border border-hairline px-3 py-1 text-xs text-ink-mute hover:border-accent hover:text-accent transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </footer>
      )}
    </article>
  );
}
