import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverImageField } from "@/components/admin/cover-image-field";
import { MultiSelectChips } from "@/components/admin/multi-select-chips";
import { MetaBox } from "@/components/admin/meta-box";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { BlogPost, Category, Tag } from "@/lib/types";

export function PostForm({
  action,
  deleteAction,
  post,
  categories,
  tags,
}: {
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  post?: BlogPost;
  categories: Category[];
  tags: Tag[];
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-[#1d2327]">
        {post ? "Edit Post" : "Add New Post"}
      </h1>

      <form action={action} className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-4">
          <Input
            name="title"
            placeholder="Add title"
            defaultValue={post?.title}
            required
            className="text-3xl font-serif border-0 border-b border-[#c3c4c7] rounded-none px-0 h-auto py-2 shadow-none focus-visible:ring-0"
          />
          <Input
            name="slug"
            placeholder="slug (auto-generated from title if left blank)"
            defaultValue={post?.slug}
            className="text-sm text-ink-mute"
          />
          <RichTextEditor name="content" defaultValue={post?.content} />
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} />
          </div>
        </div>

        <div className="space-y-4">
          <MetaBox title="Publish">
            <div className="flex gap-2">
              <Button type="submit" name="status" value="draft" variant="outline" className="flex-1">
                Save Draft
              </Button>
              <Button type="submit" name="status" value="published" variant="accent" className="flex-1">
                {post?.status === "published" ? "Update" : "Publish"}
              </Button>
            </div>
          </MetaBox>

          <MetaBox title="Featured Image">
            <CoverImageField defaultValue={post?.cover_image ?? ""} />
          </MetaBox>

          <MetaBox title="Categories">
            <MultiSelectChips
              name="category_ids"
              options={categories.map((c) => ({ id: c.id, label: c.name }))}
              defaultSelected={post?.categories.map((c) => c.id)}
              emptyMessage="No categories yet — add some in Categories."
            />
          </MetaBox>

          <MetaBox title="Tags">
            <MultiSelectChips
              name="tag_ids"
              options={tags.map((t) => ({ id: t.id, label: t.name }))}
              defaultSelected={post?.tags.map((t) => t.id)}
              emptyMessage="No tags yet — add some in Tags."
            />
          </MetaBox>

          <MetaBox title="SEO">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input id="seo_title" name="seo_title" defaultValue={post?.seo_title ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Input
                id="seo_description"
                name="seo_description"
                defaultValue={post?.seo_description ?? ""}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="noindex"
                name="noindex"
                type="checkbox"
                className="h-4 w-4"
                defaultChecked={post?.noindex}
              />
              <Label htmlFor="noindex" className="text-sm">
                Hide from search engines
              </Label>
            </div>
          </MetaBox>
        </div>
      </form>

      {post && deleteAction && (
        <form action={deleteAction} className="pt-2">
          <Button type="submit" variant="destructive" size="sm">
            Delete Post
          </Button>
        </form>
      )}
    </div>
  );
}
