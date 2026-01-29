import BlogEditor from '@/components/blog/blog-editor';
import { getPostBySlug } from '@/app/actions/blog';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: post, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !post) {
        notFound();
    }

    return <BlogEditor post={post} />;
}
