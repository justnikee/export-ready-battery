"use client";

import { useAuth } from "@/context/auth-context";
import {
  DashboardSidebar,
  useSidebarState,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { LoadingBar } from "@/components/ui/loading-bar";
import { useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { productRoutes, stripProductPrefix } from "@/lib/routes";
import { productTypeToSlug } from "@/lib/products";

function LoadingBarWrapper() {
  return (
    <Suspense fallback={null}>
      <LoadingBar />
    </Suspense>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const sidebar = useSidebarState();
  const actualProductSlug = null;
  const productPrefix = "";

  // Protected route guard: authenticated users must stay inside their own
  // product URL space even if a stale cookie points at the wrong prefix.
  useEffect(() => {
    if (!loading && user) {
      const expectedProductSlug = productTypeToSlug(user.product_type);

      if (actualProductSlug && actualProductSlug !== expectedProductSlug) {
        const correctedPath = `/${expectedProductSlug}${stripProductPrefix(pathname)}`;
        const redirectTo = search ? `${correctedPath}?${search}` : correctedPath;
        router.replace(redirectTo);
        return;
      }

      if (!user.onboarding_completed) {
        router.push("/onboarding");
      }
    }
  }, [actualProductSlug, loading, pathname, router, search, user]);

  // Redirect unauthenticated users to login with return path
  useEffect(() => {
    if (!loading && !user) {
      const redirectTo = search ? `${pathname}?${search}` : pathname;
      router.replace(
        `${productPrefix}/login?redirect=${encodeURIComponent(redirectTo)}`,
      );
    }
  }, [loading, user, router, pathname, search, productPrefix]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--brand) border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Redirecting to login...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidebar text-foreground">
      {/* Loading Bar */}
      <LoadingBarWrapper />

      {/* Sidebar */}
      <DashboardSidebar
        isOpen={sidebar.isOpen}
        onClose={() => sidebar.setIsOpen(false)}
        isCollapsed={sidebar.isCollapsed}
        onToggleCollapse={sidebar.toggleCollapse}
        productType={user.product_type}
      />

      {/* Main Content Area */}
      <div
        className={clsx(
          "min-h-screen flex flex-col transition-all duration-300",
          sidebar.isCollapsed ? "md:ml-16" : "md:ml-60",
        )}
      >
        {/* Top Bar */}
        <DashboardTopBar onMenuClick={sidebar.toggleOpen} />

        {/* Page Content */}
        <main className="flex-1 w-full">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--brand) border-t-transparent" />
        </div>
      }
    >
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
