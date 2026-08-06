import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getAllCategories, getPublishedPosts } from "@/lib/blog";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/sections/footer";

export const metadata: Metadata = {
  title: "The Anviora Blog | Battery Passport & Compliance Insights",
  description:
    "Latest news, updates, and expert insights on battery regulation, compliance, and sustainability.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndexPage() {
  const [posts, categories] = await Promise.all([getPublishedPosts(), getAllCategories()]);

  return (
    <main className="relative min-h-screen bg-bg text-text overflow-x-clip">
      <SiteHeader />

      {/* CRT Emerald Hero Banner */}
      <section className="relative min-h-[360px] flex flex-col justify-between overflow-hidden bg-[#0e9f6e] text-black pt-24 sm:pt-28 pb-12 select-none">
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.08) 2px, rgba(0, 0, 0, 0.08) 4px)",
          }}
        />
        <div className="relative z-10 max-w-[1320px] w-full mx-auto px-6 sm:px-10 py-4">
          <div className="max-w-[800px]">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-transparent border border-black text-black clip-chamfer mb-4">
              <span className="px-1.5 py-0.5 bg-black text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-widest">
                INSIGHTS
              </span>
              <span className="font-mono text-[12px] font-medium tracking-wide">
                Regulatory Analysis & Product Updates
              </span>
            </div>

            <h1 className="font-heading font-semibold text-[clamp(32px,4.6vw,56px)] leading-[0.96] tracking-[-0.04em] text-black mb-4">
              Anviora Insights
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-black/85 font-medium max-w-[600px]">
              Expert analysis on EU Battery Regulation, India PLI, and global export compliance.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {categories.length > 0 && (
          <div className="mb-12 flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-black text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider clip-chamfer">
              All Posts
            </span>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog/category/${category.slug}`}
                className="px-3 py-1 border border-black/20 text-black font-mono text-xs font-medium uppercase tracking-wider hover:bg-black hover:text-emerald-400 transition-colors clip-chamfer"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        {posts.length === 0 ? (
          <p className="text-black/60 py-16 text-center font-mono text-sm">No posts published yet. Check back soon.</p>
        ) : (
          <div className="divide-y divide-black/10">
            {posts.map((post) => (
              <article key={post.id} className="py-8 first:pt-0">
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="flex gap-6 items-start">
                    {post.cover_image && (
                      <div className="relative hidden sm:block h-24 w-32 shrink-0 overflow-hidden border border-black/15 bg-slate-100">
                        <Image
                          src={post.cover_image}
                          alt={post.title}
                          fill
                          sizes="128px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0 space-y-2">
                      {post.categories.length > 0 && (
                        <p className="font-mono text-xs text-emerald-700 font-bold uppercase tracking-widest">
                          {post.categories.map((c) => c.name).join(" · ")}
                        </p>
                      )}
                      <h2 className="font-heading text-2xl font-semibold text-black leading-snug group-hover:text-emerald-700 transition-colors">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-black/70 text-sm line-clamp-2">{post.excerpt}</p>
                      )}
                      <p className="font-mono text-xs text-black/50">
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

      <Footer />
    </main>
  );
}
