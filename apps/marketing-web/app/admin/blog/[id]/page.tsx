import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { MultiSelectChips } from "@/components/admin/multi-select-chips";
import { getAllCategories, getAllTags, getPostById } from "@/lib/blog";
import { deletePost, updatePost } from "@/app/admin/blog/actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, tags] = await Promise.all([
    getPostById(id),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!post) {
    notFound();
  }

  const updatePostWithId = updatePost.bind(null, id);
  const deletePostWithId = deletePost.bind(null, id);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl tracking-tight">Edit Post</h1>
        <p className="text-muted-foreground">{post.title}</p>
      </div>

      <form action={updatePostWithId} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={post.title} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" name="slug" defaultValue={post.slug} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post.excerpt ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea
            id="content"
            name="content"
            rows={14}
            defaultValue={post.content}
            required
          />
        </div>

        <CoverImageField defaultValue={post.cover_image ?? ""} />

        <div className="space-y-2">
          <Label>Categories</Label>
          <MultiSelectChips
            name="category_ids"
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            defaultSelected={post.categories.map((c) => c.id)}
            emptyMessage="No categories yet — add some in Admin → Categories."
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <MultiSelectChips
            name="tag_ids"
            options={tags.map((t) => ({ id: t.id, label: t.name }))}
            defaultSelected={post.tags.map((t) => t.id)}
            emptyMessage="No tags yet — add some in Admin → Tags."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input id="seo_title" name="seo_title" defaultValue={post.seo_title ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo_description">SEO Description</Label>
            <Input
              id="seo_description"
              name="seo_description"
              defaultValue={post.seo_description ?? ""}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="noindex"
            name="noindex"
            type="checkbox"
            className="h-4 w-4"
            defaultChecked={post.noindex}
          />
          <Label htmlFor="noindex">Hide from search engines (noindex)</Label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" name="status" value="draft">
            Save as Draft
          </Button>
          <Button type="submit" name="status" value="published" variant="accent">
            {post.status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </form>

      <form action={deletePostWithId} className="border-t border-border pt-4">
        <Button type="submit" variant="destructive">
          Delete Post
        </Button>
      </form>
    </div>
  );
}
