"use client";

import { Check, Circle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

interface BatchLifecycleTrackerProps {
  status: string;
  /** Number of unmet activation requirements (0 = ready to activate). */
  activationBlockerCount: number;
  passportCount: number;
  /** When true, render without the outer border/padding (for composition). */
  embedded?: boolean;
}

type StageState = "done" | "current" | "upcoming";

/**
 * High-level "where is this batch in its life" stepper. Answers the single
 * question the detail page otherwise leaves implicit: what stage am I at, and
 * what is the next action. Sits above the detailed readiness/activation panels.
 *
 *   Created → Compliance ready → Activated → Passports issued
 */
export function BatchLifecycleTracker({
  status,
  activationBlockerCount,
  passportCount,
  embedded = false,
}: BatchLifecycleTrackerProps) {
  const isActive = status === "ACTIVE";
  const isArchived = status === "ARCHIVED";
  const isDraft = !isActive && !isArchived;
  const complianceReady = activationBlockerCount === 0;

  const stages: { id: string; label: string; state: StageState }[] = [
    { id: "created", label: "Created", state: "done" },
    {
      id: "compliance",
      label: "Compliance ready",
      state: complianceReady ? "done" : isDraft ? "current" : "done",
    },
    {
      id: "activated",
      label: "Activated",
      state: isActive || isArchived ? "done" : complianceReady ? "current" : "upcoming",
    },
    {
      id: "passports",
      label: "Passports issued",
      state:
        isActive && passportCount > 0
          ? "done"
          : isActive
            ? "current"
            : "upcoming",
    },
  ];

  // Single, explicit "next action" line.
  let nextStep: string;
  if (isArchived) {
    nextStep = "This batch is archived — read-only.";
  } else if (isDraft && !complianceReady) {
    nextStep = `Next: clear ${activationBlockerCount} activation requirement${activationBlockerCount > 1 ? "s" : ""} below.`;
  } else if (isDraft && complianceReady) {
    nextStep = "Next: activate this batch (uses 1 activation credit) to unlock passports & exports.";
  } else if (isActive && passportCount === 0) {
    nextStep = "Next: add passports / serial numbers from the Passports tab.";
  } else {
    nextStep = "Active — labels, passports & compliance reports are available.";
  }

  return (
    <div className={embedded ? "" : "bg-muted rounded-md p-4"}>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {stages.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-2 px-1">
              <span
                className={clsx(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium shrink-0",
                  stage.state === "done" && "bg-emerald-500/15 text-emerald-500",
                  stage.state === "current" && "bg-foreground text-background",
                  stage.state === "upcoming" && "bg-muted text-muted-foreground",
                )}
              >
                {stage.state === "done" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Circle className="h-2.5 w-2.5" fill={stage.state === "current" ? "currentColor" : "none"} />
                )}
              </span>
              <span
                className={clsx(
                  "text-xs whitespace-nowrap",
                  stage.state === "current" ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{nextStep}</p>
    </div>
  );
}
