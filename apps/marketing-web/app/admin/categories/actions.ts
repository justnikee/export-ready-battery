"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/blog";

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Name is required");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name, slug: slugify(name) });

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`);
  }
  revalidatePath("/admin/categories");
}
