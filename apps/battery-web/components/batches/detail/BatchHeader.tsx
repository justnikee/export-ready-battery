"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import type { Batch } from "@/lib/types";
import type { MarketRegion, ActivationBlockers } from "./types";
import {
  BatchStatusBadge,
  MarketBadge,
} from "@/components/shared/status-badges";

interface BatchHeaderProps {
  batch: Batch;
  passportCount: number;
  isDraft: boolean;
  activationResult: ActivationBlockers;
  activating: boolean;
  deletingDraft: boolean;
  batchesHref: string;
  onActivate: () => void;
  onDeleteDraft: () => void;
  onPrintLabels: () => void;
  onArchive: () => void;
}

function ProductChip({ batch }: { batch: Batch }) {
  const product = batch.product_type || "BATTERY";
  const chemistry = batch.specs?.chemistry || "Unknown";
  return (
    <span className="text-xs font-medium px-2 py-1 bg-muted border border-border text-muted-foreground">
      {product}: {chemistry}
    </span>
  );
}

export function BatchHeader({
  batch,
  isDraft,
  activationResult,
  activating,
  deletingDraft,
  batchesHref,
  onActivate,
  onDeleteDraft,
  onPrintLabels,
  onArchive,
}: BatchHeaderProps) {
  const router = useRouter();
  const region = (batch.market_region || "GLOBAL") as MarketRegion;
  const hasBlockers = activationResult.blocking.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(batchesHref)}
        className="text-muted-foreground hover:text-foreground hover:bg-muted -ml-2 w-fit"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Batches
      </Button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left: Title + meta */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl text-foreground tracking-tight">
              {batch.batch_name}
            </h1>
            <BatchStatusBadge status={batch.status} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <MarketBadge region={region} />
            <ProductChip batch={batch} />
            <span className="text-sm text-muted-foreground">
              Created {new Date(batch.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isDraft && (
            <>
              <Button
                onClick={() => {
                  if (hasBlockers) {
                    // Walk the user to the checklist instead of dead-ending
                    // on a disabled button; onActivate also surfaces the
                    // full blocker list as a toast.
                    document
                      .getElementById("activation-checklist")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                  onActivate();
                }}
                disabled={activating}
                className={
                  hasBlockers
                    ? "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-none"
                }
                title={
                  hasBlockers
                    ? `${activationResult.blocking.length} requirement(s) missing — click to see what's needed`
                    : "Activate this batch"
                }
              >
                {activating ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Activate Batch
                  </>
                )}
              </Button>
              {batch.total_passports === 0 && (
                <Button
                  variant="outline"
                  onClick={onDeleteDraft}
                  disabled={deletingDraft}
                  className="border-red-200 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                >
                  {deletingDraft ? "Deleting..." : "Delete Draft"}
                </Button>
              )}
            </>
          )}

          {batch.status === "ACTIVE" && (
            <>
              <Button
                variant="outline"
                onClick={onPrintLabels}
                className="border-border text-foreground hover:bg-muted"
              >
                Print Labels
              </Button>
              <Button
                variant="outline"
                onClick={onArchive}
                className="border-amber-200 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
              >
                Archive Batch
              </Button>
            </>
          )}

          {batch.status === "ARCHIVED" && (
            <Button
              variant="outline"
              disabled
              className="border-border text-muted-foreground cursor-not-allowed"
            >
              <Lock className="mr-2 h-4 w-4" />
              Archived (Read Only)
            </Button>
          )}
        </div>
      </div>

      {/* Blocker hint */}
      {isDraft && hasBlockers && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {activationResult.blocking.length} requirement
            {activationResult.blocking.length > 1 ? "s" : ""} missing —
            see checklist below
          </span>
        </div>
      )}
    </div>
  );
}
