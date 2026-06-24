"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/blog";

export async function createTag(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Name is required");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tags")
    .insert({ name, slug: slugify(name) });

  if (error) {
    throw new Error(`Failed to create tag: ${error.message}`);
  }
  revalidatePath("/admin/tags");
}

export async function deleteTag(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete tag: ${error.message}`);
  }
  revalidatePath("/admin/tags");
}
