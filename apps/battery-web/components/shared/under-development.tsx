"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Construction, ArrowRight } from "lucide-react";
import { dashboardPathFromPathname } from "@/lib/routes";

interface UnderDevelopmentProps {
  pageTitle: string;
  description: string;
}

export function UnderDevelopment({
  pageTitle,
  description,
}: UnderDevelopmentProps) {
  const pathname = usePathname();
  const dashboardHref = dashboardPathFromPathname(pathname);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="border border-border bg-card p-12 text-center">
          <Construction className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="text-lg font-medium text-foreground">
            Textile Integration In Progress
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            This section is being adapted for textile-specific workflows. Visit
            the production lots or workspace settings while this area is under
            development.
          </p>
          <div className="mt-6">
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
