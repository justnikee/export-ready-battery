"use client";

import { useAuth } from "@/context/auth-context";
import {
  DashboardSidebar,
  useSidebarState,
} from "@/components/dashboard/DashboardSidebar";
import { DashboardTopBar } from "@/components/dashboard/DashboardTopBar";
import { ProfileCompletenessBanner } from "@/components/dashboard/profile-completeness-banner";
import { LoadingBar } from "@/components/ui/loading-bar";
import { SidebarSkeleton } from "@/components/dashboard/SidebarSkeleton";
import { TopBarSkeleton } from "@/components/dashboard/TopBarSkeleton";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { clsx } from "clsx";
import { productRoutes, stripProductPrefix } from "@/lib/routes";
import { LocaleProvider } from "@/lib/i18n/locale-context";

// Fallback for dashboard sub-routes (batches, billing, ...) during the brief
// auth-resolution window — most of those pages already show their own
// data-fetch skeleton (BatchesListSkeleton etc.) the instant they mount, so
// this only needs to avoid a stark blank flash, not 1:1-match every route.
function GenericMainSkeleton() {
  return (
    <div className="p-6">
      <Skeleton className="h-7 w-48 bg-muted" />
      <Skeleton className="h-64 w-full mt-6 bg-muted" />
    </div>
  );
}

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
  // Redirect users who haven't completed onboarding
  useEffect(() => {
    if (!loading && user && !user.onboarding_completed) {
      router.push(productRoutes(user.product_type).onboarding);
    }
  }, [loading, router, user]);

  // Redirect unauthenticated users to login with return path
  useEffect(() => {
    if (!loading && !user) {
      const redirectTo = search ? `${pathname}?${search}` : pathname;
      router.replace(
        `/login?redirect=${encodeURIComponent(redirectTo)}`,
      );
    }
  }, [loading, user, router, pathname, search]);

  if (loading) {
    // Same shell classes as the loaded state below (sidebar width driven by
    // the same sidebar.isCollapsed, read synchronously from localStorage) so
    // there's no pop-in once auth resolves — only the skeleton content swaps.
    const isDashboardRoot = stripProductPrefix(pathname) === "/dashboard";
    return (
      <div className="min-h-screen bg-sidebar text-foreground">
        <SidebarSkeleton isCollapsed={sidebar.isCollapsed} />
        <div
          className={clsx(
            "min-h-screen flex flex-col",
            sidebar.isCollapsed ? "md:ml-16" : "md:ml-60",
          )}
        >
          <TopBarSkeleton />
          <main className="flex-1 w-full">
            {isDashboardRoot ? <DashboardSkeleton /> : <GenericMainSkeleton />}
          </main>
        </div>
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
    <LocaleProvider>
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

          {/* Profile Completeness Banner */}
          <ProfileCompletenessBanner />

          {/* Page Content */}
          <main className="flex-1 w-full">{children}</main>
        </div>
      </div>
    </LocaleProvider>
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
