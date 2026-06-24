import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPost } from "@/app/admin/blog/actions";

export default function NewPostPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl tracking-tight">New Post</h1>
        <p className="text-muted-foreground">Draft a new blog post.</p>
      </div>

      <form action={createPost} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (optional — derived from title if left blank)</Label>
          <Input id="slug" name="slug" placeholder="my-post-title" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" name="excerpt" rows={2} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea id="content" name="content" rows={14} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" name="category" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" placeholder="compliance, eu, batteries" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover_image">Cover Image URL</Label>
          <Input id="cover_image" name="cover_image" type="url" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="seo_title">SEO Title</Label>
            <Input id="seo_title" name="seo_title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo_description">SEO Description</Label>
            <Input id="seo_description" name="seo_description" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" name="status" value="draft">
            Save as Draft
          </Button>
          <Button type="submit" name="status" value="published" variant="accent">
            Publish
          </Button>
        </div>
      </form>
    </div>
  );
}
