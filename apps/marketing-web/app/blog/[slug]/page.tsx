import { notFound } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
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
    <article className="container py-12 max-w-3xl mx-auto space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <header className="space-y-4">
        {post.category && <Badge variant="secondary">{post.category}</Badge>}
        <h1 className="text-4xl font-extrabold tracking-tight">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{post.author}</span>
          {post.published_at && (
            <>
              <span>&middot;</span>
              <span>
                {new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </>
          )}
          {post.reading_time_minutes && (
            <>
              <span>&middot;</span>
              <span>{post.reading_time_minutes} min read</span>
            </>
          )}
        </div>
      </header>

      {post.cover_image && (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted relative">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            sizes="(min-width: 768px) 768px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="prose prose-neutral max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}
