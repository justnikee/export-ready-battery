"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Factory, Layers3, ShieldCheck, Users } from "lucide-react";
import { dashboardPathFromPathname } from "@/lib/routes";

const WORKFLOW_STEPS = [
  {
    title: "Lot creation",
    description:
      "Organize textile records into production lots instead of battery lifecycle batches.",
    icon: Layers3,
  },
  {
    title: "Partner mapping",
    description:
      "Map mills, processors, brands, and downstream operators without battery role vocabulary.",
    icon: Users,
  },
  {
    title: "Compliance readiness",
    description:
      "Prepare supply-chain and disclosure data before textile-specific compliance modules land.",
    icon: ShieldCheck,
  },
] as const;

export function TextileLifecyclePage() {
  const pathname = usePathname();
  const lotsHref = dashboardPathFromPathname(pathname, "batches");
  const templatesHref = dashboardPathFromPathname(pathname, "templates");
  const teamHref = dashboardPathFromPathname(pathname, "team");
  const settingsHref = dashboardPathFromPathname(pathname, "settings");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto w-full space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-600">
            Textile supply chain
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Supply-chain operations
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Textile operations should not inherit the battery lifecycle state
            machine. This page is the separated operational workspace for
            textile flow design while deeper event tracking and textile schema
            actions are implemented.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {WORKFLOW_STEPS.map((step) => (
            <div key={step.title} className="border border-border bg-card p-5">
              <step.icon className="h-5 w-5 text-cyan-600" />
              <h2 className="mt-4 text-sm font-medium text-foreground">
                {step.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_320px]">
          <div className="border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Factory className="h-4 w-4 text-cyan-600" />
              <h2 className="text-base font-medium text-foreground">
                What this page covers today
              </h2>
            </div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                Separate textile workflow language from battery lifecycle
                events.
              </li>
              <li>
                Guide operators to lots, templates, settings, and team setup.
              </li>
              <li>
                Reserve this route for future textile event tracking and
                operational evidence.
              </li>
            </ul>
          </div>

          <aside className="border border-border bg-card p-6">
            <h2 className="text-base font-medium text-foreground">
              Next actions
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <Link
                href={lotsHref}
                className="flex items-center justify-between text-blue-500 hover:underline"
              >
                <span>Open production lots</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={templatesHref}
                className="flex items-center justify-between text-blue-500 hover:underline"
              >
                <span>Review textile templates</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={teamHref}
                className="flex items-center justify-between text-blue-500 hover:underline"
              >
                <span>Configure team access</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={settingsHref}
                className="flex items-center justify-between text-blue-500 hover:underline"
              >
                <span>Open workspace settings</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
