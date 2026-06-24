import { PostForm } from "@/components/admin/post-form";
import { getAllCategories, getAllTags } from "@/lib/blog";
import { createPost } from "@/app/admin/actions";

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([getAllCategories(), getAllTags()]);

  return <PostForm action={createPost} categories={categories} tags={tags} />;
}
