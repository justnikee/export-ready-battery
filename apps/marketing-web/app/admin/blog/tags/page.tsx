import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllTags } from "@/lib/blog";
import { createTag, deleteTag } from "./actions";

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl tracking-tight">Tags</h1>
        <p className="text-muted-foreground">Manage blog tags.</p>
      </div>

      <form action={createTag} className="flex items-end gap-3">
        <div className="space-y-2 flex-1">
          <Label htmlFor="name">New tag</Label>
          <Input id="name" name="name" placeholder="battery-passport" required />
        </div>
        <Button type="submit">Add</Button>
      </form>

      <div className="border rounded-md divide-y">
        {tags.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">No tags yet.</p>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{tag.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{tag.slug}</p>
              </div>
              <form action={deleteTag.bind(null, tag.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Delete
                </Button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
