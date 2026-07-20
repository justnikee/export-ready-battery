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
  Sparkles,
  LayoutTemplate,
  PenLine,
  History,
  X,
  ArrowLeft,
  Search,
  Check,
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        {view === "main" ? (
          <>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-semibold">Create New Batch</DialogTitle>
              <DialogDescription className="text-sm">Battery passport for your product line</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Market selection */}
              <div className="space-y-3">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Select Market
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MARKET_OPTIONS.map((opt) => {
                    const isSelected = market === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setMarket(opt.value)}
                        className={`relative flex items-center gap-4 p-4 border rounded-xl text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-[var(--brand)] bg-[var(--brand)]/5 text-foreground ring-1 ring-[var(--brand)]/20"
                            : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg transition-colors ${
                          isSelected 
                            ? "bg-[var(--brand)] text-[var(--brand-foreground)]" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground">{opt.label}</div>
                          <div className="text-[11px] opacity-85 mt-0.5">{opt.sub}</div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand)] text-[var(--brand-foreground)] shadow-xs">
                            <Check className="h-2.5 w-2.5 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Continue an in-progress (not yet created) batch form */}
              {drafts.length > 0 && (
                <div className="space-y-3 border-t border-border/60 pt-5">
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      Continue where you left off
                    </div>
                    <p className="text-[11px] text-muted-foreground/80">
                      Unsubmitted forms saved on this device — not created batches yet.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {drafts.map((draft) => {
                      const pct = batchCompletionPct(draft.data);
                      return (
                        <div
                          key={draft.id}
                          className="flex items-center justify-between gap-3 border border-border bg-muted/15 rounded-xl px-4 py-3 hover:bg-muted/20 transition-all duration-200"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                              {draft.batchName || "Unnamed Batch"} — {draft.marketRegion} — {WIZARD_STEP_LABELS[draft.step] ?? "Core"}
                            </div>
                            <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                              Last saved {draftAgeText(draft.savedAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="hidden sm:flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--brand)] rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-[11px] text-muted-foreground font-medium">{pct}%</span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs rounded-lg font-medium"
                              onClick={() => onChoice({ type: "resume-draft", draftId: draft.id })}
                            >
                              Resume
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraft(draft.id)}
                              aria-label="Discard draft"
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Start path */}
              <div className="space-y-3 border-t border-border/60 pt-5">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Start From
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="relative p-5 border border-[var(--brand)]/30 bg-[var(--brand)]/5 rounded-xl text-left flex flex-col justify-between h-full transition-all duration-200 hover:border-[var(--brand)]/50">
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--brand)] text-[var(--brand-foreground)] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                      Fastest
                    </span>
                    <div>
                      <div className="p-2 rounded-lg bg-[var(--brand)]/15 text-[var(--brand)] w-fit mb-3">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">AI Fill</div>
                      <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Upload a PDF for full extraction, or describe in words for a quick core-fields draft.
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto pt-5">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 text-[11px] h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-xs cursor-pointer"
                        onClick={() => onChoice({ type: "ai-pdf", market })}
                      >
                        Upload PDF
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 text-[11px] h-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-xs cursor-pointer"
                        onClick={() => onChoice({ type: "ai-nl", market })}
                      >
                        Describe
                      </Button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView("templates")}
                    className="p-5 border border-border bg-card rounded-xl text-left hover:border-[var(--brand)] hover:bg-accent/40 transition-all duration-200 flex flex-col justify-between h-full cursor-pointer group animate-none"
                  >
                    <div>
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground w-fit mb-3 transition-colors group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]">
                        <LayoutTemplate className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">From Template</div>
                      <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Pick a saved template and customise it.
                      </div>
                    </div>
                    <div className="text-[11px] text-primary/70 font-semibold mt-auto pt-5 flex items-center gap-1 group-hover:text-[var(--brand)] transition-colors">
                      Browse Templates &rarr;
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChoice({ type: "blank", market })}
                    className="p-5 border border-border bg-card rounded-xl text-left hover:border-[var(--brand)] hover:bg-accent/40 transition-all duration-200 flex flex-col justify-between h-full cursor-pointer group animate-none"
                  >
                    <div>
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground w-fit mb-3 transition-colors group-hover:bg-[var(--brand)]/10 group-hover:text-[var(--brand)]">
                        <PenLine className="h-5 w-5" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">Start Blank</div>
                      <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        Fill in every field manually.
                      </div>
                    </div>
                    <div className="text-[11px] text-primary/70 font-semibold mt-auto pt-5 flex items-center gap-1 group-hover:text-[var(--brand)] transition-colors">
                      Start Empty &rarr;
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView("main")}
                  aria-label="Back"
                  className="p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <DialogTitle className="text-xl font-semibold">Choose a Template</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates…"
                    className="pl-9 h-9.5 rounded-lg border-border focus-visible:ring-1"
                  />
                </div>
                <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/40 self-start sm:self-auto">
                  {TEMPLATE_MARKET_FILTERS.map((f) => (
                    <Button
                      key={f}
                      type="button"
                      size="sm"
                      variant={templateMarketFilter === f ? "default" : "ghost"}
                      className={`h-7.5 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                        templateMarketFilter === f
                          ? "bg-card text-foreground shadow-xs border border-border/10"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setTemplateMarketFilter(f)}
                    >
                      {f === "ALL" ? "All" : f}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredTemplates.map((t) => (
                  <div key={t.id} className="border border-border rounded-xl p-4 bg-card hover:border-[var(--brand)] hover:shadow-xs transition-all duration-200 flex flex-col justify-between h-full min-h-[145px]">
                    <div className="space-y-1.5">
                      <span className="text-[9px] px-2 py-0.5 font-semibold bg-muted text-muted-foreground rounded-full border border-border/50 self-start inline-block">
                        {t.market_region}
                      </span>
                      <div className="text-sm font-semibold text-foreground truncate">{t.name}</div>
                      <div className="text-[10px] text-muted-foreground leading-normal truncate">{templateSpecSummary(t.specs)}</div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3 w-full text-xs h-7.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-xs cursor-pointer"
                      onClick={() => onChoice({ type: "template", templateId: t.id })}
                    >
                      Use Template →
                    </Button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onChoice({ type: "blank", market })}
                  className="border-2 border-dashed border-border hover:border-[var(--brand)] hover:bg-accent/40 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-all duration-200 min-h-[145px] cursor-pointer"
                >
                  <span className="text-xl font-light">+</span>
                  <span className="text-xs font-semibold">Blank template</span>
                </button>
              </div>
              {filteredTemplates.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No templates match your search.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
