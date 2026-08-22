"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { CreateBatchWizard } from "@/components/batches/create-batch-wizard";
import { TemplatesDialog } from "@/components/batches/templates-dialog";
import { BulkImportDialog } from "@/components/batches/bulk-import-dialog";
import api from "@/lib/api";
import { duplicateBatch } from "@/lib/api/batches";
import { toApiError, getApiErrorMessage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Search,
  Filter,
  ArrowRight,
  Download,
  Copy,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
  Battery,
  Package,
  Archive,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  BatchStatusBadge,
  MarketBadge,
  ComplianceBadge,
} from "@/components/shared/status-badges";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Batch } from "@/lib/types";

import { BatchesListSkeleton } from "@/components/batches/BatchesListSkeleton";
import { dashboardPathFromPathname } from "@/lib/routes";

// Types
type FilterType = "ALL" | "DRAFT" | "ACTIVE" | "ARCHIVED";
type ComplianceFilter = "ALL" | "READY" | "NEEDS_WORK" | "BLOCKED";

interface BatchesResponse {
  batches: Batch[];
  total?: number;
  total_pages?: number;
}

const ITEMS_PER_PAGE = 50;

export default function BatchesPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  // Full skeleton only on first load; filter/search refetches keep the table
  // visible (stale rows) instead of flashing the whole page.
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  // Tenant-wide aggregates for the stat cards — independent of the current
  // page/filter, so the cards reflect ALL batches, not just what's on screen.
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});
  const [complianceReadyCount, setComplianceReadyCount] = useState<number | null>(null);
  const [batchToArchive, setBatchToArchive] = useState<Batch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);

  // Debounce search input so we don't fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchBatches = useCallback(
    async (page = 1) => {
      if (!user) return;
      try {
        setLoading(true);
        // Status + search are applied server-side so they cover ALL batches,
        // not just the currently loaded page.
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
        });
        if (filter !== "ALL") params.set("status", filter);
        if (debouncedSearch) params.set("search", debouncedSearch);
        const response = await api.get<BatchesResponse>(
          `/batches?${params.toString()}`,
        );
        setBatches(response.data.batches || []);
        setTotalCount(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
        // Refresh tenant-wide status counts on the default view and after
        // mutations (which reset to page 1). Best-effort — never blocks the list.
        if (page === 1) {
          api
            .get<{
              batch_status_breakdown?: Record<string, number>;
              compliance_ready_count?: number;
            }>("/analytics/overview")
            .then((res) => {
              setStatusBreakdown(res.data?.batch_status_breakdown || {});
              setComplianceReadyCount(res.data?.compliance_ready_count ?? null);
            })
            .catch(() => {});
        }
      } catch (error: unknown) {
        toast.error("Failed to load batches");
      } finally {
        setLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [user, filter, debouncedSearch],
  );

  useEffect(() => {
    fetchBatches(currentPage);
  }, [currentPage, fetchBatches]);

  // Compliance readiness is derived client-side from score + gaps, so this
  // filter applies to the loaded page only; status + search are server-side.
  const filteredBatches = batches.filter((batch) => {
    if (complianceFilter !== "ALL") {
      const { status } = getComplianceStatus(batch);
      if (status !== complianceFilter) return false;
    }
    return true;
  });

  const paginatedBatches = filteredBatches;

  const hasActiveFilters =
    filter !== "ALL" || complianceFilter !== "ALL" || debouncedSearch !== "";

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, complianceFilter, debouncedSearch]);

  const handleDuplicate = async (batchId: string) => {
    try {
      await duplicateBatch(batchId);
      toast.success("Batch duplicated successfully");
      fetchBatches();
    } catch (error: unknown) {
      toast.error("Failed to duplicate batch");
    }
  };

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("ID copied to clipboard");
  };

  const getComplianceStatus = (batch: Batch): { status: "READY" | "NEEDS_WORK" | "BLOCKED"; label: string; score: number; blockerCount: number } => {
    const score = batch.compliance_score ?? 0;
    const gaps = batch.compliance_gaps || [];
    const blockerCount = gaps.filter((g) => g.severity === "ERROR").length;
    if (score >= 95 && blockerCount === 0) return { status: "READY", label: "Ready", score, blockerCount };
    if (score >= 70 && blockerCount === 0) return { status: "NEEDS_WORK", label: "Needs work", score, blockerCount };
    return { status: "BLOCKED", label: "Blocked", score, blockerCount };
  };

  if (loading && !hasLoadedOnce) {
    return <BatchesListSkeleton />;
  }

  return (
    <div className="min-h-screen bg-sidebar p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-foreground tracking-tight">
              Production Batches
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage battery production runs and passport generation
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TemplatesDialog />
            <BulkImportDialog onImported={fetchBatches} />
            <CreateBatchWizard onBatchCreated={fetchBatches} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative bg-muted rounded-md p-4 flex items-center gap-4"><div className="w-10 h-10 bg-background flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl text-foreground">{totalCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Batches
              </p>
            </div>
          </div>
          <div className="relative bg-muted rounded-md p-4 flex items-center gap-4"><div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl text-emerald-500">
                {statusBreakdown.ACTIVE ?? batches.filter((b) => b.status === "ACTIVE").length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Active
              </p>
            </div>
          </div>
          <div className="relative bg-muted rounded-md p-4 flex items-center gap-4"><div className="w-10 h-10 bg-background flex items-center justify-center">
              <Battery className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl text-muted-foreground">
                {statusBreakdown.DRAFT ?? batches.filter((b) => b.status === "DRAFT").length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Drafts
              </p>
            </div>
          </div>
          <div className="relative bg-muted rounded-md p-4 flex items-center gap-4"><div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl text-emerald-500">
                {complianceReadyCount ?? batches.filter((b) => getComplianceStatus(b).status === "READY").length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Compliance Ready
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="relative flex items-center justify-between gap-4 bg-muted rounded-md p-4"><div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                className="bg-transparent border-border pl-10 h-9 text-sm focus:border-border focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-foreground hover:text-foreground hover:bg-accent h-9 text-sm"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filter === "ALL"
                    ? "All Status"
                    : filter === "ACTIVE"
                      ? "Active"
                      : filter === "ARCHIVED"
                        ? "Archived"
                        : "Draft"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="shadow-none min-w-35"
              >
                <DropdownMenuItem
                  onClick={() => setFilter("ALL")}
                  className="cursor-pointer"
                >
                  All Status
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter("DRAFT")}
                  className="cursor-pointer"
                >
                  Drafts Only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter("ACTIVE")}
                  className="cursor-pointer"
                >
                  Active Only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter("ARCHIVED")}
                  className="cursor-pointer"
                >
                  Archived
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="text-foreground hover:text-foreground hover:bg-accent h-9 text-sm"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {complianceFilter === "ALL"
                    ? "All Compliance"
                    : complianceFilter === "READY"
                      ? "Ready"
                      : complianceFilter === "NEEDS_WORK"
                        ? "Needs Work"
                        : "Blocked"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="shadow-none min-w-35"
              >
                <DropdownMenuItem
                  onClick={() => setComplianceFilter("ALL")}
                  className="cursor-pointer"
                >
                  All Compliance
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setComplianceFilter("READY")}
                  className="cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5 text-emerald-500">
                    <ShieldCheck className="h-3 w-3" /> Ready
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setComplianceFilter("NEEDS_WORK")}
                  className="cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5 text-amber-500">
                    <AlertTriangle className="h-3 w-3" /> Needs Work
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setComplianceFilter("BLOCKED")}
                  className="cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1.5 text-red-500">
                    <XCircle className="h-3 w-3" /> Blocked
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="relative bg-muted rounded-md overflow-visible"><table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Batch Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Market
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Specifications
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Passports
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider pr-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Package className="h-10 w-10 text-muted-foreground" />
                      {hasActiveFilters ? (
                        <>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              No batches match your filters
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Try a different search term or clear the filters
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearchQuery("");
                              setFilter("ALL");
                              setComplianceFilter("ALL");
                            }}
                          >
                            Clear filters
                          </Button>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              No batches yet
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Create your first production batch to start
                              generating battery passports
                            </p>
                          </div>
                          <CreateBatchWizard onBatchCreated={fetchBatches} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="hover:bg-background transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(
                        dashboardPathFromPathname(
                          pathname,
                          `batches/${batch.id}`,
                        ),
                      )
                    }
                  >
                    {/* Batch Name */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground hover:text-foreground">
                          {batch.batch_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded">
                            {batch.id.substring(0, 14)}...
                          </code>
                          <button
                            className="text-muted-foreground hover:text-muted-foreground"
                            onClick={(e) => copyToClipboard(batch.id, e)}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Market */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <MarketBadge region={batch.market_region} />
                        {batch.pli_compliant && (
                          <span className="text-xs text-orange-600 font-medium">
                            PLI Eligible
                          </span>
                        )}
                        {batch.domestic_value_add !== undefined &&
                          batch.market_region === "INDIA" && (
                            <span
                              className={`text-xs ${batch.domestic_value_add >= 50 ? "text-emerald-500" : "text-muted-foreground"}`}
                            >
                              DVA: {batch.domestic_value_add.toFixed(1)}%
                            </span>
                          )}
                      </div>
                    </td>

                    {/* Specs */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-foreground font-medium">
                          {batch.specs?.chemistry || "N/A"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {batch.specs?.voltage
                            ? `${batch.specs.voltage}V`
                            : ""}
                          {batch.specs?.voltage && batch.specs?.capacity
                            ? " â€¢ "
                            : ""}
                          {batch.specs?.capacity || ""}
                        </span>
                      </div>
                    </td>

                    {/* Passports */}
                    <td className="px-4 py-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg text-foreground">
                          {(batch.total_passports || 0).toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          units
                        </span>
                      </div>
                    </td>

                    {/* Compliance */}
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <ComplianceBadge {...getComplianceStatus(batch)} />
                        {batch.compliance_score !== undefined && batch.compliance_score > 0 && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {batch.compliance_score.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <BatchStatusBadge status={batch.status} />
                    </td>

                    {/* Actions */}
                    <td className="text-right pr-4 py-4">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button aria-label="Batch actions" className="p-1.5 rounded text-muted-foreground hover:text-muted-foreground hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-45"
                        >
                          <DropdownMenuLabel className="text-muted-foreground text-xs uppercase tracking-wider">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                dashboardPathFromPathname(
                                  pathname,
                                  `batches/${batch.id}`,
                                ),
                              );
                            }}
                            className="cursor-pointer text-foreground hover:bg-muted focus:bg-muted focus:text-foreground"
                          >
                            <ArrowRight className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>

                          {batch.status !== "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await api.post(
                                    `/batches/${batch.id}/activate`,
                                  );
                                  toast.success("Batch activated!");
                                  fetchBatches();
                                } catch (err: unknown) {
                                  const apiError = toApiError(err);
                                  toast.error(
                                    apiError.response?.data?.error ||
                                      "Activation failed",
                                  );
                                }
                              }}
                              className="cursor-pointer text-emerald-500 hover:bg-emerald-500/10 focus:bg-emerald-500/10 focus:text-emerald-500"
                            >
                              <Zap className="mr-2 h-4 w-4" /> Activate
                            </DropdownMenuItem>
                          )}

                          {batch.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  toast.loading("Generating labels...", { id: `labels-${batch.id}` });
                                  const response = await api.get(`/batches/${batch.id}/labels`, {
                                    responseType: "blob",
                                  });
                                  const url = window.URL.createObjectURL(new Blob([response.data]));
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.setAttribute("download", `${batch.batch_name}_labels.pdf`);
                                  document.body.appendChild(link);
                                  link.click();
                                  link.remove();
                                  window.URL.revokeObjectURL(url);
                                  toast.success("Labels downloaded!", { id: `labels-${batch.id}` });
                                } catch (error: unknown) {
                                  const msg = await getApiErrorMessage(error, "Failed to download labels");
                                  toast.error(msg, { id: `labels-${batch.id}` });
                                }
                              }}
                              className="cursor-pointer text-foreground hover:bg-muted focus:bg-muted focus:text-foreground"
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                              Labels
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(batch.id);
                            }}
                            className="cursor-pointer text-foreground hover:bg-muted focus:bg-muted focus:text-foreground"
                          >
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="bg-muted" />

                          {/* Archive - only for ACTIVE batches */}
                          {batch.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setBatchToArchive(batch);
                              }}
                              className="cursor-pointer text-amber-500 hover:bg-amber-500/10 focus:bg-amber-500/10 focus:text-amber-500"
                            >
                              <Archive className="mr-2 h-4 w-4" /> Archive
                            </DropdownMenuItem>
                          )}

                          {/* Delete Draft - only for DRAFT batches with 0 passports */}
                          {batch.status !== "ACTIVE" &&
                            batch.status !== "ARCHIVED" &&
                            (batch.total_passports || 0) === 0 && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBatchToDelete(batch);
                                }}
                                className="cursor-pointer text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Draft
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{" "}
              {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-foreground hover:bg-background disabled:opacity-50 h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "ghost"}
                      size="sm"
                      className={`w-8 h-8 p-0 ${
                        pageNum === currentPage
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="text-foreground hover:bg-background disabled:opacity-50 h-8"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={!!batchToArchive}
        onOpenChange={(open) => !open && setBatchToArchive(null)}
        title="Archive this batch?"
        description="Archived batches remain available for audit and compliance purposes but cannot generate new passports."
        confirmText="Archive Batch"
        onConfirm={async () => {
          if (batchToArchive) {
            try {
              await api.post(`/batches/${batchToArchive.id}/archive`);
              toast.success("Batch archived successfully");
              fetchBatches();
            } catch (err: unknown) {
              const apiError = toApiError(err);
              toast.error(
                apiError.response?.data?.error || "Failed to archive batch",
              );
            } finally {
              setBatchToArchive(null);
            }
          }
        }}
      />

      <ConfirmDialog
        open={!!batchToDelete}
        onOpenChange={(open) => !open && setBatchToDelete(null)}
        title="Delete this draft batch?"
        description="This action cannot be undone. All data associated with this draft will be permanently removed."
        confirmText="Delete Draft"
        variant="destructive"
        onConfirm={async () => {
          if (batchToDelete) {
            try {
              await api.delete(`/batches/${batchToDelete.id}/draft`);
              toast.success("Draft batch deleted");
              fetchBatches();
            } catch (err: unknown) {
              const apiError = toApiError(err);
              toast.error(
                apiError.response?.data?.error || "Failed to delete batch",
              );
            } finally {
              setBatchToDelete(null);
            }
          }
        }}
      />
    </div>
  );
}
