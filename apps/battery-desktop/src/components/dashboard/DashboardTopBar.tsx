import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserNav } from "./UserNav";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";

interface DashboardTopBarProps {
  onMenuClick: () => void;
}

export function DashboardTopBar({ onMenuClick }: DashboardTopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border backdrop-blur-sm bg-background/80">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb / Page title */}
          <Link
            to="/dashboard"
            className="hidden md:flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          >
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
          </Button>
          {user && (
            <UserNav user={user} navigate={(path: string) => navigate(path)} />
          )}
        </div>
      </div>
    </header>
  );
}
