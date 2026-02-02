import { getPostBySlug, getPosts } from '@/app/actions/blog';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

// Force dynamic rendering for blog posts (or use revalidate)
export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
        };
    }

    return {
        title: post.seo_title || post.title,
        description: post.seo_description || post.excerpt,
        openGraph: {
            title: post.seo_title || post.title,
            description: post.seo_description || post.excerpt,
            type: 'article',
            publishedTime: post.published_at,
            authors: [post.author],
            tags: post.tags,
            images: post.cover_image ? [{ url: post.cover_image }] : undefined,
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post || post.status !== 'published') {
        notFound();
    }

    // JSON-LD Structured Data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        image: post.cover_image ? [post.cover_image] : [],
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: [{
            '@type': 'Person',
            name: post.author,
        }],
    };

    return (
        <div className="container max-w-4xl mx-auto py-12 px-4 sm:px-6">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Link href="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
            </Link>

            <article className="space-y-8">
                {/* Header */}
                <div className="space-y-4 text-center">
                    <div className="flex justify-center gap-2">
                        {post.category && <Badge>{post.category}</Badge>}
                        {post.tags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : 'Draft'}</span>
                        </div>
                        {post.reading_time_minutes && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{post.reading_time_minutes} min read</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Cover Image */}
                {post.cover_image && (
                    <div className="aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
                        <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none mx-auto">
                    {/* Note: This requires 'react-markdown' package */}
                    {/* If strictly no extra deps allowed, replace with simple text rendering */}
                    <ReactMarkdown>
                        {post.content}
                    </ReactMarkdown>
                </div>
            </article>

            {/* Footer / CTA usually goes here */}
            <div className="mt-16 pt-8 border-t">
                {/* Related or Newsletter */}
            </div>
        </div>
    );
}
