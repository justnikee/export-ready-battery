"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Leaf,
  Flag,
  Bot,
  LayoutTemplate,
  PenLine,
  History,
  X,
  ArrowLeft,
  Search,
} from "lucide-react";
import type { Template } from "@/hooks/use-queries";
import type { MarketRegion } from "@/components/batches/batch-form-schema";
import { listDrafts, deleteDraftSlot, type DraftSlot } from "@/lib/batch-draft";
import { batchCompletionPct } from "@/lib/batch-completion";

// Keep in sync with STEPS in create-batch-wizard.tsx — used only to render a
// human-readable "Step X of N" label for resumable drafts.
const WIZARD_STEP_LABELS = ["Core", "Compliance", "Review"];

export type EntryChoice =
  | { type: "blank" | "ai-pdf" | "ai-nl"; market: MarketRegion }
  | { type: "template"; templateId: string }
  | { type: "resume-draft"; draftId: string };

interface BatchEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | undefined;
  templates: Template[];
  onChoice: (choice: EntryChoice) => void;
}

const MARKET_OPTIONS = [
  { value: "INDIA" as const, label: "India", sub: "BIS · EPR · PLI · AIS-156", icon: Flag },
  { value: "EU" as const, label: "EU Export", sub: "Battery Reg. 2023/1542", icon: Leaf },
];

const TEMPLATE_MARKET_FILTERS = ["ALL", "INDIA", "EU"] as const;

function draftAgeText(savedAt: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(savedAt).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function templateSpecSummary(specs: Record<string, unknown>): string {
  const parts = [specs.chemistry, specs.capacity, specs.voltage].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  return parts.join(" · ") || "No specs saved";
}

export function BatchEntryModal({
  open,
  onOpenChange,
  tenantId,
  templates,
  onChoice,
}: BatchEntryModalProps) {
  const [view, setView] = useState<"main" | "templates">("main");
  const [market, setMarket] = useState<MarketRegion>("INDIA");
  const [drafts, setDrafts] = useState<DraftSlot[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateMarketFilter, setTemplateMarketFilter] =
    useState<(typeof TEMPLATE_MARKET_FILTERS)[number]>("ALL");

  useEffect(() => {
    if (!open) return;
    setView("main");
    if (tenantId) setDrafts(listDrafts(tenantId));
  }, [open, tenantId]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (templateMarketFilter !== "ALL" && t.market_region !== templateMarketFilter) {
        return false;
      }
      if (templateSearch.trim() && !t.name.toLowerCase().includes(templateSearch.trim().toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [templates, templateMarketFilter, templateSearch]);

  const handleDeleteDraft = (id: string) => {
    if (!tenantId) return;
    deleteDraftSlot(tenantId, id);
    setDrafts(listDrafts(tenantId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        {view === "main" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>Battery passport for your product line</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Market selection */}
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Select Market
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MARKET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMarket(opt.value)}
                      className={`p-3 border-2 text-center transition-all ${
                        market === opt.value
                          ? "border-foreground bg-accent text-foreground"
                          : "border-border hover:border-border text-muted-foreground"
                      }`}
                    >
                      <opt.icon className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-sm">{opt.label}</div>
                      <div className="text-[10px] opacity-70">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resume a draft */}
              {drafts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Resume a Draft
                  </div>
                  <div className="space-y-2">
                    {drafts.map((draft) => {
                      const pct = batchCompletionPct(draft.data);
                      return (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between gap-3 border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {draft.batchName} — {draft.marketRegion} — {WIZARD_STEP_LABELS[draft.step] ?? "Core"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Last saved {draftAgeText(draft.savedAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="hidden sm:flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-foreground rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{pct}%</span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onChoice({ type: "resume-draft", draftId: draft.id })}
                            >
                              Resume
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(draft.id)}
                              aria-label="Discard draft"
                              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Start path */}
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Start From
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-3 border border-border text-left">
                    <Bot className="h-5 w-5 mb-1.5 text-muted-foreground" />
                    <div className="text-sm font-medium text-foreground">AI Fill</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 mb-2">
                      Upload a PDF for full extraction, or describe in words for a quick core-fields draft
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[11px] h-7"
                        onClick={() => onChoice({ type: "ai-pdf", market })}
                      >
                        Upload PDF
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[11px] h-7"
                        onClick={() => onChoice({ type: "ai-nl", market })}
                      >
                        Describe
                      </Button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("templates")}
                    className="p-3 border border-border text-left hover:border-foreground hover:bg-accent transition-colors"
                  >
                    <LayoutTemplate className="h-5 w-5 mb-1.5 text-muted-foreground" />
                    <div className="text-sm font-medium text-foreground">From Template</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Pick a saved template and customise it
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChoice({ type: "blank", market })}
                    className="p-3 border border-border text-left hover:border-foreground hover:bg-accent transition-colors"
                  >
                    <PenLine className="h-5 w-5 mb-1.5 text-muted-foreground" />
                    <div className="text-sm font-medium text-foreground">Start Blank</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Fill in every field manually
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView("main")}
                  aria-label="Back"
                  className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <DialogTitle>Choose a Template</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates…"
                    className="pl-8"
                  />
                </div>
                <div className="flex gap-1">
                  {TEMPLATE_MARKET_FILTERS.map((f) => (
                    <Button
                      key={f}
                      type="button"
                      size="sm"
                      variant={templateMarketFilter === f ? "default" : "outline"}
                      onClick={() => setTemplateMarketFilter(f)}
                    >
                      {f === "ALL" ? "All" : f}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {filteredTemplates.map((t) => (
                  <div key={t.id} className="border border-border p-3 flex flex-col gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground border border-border rounded self-start">
                      {t.market_region}
                    </span>
                    <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground">{templateSpecSummary(t.specs)}</div>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-1 self-start"
                      onClick={() => onChoice({ type: "template", templateId: t.id })}
                    >
                      Use →
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onChoice({ type: "blank", market })}
                  className="border border-dashed border-border p-3 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-foreground hover:text-foreground transition-colors min-h-25"
                >
                  <span className="text-lg">+</span>
                  <span className="text-xs">Blank template</span>
                </button>
              </div>
              {filteredTemplates.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No templates match your search.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
