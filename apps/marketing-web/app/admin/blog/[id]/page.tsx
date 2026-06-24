import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPostById } from "@/lib/blog";
import { deletePost, updatePost } from "@/app/admin/blog/actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" defaultValue={post.category ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" defaultValue={(post.tags ?? []).join(", ")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover_image">Cover Image URL</Label>
          <Input
            id="cover_image"
            name="cover_image"
            type="url"
            defaultValue={post.cover_image ?? ""}
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

        <div className="flex gap-3 pt-2">
          <Button type="submit" name="status" value="draft">
            Save as Draft
          </Button>
          <Button type="submit" name="status" value="published" variant="accent">
            {post.status === "published" ? "Update" : "Publish"}
          </Button>
        </div>
      </form>

      <form
        action={deletePostWithId}
        className="border-t border-border pt-4"
      >
        <Button type="submit" variant="destructive">
          Delete Post
        </Button>
      </form>
    </div>
  );
}
