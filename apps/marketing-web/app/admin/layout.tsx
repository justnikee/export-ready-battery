import Link from "next/link";
import { FileText, LayoutDashboard, LogOut, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/login/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

        <form action={signOut} className="p-4 border-t border-border">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>
        </form>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
