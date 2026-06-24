import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllCategories } from "@/lib/blog";
import { createCategory, deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-medium text-[#1d2327]">Categories</h1>

      <form action={createCategory} className="rounded-sm border border-[#c3c4c7] bg-white p-4 flex items-end gap-3">
        <div className="space-y-2 flex-1">
          <Label htmlFor="name">Add new category</Label>
          <Input id="name" name="name" placeholder="EU Compliance" required />
        </div>
        <Button type="submit" size="sm">Add</Button>
      </form>

      <div className="rounded-sm border border-[#c3c4c7] bg-white divide-y divide-[#c3c4c7]">
        {categories.length === 0 ? (
          <p className="p-6 text-center text-[#646970]">No categories yet.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-[#1d2327]">{category.name}</p>
                <p className="text-xs text-[#646970] font-mono">{category.slug}</p>
              </div>
              <form action={deleteCategory.bind(null, category.id)}>
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
