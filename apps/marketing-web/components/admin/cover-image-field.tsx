"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadCoverImage } from "@/app/admin/blog/upload-action";

export function CoverImageField({ defaultValue }: { defaultValue?: string }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      try {
        const uploadedUrl = await uploadCoverImage(formData);
        setUrl(uploadedUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="cover_image_file">Cover Image</Label>
      <input type="hidden" name="cover_image" value={url} />
      {url && (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-md border border-border bg-muted">
          <Image src={url} alt="Cover preview" fill className="object-cover" unoptimized />
        </div>
      )}
      <input
        id="cover_image_file"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        disabled={isPending}
        className="block text-sm text-muted-foreground"
      />
      {isPending && <p className="text-xs text-muted-foreground">Uploading…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {url && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
          Remove image
        </Button>
      )}
    </div>
  );
}
