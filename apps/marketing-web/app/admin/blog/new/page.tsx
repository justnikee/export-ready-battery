import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { MultiSelectChips } from "@/components/admin/multi-select-chips";
import { getAllCategories, getAllTags } from "@/lib/blog";
import { createPost } from "@/app/admin/blog/actions";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()]);

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

        <CoverImageField />

        <div className="space-y-2">
          <Label>Categories</Label>
          <MultiSelectChips
            name="category_ids"
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            emptyMessage="No categories yet — add some in Admin → Categories."
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <MultiSelectChips
            name="tag_ids"
            options={tags.map((t) => ({ id: t.id, label: t.name }))}
            emptyMessage="No tags yet — add some in Admin → Tags."
          />
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

        <div className="flex items-center gap-2">
          <input id="noindex" name="noindex" type="checkbox" className="h-4 w-4" />
          <Label htmlFor="noindex">Hide from search engines (noindex)</Label>
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
