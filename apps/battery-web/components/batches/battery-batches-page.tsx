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
  Globe,
  ChevronLeft,
  ChevronRight,
  Battery,
  Package,
  Archive,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Batch } from "@/lib/types";

import { BatchesListSkeleton } from "@/components/batches/BatchesListSkeleton";
import { dashboardPathFromPathname } from "@/lib/routes";

// Types
type MarketRegion = "INDIA" | "EU" | "GLOBAL";
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
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [complianceFilter, setComplianceFilter] = useState<ComplianceFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [batchToArchive, setBatchToArchive] = useState<Batch | null>(null);
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);

  const fetchBatches = useCallback(
    async (page = 1) => {
      if (!user) return;
      try {
        setLoading(true);
        const response = await api.get<BatchesResponse>(
          `/batches?tenant_id=${user.tenant_id}&page=${page}&limit=${ITEMS_PER_PAGE}`,
        );
        setBatches(response.data.batches || []);
        setTotalCount(response.data.total || 0);
        setTotalPages(response.data.total_pages || 1);
      } catch (error: unknown) {
        toast.error("Failed to load batches");
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    fetchBatches(currentPage);
  }, [currentPage, fetchBatches]);

  const filteredBatches = batches.filter((batch) => {
    if (filter !== "ALL") {
      const status = batch.status || "DRAFT";
      if (status !== filter) return false;
    }
    if (complianceFilter !== "ALL") {
      const { status } = getComplianceStatus(batch);
      if (status !== complianceFilter) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        batch.batch_name.toLowerCase().includes(query) ||
        batch.id.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const paginatedBatches = filteredBatches;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, complianceFilter, searchQuery]);

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

  const getComplianceBadge = (batch: Batch) => {
    const { status, label, score, blockerCount } = getComplianceStatus(batch);
    if (status === "READY") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" title={`${score.toFixed(0)}% compliant`}>
          <ShieldCheck className="h-3 w-3" />
          {label}
        </span>
      );
    }
    if (status === "NEEDS_WORK") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20" title={`${score.toFixed(0)}% compliant`}>
          <AlertTriangle className="h-3 w-3" />
          {label}
          {blockerCount > 0 && ` (${blockerCount})`}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20" title={`${score.toFixed(0)}% compliant`}>
        <XCircle className="h-3 w-3" />
        {label}
        {blockerCount > 0 && ` (${blockerCount})`}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    }
    if (status === "ARCHIVED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Archived
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
        Draft
      </span>
    );
  };

  const getMarketBadge = (region: MarketRegion | undefined) => {
    if (region === "INDIA") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-orange-500/10 text-orange-700 border border-orange-200">
          <span className="w-3 h-3 rounded-full bg-linear-to-br from-orange-400 to-green-500 shrink-0" />
          India
        </span>
      );
    }
    if (region === "EU") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <span className="w-3 h-3 rounded-full bg-linear-to-br from-blue-400 to-blue-600 shrink-0" />
          EU
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
        <Globe className="h-3 w-3" />
        Global
      </span>
    );
  };

  if (loading) {
    return <BatchesListSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
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
            <BulkImportDialog />
            <CreateBatchWizard onBatchCreated={fetchBatches} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative bg-transparent border border-border p-4 flex items-center gap-4">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="w-10 h-10 bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl text-foreground">{totalCount}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Total Batches
              </p>
            </div>
          </div>
          <div className="relative bg-transparent border border-border p-4 flex items-center gap-4">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl text-emerald-500">
                {batches.filter((b) => b.status === "ACTIVE").length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Active
              </p>
            </div>
          </div>
          <div className="relative bg-transparent border border-border p-4 flex items-center gap-4">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="w-10 h-10 bg-muted flex items-center justify-center">
              <Battery className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl text-muted-foreground">
                {batches.filter((b) => b.status !== "ACTIVE").length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Drafts
              </p>
            </div>
          </div>
          <div className="relative bg-transparent border border-border p-4 flex items-center gap-4">
            <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
            <div className="w-10 h-10 bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl text-emerald-500">
                {batches.filter((b) => getComplianceStatus(b).status === "READY").length}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Compliance Ready
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="relative flex items-center justify-between gap-4 bg-transparent p-4 border border-border">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <div className="flex items-center gap-3 flex-1">
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
                  className="border-border text-foreground hover:text-foreground hover:bg-accent h-9 text-sm"
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
                  className="border-border text-foreground hover:text-foreground hover:bg-accent h-9 text-sm"
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
        <div className="relative bg-transparent border border-border overflow-visible">
          <span className="absolute -top-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -left-0.5 w-1 h-1 bg-border" />
          <span className="absolute -bottom-0.5 -right-0.5 w-1 h-1 bg-border" />
          <table className="w-full">
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
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          No batches found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Create your first production batch to start generating
                          battery passports
                        </p>
                      </div>
                      <CreateBatchWizard onBatchCreated={fetchBatches} />
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
                          <code className="text-xs text-muted-foreground font-mono bg-transparent border border-border px-1.5 py-0.5 rounded">
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
                        {getMarketBadge(batch.market_region)}
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
                        {getComplianceBadge(batch)}
                        {batch.compliance_score !== undefined && batch.compliance_score > 0 && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {batch.compliance_score.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      {getStatusBadge(batch.status || "DRAFT")}
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
                          className="bg-background border border-border shadow-none min-w-45"
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
                className="border-border text-foreground hover:bg-background disabled:opacity-50 h-8"
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
                className="border-border text-foreground hover:bg-background disabled:opacity-50 h-8"
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
