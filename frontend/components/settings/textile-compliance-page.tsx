"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Layers3,
  Settings,
  Shirt,
  Users,
} from "lucide-react";
import { dashboardPathFromPathname } from "@/lib/routes";

const READINESS_PILLARS = [
  {
    title: "Material & Blend Data",
    description:
      "Capture fiber composition, trims, and product-level material declarations.",
    status: "Ready in workspace",
  },
  {
    title: "Supply Chain Mapping",
    description:
      "Organize mills, processors, garment makers, and downstream partners in one traceability flow.",
    status: "Ready in workspace",
  },
  {
    title: "Compliance Modules",
    description:
      "ESPR, DPP, chemical disclosure, and document workflows will land in textile-specific modules instead of the battery vault.",
    status: "Next build phase",
  },
] as const;

export function TextileCompliancePage() {
  const pathname = usePathname();
  const settingsHref = dashboardPathFromPathname(pathname, "settings");
  const teamHref = dashboardPathFromPathname(pathname, "team");
  const batchesHref = dashboardPathFromPathname(pathname, "batches");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight">
            Textile Compliance Workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This product is separated from the battery EPR/BIS/PLI stack. Use
            this workspace for textile traceability readiness while textile
            compliance modules are built out.
          </p>
        </div>

        <div className="border border-blue-200 bg-blue-500/10 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Battery compliance vault remains battery-only
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Textile workspaces should not inherit India battery compliance
                workflows. This page is the separation point for
                textile-specific readiness, documents, and regulatory workflows.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {READINESS_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <Shirt className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  {pillar.status}
                </span>
              </div>
              <h3 className="text-sm font-medium text-foreground">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <div className="border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-medium text-foreground">
                What to use today
              </h2>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                Use production lots to organize textile SKUs, production runs,
                and serialized records.
              </li>
              <li>
                Set profile and sharing defaults in workspace settings before
                exposing traceability data to external partners.
              </li>
              <li>
                Use team management for mills, brands, and internal operators
                while textile compliance workflows are phased in.
              </li>
            </ul>
          </div>

          <aside className="border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <h2 className="text-base font-medium text-foreground">
                Next actions
              </h2>
            </div>
            <div className="space-y-3 text-sm">
              <Link
                href={settingsHref}
                className="flex items-center gap-2 text-blue-500 hover:underline"
              >
                <Settings className="h-4 w-4" /> Review textile settings
              </Link>
              <Link
                href={teamHref}
                className="flex items-center gap-2 text-blue-500 hover:underline"
              >
                <Users className="h-4 w-4" /> Configure team access
              </Link>
              <Link
                href={batchesHref}
                className="flex items-center gap-2 text-blue-500 hover:underline"
              >
                <Layers3 className="h-4 w-4" /> Open production lots
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
