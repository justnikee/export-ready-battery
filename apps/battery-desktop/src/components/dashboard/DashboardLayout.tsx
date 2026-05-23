import { Outlet } from "react-router-dom";
import { DashboardSidebar, useSidebarState } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";
import { useAuth } from "@/context/auth-context";
import { Navigate } from "react-router-dom";
import clsx from "clsx";

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const { isOpen, setIsOpen } = useSidebarState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
      <div className={clsx("transition-all duration-300 md:ml-60")}>
        <DashboardTopBar onMenuClick={() => setIsOpen(true)} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
