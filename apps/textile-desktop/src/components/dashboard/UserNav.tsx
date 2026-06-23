import { useState } from "react";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import type { User } from "@/context/auth-context";

interface UserNavProps {
  user: User;
  navigate: (path: string) => void;
}

export function UserNav({ user, navigate }: UserNavProps) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user.company_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "ER";

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 p-1.5 transition-colors hover:bg-accent"
      >
        <div className="flex h-8 w-8 items-center justify-center bg-[var(--brand)] rounded-sm text-xs font-bold text-white">
          {initials}
        </div>
        <span className="hidden md:block text-sm font-medium text-foreground">
          {user.company_name}
        </span>
        <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 border border-border bg-card shadow-lg">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">
                {user.company_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/dashboard/settings");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/dashboard/settings");
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
