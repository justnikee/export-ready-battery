import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllPostsForAdmin } from "@/lib/blog";

const statusStyles: Record<string, string> = {
  published: "text-[#00450c] bg-[#edfaef]",
  draft: "text-[#646970] bg-[#f0f0f1]",
  archived: "text-[#8a6d3b] bg-[#fcf8e3]",
};

export default async function AdminPostsPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-[#1d2327]">Posts</h1>
        <Link href="/admin/new">
          <Button size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            Add New
          </Button>
        </Link>
      </div>

      <div className="rounded-sm border border-[#c3c4c7] bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#c3c4c7] text-left text-xs font-semibold text-[#646970]">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Author</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[#646970]">
                  No posts yet. Create your first one.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="group border-b border-[#c3c4c7] last:border-0 hover:bg-[#f6f7f7]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/${post.id}`} className="font-medium text-[#2271b1] hover:underline">
                      {post.title}
                    </Link>
                    <div className="mt-0.5 flex gap-3 text-xs text-[#646970] opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/${post.id}`} className="hover:text-[#2271b1]">
                        Edit
                      </Link>
                      {post.status === "published" && (
                        <Link href={`/blog/${post.slug}`} target="_blank" className="hover:text-[#2271b1]">
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#1d2327]">{post.author}</td>
                  <td className="px-4 py-3 text-[#646970]">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : new Date(post.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
