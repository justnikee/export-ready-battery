"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, Layers3 } from "lucide-react";
import { dashboardPathFromPathname } from "@/lib/routes";

export function TextileTeamPage() {
  const pathname = usePathname();
  const settingsHref = dashboardPathFromPathname(pathname, "settings");
  const batchesHref = dashboardPathFromPathname(pathname, "batches");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">
            Textile Team Workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite mills, brands, operators, and supply-chain partners to your
            textile traceability workspace. Team roles are shared across your
            organization.
          </p>
        </div>

        <div className="border border-border bg-card p-8 text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-medium text-foreground">
            Team management is ready
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            The team system supports OWNER, ADMIN, MEMBER, and VIEWER roles across
            all product types. Use it to invite collaborators for production lots,
            supply-chain tracking, and compliance readiness.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={settingsHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              Workspace Settings
            </Link>
            <Link
              href={batchesHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Layers3 className="h-4 w-4" />
              Production Lots
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
