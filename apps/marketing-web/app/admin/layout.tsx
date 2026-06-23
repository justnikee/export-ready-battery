"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, LayoutDashboard, LogOut, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/admin/blog");
      return;
    }
    // Optional: verify token with backend
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] text-foreground">
      <aside className="w-64 border-r border-border bg-[#0a0a0a] flex flex-col">
        <div className="p-6">
          <Link href="/admin/blog" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <PenTool className="h-4 w-4 text-white" />
            </div>
            <span className="text-white text-lg">Admin Console</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link
            href="/admin/blog"
            className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-white hover:bg-primary/90 rounded-md transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>Blog Posts</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-white hover:bg-primary/90 rounded-md transition-colors"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>Back to Site</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10"
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
