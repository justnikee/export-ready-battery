import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getPublishedPostBySlug, sanitizePostHtml } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { CopyLinkButton } from "@/components/blog/copy-link-button";
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

  const primaryCategory = post.categories[0];
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="max-w-4xl mx-auto px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <nav className="text-sm text-ink-mute-2 mb-6">
        <Link href="/blog" className="hover:text-accent transition-colors">
          Blog
        </Link>
        {primaryCategory && (
          <>
            {" / "}
            <Link
              href={`/blog/category/${primaryCategory.slug}`}
              className="hover:text-accent transition-colors"
            >
              {primaryCategory.name}
            </Link>
          </>
        )}
      </nav>

      <div className="lg:grid lg:grid-cols-[1fr_180px] lg:gap-12">
        <div className="space-y-10">
          <header className="space-y-4">
            <h1 className="font-serif text-4xl sm:text-5xl text-ink display-lg">
              {post.title}
            </h1>
            <p className="text-ink-mute-2 text-sm">{post.author}</p>
          </header>

          {post.cover_image && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-paper-soft">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                sizes="(min-width: 1024px) 768px, 100vw"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div
            className="prose prose-editorial max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }}
          />

          {post.tags.length > 0 && (
            <footer className="pt-6 border-t border-hairline flex flex-wrap gap-2">
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
        </div>

        <aside className="mt-8 lg:mt-0">
          <div className="flex lg:flex-col gap-4 lg:gap-2 text-sm text-ink-mute border-t lg:border-t-0 lg:border-l border-hairline pt-4 lg:pt-0 lg:pl-6">
            {publishedDate && <span>{publishedDate}</span>}
            {post.reading_time_minutes && <span>{post.reading_time_minutes} min read</span>}
            <CopyLinkButton />
          </div>
        </aside>
      </div>
    </article>
  );
}
