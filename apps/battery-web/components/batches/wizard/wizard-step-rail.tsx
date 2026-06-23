"use client";

import { Check } from "lucide-react";

export interface WizardStep {
  id: number;
  label: string;
  description: string;
}

interface WizardStepRailProps {
  steps: readonly WizardStep[];
  current: number;
  /** Jump to an already-visited (earlier) step. Forward steps are disabled. */
  onSelect: (index: number) => void;
}

/**
 * Vertical step rail for the full-screen wizard. Completed steps are clickable
 * to jump back; the current step is highlighted; upcoming steps are inert.
 */
export function WizardStepRail({ steps, current, onSelect }: WizardStepRailProps) {
  return (
    <nav aria-label="Batch creation steps" className="flex flex-col gap-1 p-4">
      {steps.map((step) => {
        const isDone = step.id < current;
        const isActive = step.id === current;
        const clickable = isDone;
        return (
          <button
            key={step.id}
            type="button"
            disabled={!clickable}
            onClick={() => clickable && onSelect(step.id)}
            aria-current={isActive ? "step" : undefined}
            className={`flex items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
              isActive
                ? "bg-accent"
                : clickable
                  ? "hover:bg-accent/50 cursor-pointer"
                  : "cursor-default opacity-60"
            }`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors ${
                isDone
                  ? "bg-foreground text-background"
                  : isActive
                    ? "bg-background text-foreground ring-2 ring-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : step.id + 1}
            </span>
            <span className="min-w-0">
              <span className={`block text-sm ${isActive ? "font-medium text-foreground" : "text-foreground"}`}>
                {step.label}
              </span>
              <span className="block text-[11px] text-muted-foreground">{step.description}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
