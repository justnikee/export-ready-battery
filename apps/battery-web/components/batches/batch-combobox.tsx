"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

export interface BatchComboboxOption {
  id: string;
  batch_name: string;
}

interface BatchComboboxProps {
  value: string;
  onChange: (id: string, batch?: BatchComboboxOption) => void;
  /** Restrict results to a batch status, e.g. "ACTIVE". */
  status?: string;
  /** Trigger label shown when nothing is selected. */
  placeholder?: string;
  /**
   * When set, adds a first entry that clears the selection (value = "").
   * Used for filter dropdowns, e.g. "All Batches".
   */
  allOptionLabel?: string;
  /** Auto-select the first result on initial load when value is empty. */
  autoSelectFirst?: boolean;
  className?: string;
  disabled?: boolean;
}

const SEARCH_DEBOUNCE_MS = 250;
const RESULT_LIMIT = 50;

/**
 * Server-search batch selector. Unlike a static dropdown capped at limit=200,
 * this queries ListBatches with ?search= so tenants with thousands of batches
 * can still find and pick any one. Backend filters by status + search across
 * batch_name / model_name / id, so no client-side truncation.
 */
export function BatchCombobox({
  value,
  onChange,
  status,
  placeholder = "Select a batch...",
  allOptionLabel,
  autoSelectFirst = false,
  className,
  disabled = false,
}: BatchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<BatchComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  // Remembers names for ids we've seen so the trigger can label a selection
  // even after the results list has been filtered away by a later search.
  const [labels, setLabels] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSelectedRef = useRef(false);

  const fetchBatches = useCallback(
    async (term: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: String(RESULT_LIMIT) });
        if (status) params.set("status", status);
        if (term.trim()) params.set("search", term.trim());
        const res = await api.get<{ batches: BatchComboboxOption[] }>(
          `/batches?${params.toString()}`,
        );
        const items = res.data.batches || [];
        setResults(items);
        setLabels((prev) => {
          const next = { ...prev };
          for (const b of items) next[b.id] = b.batch_name;
          return next;
        });
        return items;
      } catch {
        setResults([]);
        return [] as BatchComboboxOption[];
      } finally {
        setLoading(false);
      }
    },
    [status],
  );

  // Initial load (and auto-select-first for single-select selectors).
  useEffect(() => {
    let cancelled = false;
    fetchBatches("").then((items) => {
      if (cancelled) return;
      if (autoSelectFirst && !value && !autoSelectedRef.current && items.length > 0) {
        autoSelectedRef.current = true;
        onChange(items[0].id, items[0]);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBatches]);

  // Debounced search while the panel is open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      void fetchBatches(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search, open, fetchBatches]);

  // Resolve a label for a value set before we've seen it in a result list.
  useEffect(() => {
    if (!value || labels[value]) return;
    let cancelled = false;
    api
      .get<{ batch_name?: string }>(`/batches/${value}`)
      .then((res) => {
        if (cancelled || !res.data?.batch_name) return;
        setLabels((prev) => ({ ...prev, [value]: res.data.batch_name as string }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [value, labels]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const triggerLabel = useMemo(() => {
    if (!value) return allOptionLabel ?? placeholder;
    return labels[value] ?? "Loading…";
  }, [value, labels, allOptionLabel, placeholder]);

  const select = (id: string, batch?: BatchComboboxOption) => {
    onChange(id, batch);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative min-w-45", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 border border-border bg-background px-3 py-2 text-sm text-foreground rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50",
          !value && !allOptionLabel && "text-muted-foreground",
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-56 rounded-md border border-border bg-popover shadow-md">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batches…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {allOptionLabel && (
              <button
                type="button"
                onClick={() => select("")}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                <Check className={cn("h-3.5 w-3.5 shrink-0", value ? "opacity-0" : "opacity-100")} />
                <span className="truncate">{allOptionLabel}</span>
              </button>
            )}
            {results.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => select(b.id, b)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                <Check
                  className={cn("h-3.5 w-3.5 shrink-0", value === b.id ? "opacity-100" : "opacity-0")}
                />
                <span className="truncate">{b.batch_name}</span>
              </button>
            ))}
            {!loading && results.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                {search.trim() ? "No batches match your search." : "No batches available."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
