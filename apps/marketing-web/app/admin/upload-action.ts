"use server";

import { createClient } from "@/lib/supabase/server";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function uploadCoverImage(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image type — use PNG, JPEG, WebP, or GIF");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Image must be under 5MB");
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("blog-images").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return data.publicUrl;
}
