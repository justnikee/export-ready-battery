import Link from "next/link";
import { ExternalLink, FileText, Folder, LogOut, PenTool, Tag } from "lucide-react";
import { signOut } from "@/app/login/actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const navItems = [
  { href: "/admin", label: "Posts", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: Folder },
  { href: "/admin/tags", label: "Tags", icon: Tag },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327]">
      <div className="flex h-8 items-center justify-between bg-[#1d2327] px-4 text-xs text-[#a7aaad]">
        <span>Anviora Admin</span>
        <Link href="/" target="_blank" className="flex items-center gap-1 hover:text-white transition-colors">
          View Site <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex">
        <aside className="w-56 min-h-[calc(100vh-2rem)] bg-[#1d2327] flex flex-col">
          <Link href="/admin" className="flex items-center gap-2 px-4 py-5">
            <div className="h-7 w-7 rounded bg-(--color-accent) flex items-center justify-center">
              <PenTool className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-white text-sm font-medium">Blog Admin</span>
          </Link>

          <nav className="flex-1 px-2 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-[#a7aaad] hover:bg-white/5 hover:text-white rounded-sm transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <form action={signOut} className="p-2 border-t border-white/10">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[#a7aaad] hover:bg-white/5 hover:text-white rounded-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </form>
        </aside>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
