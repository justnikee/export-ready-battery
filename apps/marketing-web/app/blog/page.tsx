import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getAllCategories, getPublishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "The Anviora Blog | Battery Passport & Compliance Insights",
  description:
    "Latest news, updates, and expert insights on battery regulation, compliance, and sustainability.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const [posts, categories] = await Promise.all([getPublishedPosts(), getAllCategories()]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-20">
      <header className="mb-10 space-y-3">
        <p className="eyebrow">Insights</p>
        <h1 className="font-serif text-5xl text-ink display-lg">Anviora Insights</h1>
        <p className="text-ink-mute text-base max-w-lg">
          Expert analysis on EU Battery Regulation, India PLI, and global
          export compliance.
        </p>
      </header>

      {categories.length > 0 && (
        <div className="mb-16 flex flex-wrap gap-2">
          <span className="rounded-full border border-ink bg-ink px-3 py-1 text-xs text-paper">
            All Posts
          </span>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/blog/category/${category.slug}`}
              className="rounded-full border border-hairline px-3 py-1 text-xs text-ink-mute hover:border-accent hover:text-accent transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <p className="text-ink-mute py-16 text-center">No posts published yet. Check back soon.</p>
      ) : (
        <div className="divide-y divide-hairline">
          {posts.map((post) => (
            <article key={post.id} className="py-8 first:pt-0">
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="flex gap-6 items-start">
                  {post.cover_image && (
                    <div className="relative hidden sm:block h-20 w-28 shrink-0 overflow-hidden rounded-md bg-paper-soft">
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        sizes="112px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                  <div className="min-w-0 space-y-2">
                    {post.categories.length > 0 && (
                      <p className="eyebrow text-xs">
                        {post.categories.map((c) => c.name).join(" · ")}
                      </p>
                    )}
                    <h2 className="font-serif text-2xl text-ink leading-snug group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-ink-mute text-sm line-clamp-2">{post.excerpt}</p>
                    )}
                    <p className="text-ink-mute-2 text-xs">
                      {post.published_at &&
                        new Date(post.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      {post.reading_time_minutes && ` · ${post.reading_time_minutes} min read`}
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
