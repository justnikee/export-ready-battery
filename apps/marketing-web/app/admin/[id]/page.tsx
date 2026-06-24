import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getAllCategories, getAllTags, getPostById } from "@/lib/blog";
import { deletePost, updatePost } from "@/app/admin/actions";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, tags] = await Promise.all([
    getPostById(id),
    getAllCategories(),
    getAllTags(),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <PostForm
      action={updatePost.bind(null, id)}
      deleteAction={deletePost.bind(null, id)}
      post={post}
      categories={categories}
      tags={tags}
    />
  );
}
