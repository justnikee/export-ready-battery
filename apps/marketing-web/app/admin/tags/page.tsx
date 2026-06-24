import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllTags } from "@/lib/blog";
import { createTag, deleteTag } from "./actions";

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-medium text-[#1d2327]">Tags</h1>

      <form action={createTag} className="rounded-sm border border-[#c3c4c7] bg-white p-4 flex items-end gap-3">
        <div className="space-y-2 flex-1">
          <Label htmlFor="name">Add new tag</Label>
          <Input id="name" name="name" placeholder="battery-passport" required />
        </div>
        <Button type="submit" size="sm">Add</Button>
      </form>

      <div className="rounded-sm border border-[#c3c4c7] bg-white divide-y divide-[#c3c4c7]">
        {tags.length === 0 ? (
          <p className="p-6 text-center text-[#646970]">No tags yet.</p>
        ) : (
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-[#1d2327]">{tag.name}</p>
                <p className="text-xs text-[#646970] font-mono">{tag.slug}</p>
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
