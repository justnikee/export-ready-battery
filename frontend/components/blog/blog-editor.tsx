'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BlogPost, BlogFormData } from '@/lib/types';
import { createPost, updatePost, deletePost } from '@/app/actions/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, Save, Trash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface BlogEditorProps {
    post?: BlogPost;
    isNew?: boolean;
}

export default function BlogEditor({ post, isNew = false }: BlogEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<BlogFormData>({
        title: post?.title || '',
        slug: post?.slug || '',
        excerpt: post?.excerpt || '',
        content: post?.content || '',
        status: post?.status || 'draft',
        tags: post?.tags || [],
        category: post?.category || '',
        seo_title: post?.seo_title || '',
        seo_description: post?.seo_description || '',
        cover_image: post?.cover_image || '',
    });

    const [currentTag, setCurrentTag] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && currentTag.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(currentTag.trim())) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, currentTag.trim()] }));
            }
            setCurrentTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;
            if (isNew) {
                result = await createPost(formData);
            } else if (post) {
                result = await updatePost(post.id, formData);
            }

            if (result?.success) {
                toast.success(isNew ? 'Post created successfully' : 'Post updated successfully');
                router.push('/admin/blog');
                router.refresh();
            } else {
                toast.error(result?.error || 'Something went wrong');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!post || isNew) return;
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

        setLoading(true);
        try {
            const result = await deletePost(post.id);
            if (result.success) {
                toast.success('Post deleted');
                router.push('/admin/blog');
                router.refresh();
            } else {
                toast.error(result.error);
                setLoading(false);
            }
        } catch (error) {
            toast.error('Failed to delete post');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blog">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isNew ? 'Create New Post' : 'Edit Post'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isNew ? 'Draft a new blog post.' : `Editing: ${post?.title}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isNew && (
                        <Button type="button" variant="destructive" size="icon" onClick={handleDelete} disabled={loading}>
                            <Trash className="h-4 w-4" />
                        </Button>
                    )}
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        Save Post
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Post Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Enter post title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    placeholder="url-friendly-slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-muted-foreground">Leave empty to auto-generate from title.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    name="excerpt"
                                    placeholder="Short summary for SEO and previews"
                                    value={formData.excerpt}
                                    onChange={handleChange}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Content (Markdown)</Label>
                                <div className="border rounded-md">
                                    <Textarea
                                        id="content"
                                        name="content"
                                        placeholder="# Write your masterpiece..."
                                        value={formData.content}
                                        onChange={handleChange}
                                        className="min-h-[500px] border-0 focus-visible:ring-0 resize-y font-mono"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Supports Markdown. create tables, lists, and code blocks.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <h3 className="font-medium">SEO Settings</h3>
                            <div className="space-y-2">
                                <Label htmlFor="seo_title">SEO Title</Label>
                                <Input
                                    id="seo_title"
                                    name="seo_title"
                                    placeholder="Title for search engines (optional)"
                                    value={formData.seo_title}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="seo_description">SEO Description</Label>
                                <Textarea
                                    id="seo_description"
                                    name="seo_description"
                                    placeholder="Meta description (optional)"
                                    value={formData.seo_description}
                                    onChange={handleChange}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => handleSelectChange('status', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val) => handleSelectChange('category', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Compliance">Compliance</SelectItem>
                                        <SelectItem value="Product">Product Updates</SelectItem>
                                        <SelectItem value="Industry">Industry News</SelectItem>
                                        <SelectItem value="Engineering">Engineering</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                                            {tag}
                                            <X
                                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                onClick={() => removeTag(tag)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Type tag and press Enter"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cover_image">Cover Image URL</Label>
                                <Input
                                    id="cover_image"
                                    name="cover_image"
                                    placeholder="https://..."
                                    value={formData.cover_image}
                                    onChange={handleChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
}
