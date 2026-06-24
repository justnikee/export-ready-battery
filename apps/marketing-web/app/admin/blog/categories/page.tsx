import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllCategories } from "@/lib/blog";
import { createCategory, deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl tracking-tight">Categories</h1>
        <p className="text-muted-foreground">Manage blog categories.</p>
      </div>

      <form action={createCategory} className="flex items-end gap-3">
        <div className="space-y-2 flex-1">
          <Label htmlFor="name">New category</Label>
          <Input id="name" name="name" placeholder="EU Compliance" required />
        </div>
        <Button type="submit">Add</Button>
      </form>

      <div className="border rounded-md divide-y">
        {categories.length === 0 ? (
          <p className="p-4 text-center text-muted-foreground">No categories yet.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{category.slug}</p>
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
