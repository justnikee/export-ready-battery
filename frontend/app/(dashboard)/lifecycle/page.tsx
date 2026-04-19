"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RequestMagicLinkModal } from "@/components/passport/request-magic-link-modal";
import {
  ArrowRight,
  Package,
  Truck,
  Wrench,
  Recycle,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Key,
  X,
} from "lucide-react";

interface PassportSummary {
  uuid: string;
  serial_number: string;
  status: string;
  state_of_health: number | null;
  batch_name: string;
  updated_at: string;
}

interface BatchOption {
  id: string;
  batch_name: string;
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-muted text-foreground",
  ACTIVE: "bg-blue-500/15 text-blue-500",
  SHIPPED: "bg-amber-500/15 text-amber-500",
  IN_SERVICE: "bg-emerald-500/15 text-emerald-500",
  RECALLED: "bg-red-500/15 text-red-500",
  RECYCLED: "bg-purple-100 text-purple-700",
  END_OF_LIFE: "bg-muted text-muted-foreground",
};

const STATUS_ICONS: Record<string, typeof Package> = {
  CREATED: Package,
  ACTIVE: Package,
  SHIPPED: Truck,
  IN_SERVICE: Wrench,
  RECALLED: AlertTriangle,
  RECYCLED: Recycle,
  END_OF_LIFE: Recycle,
};

const LIFECYCLE_STATES = [
  "ALL",
  "CREATED",
  "ACTIVE",
  "SHIPPED",
  "IN_SERVICE",
  "RECALLED",
  "RECYCLED",
  "END_OF_LIFE",
];

// Allowed transitions per status (mirrors backend state machine)
const TRANSITIONS: Record<string, string[]> = {
  CREATED: ["ACTIVATE"],
  ACTIVE: ["SHIP", "RECALL"],
  SHIPPED: ["INSTALL", "RECALL"],
  IN_SERVICE: ["RECALL", "RECYCLE"],
  RECALLED: ["RECYCLE"],
  RECYCLED: ["END_OF_LIFE"],
  END_OF_LIFE: [],
};

const EVIDENCE_FIELDS: Record<
  string,
  { key: string; label: string; type: "text" | "date" }[]
> = {
  SHIP: [
    { key: "shipment_reference", label: "Shipment Reference", type: "text" },
    { key: "shipment_date", label: "Shipment Date", type: "date" },
  ],
  INSTALL: [
    { key: "installation_date", label: "Installation Date", type: "date" },
    { key: "installer_id", label: "Installer ID", type: "text" },
  ],
  RECALL: [
    { key: "recall_reason", label: "Recall Reason", type: "text" },
    { key: "recall_reference", label: "Recall Reference", type: "text" },
  ],
  RECYCLE: [
    { key: "recycler_epr_id", label: "Recycler EPR ID", type: "text" },
    { key: "recycling_date", label: "Recycling Date", type: "date" },
    {
      key: "certificate_reference",
      label: "Certificate Reference",
      type: "text",
    },
  ],
};

const PAGE_SIZE = 50;

function SoHBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 60
        ? "bg-amber-500"
        : "bg-red-500";
  const textColor =
    value >= 80
      ? "text-emerald-600"
      : value >= 60
        ? "text-amber-600"
        : "text-red-500";
  return (
    <div className="flex items-center gap-2 min-w-20">
      <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className={`text-xs font-medium tabular-nums ${textColor}`}>
        {value}%
      </span>
    </div>
  );
}

export default function LifecyclePage() {
  const { user } = useAuth();

  // Data
  const [passports, setPassports] = useState<PassportSummary[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);

  // Filters & pagination
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [batchFilter, setBatchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk action modal
  const [bulkAction, setBulkAction] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [evidence, setEvidence] = useState<Record<string, string>>({});

  // Per-row magic link modal
  const [magicLinkPassport, setMagicLinkPassport] =
    useState<PassportSummary | null>(null);

  // Per-row single transition modal
  const [rowAction, setRowAction] = useState<{
    passport: PassportSummary;
    action: string;
  } | null>(null);
  const [rowEvidence, setRowEvidence] = useState<Record<string, string>>({});

  // ─── Fetch batches once for the dropdown ─────────────────────────────────
  useEffect(() => {
    if (!user?.tenant_id) return;
    api
      .get<{ batches: BatchOption[] }>(
        `/batches?tenant_id=${user.tenant_id}&limit=200`,
      )
      .then((res) =>
        setBatches(
          (res.data.batches || [])
            .filter((b: BatchOption) => b.status === "ACTIVE")
            .map((b: BatchOption) => ({
              id: b.id,
              batch_name: b.batch_name,
              status: b.status,
            })),
        ),
      )
      .catch(() => {
        /* non-fatal */
      });
  }, [user?.tenant_id]);

  // ─── Fetch passports ─────────────────────────────────────────────────────
  const fetchPassports = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String((currentPage - 1) * PAGE_SIZE),
        });
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (searchTerm) params.set("search", searchTerm);
        if (batchFilter) params.set("batch_id", batchFilter);
        const res = await api.get(`/passports?${params.toString()}`, {
          signal,
        });
        setPassports(res.data.passports || []);
        setTotalCount(res.data.total ?? 0);
        setStatusCounts(res.data.status_counts ?? {});
      } catch (err) {
        if (axios.isCancel(err)) return;
        toast.error("Failed to load passports");
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchTerm, batchFilter, currentPage],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPassports(controller.signal);
    return () => controller.abort();
  }, [fetchPassports]);

  // ─── Search debounce ─────────────────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchTerm(val);
      setCurrentPage(1);
    }, 300);
  };

  // Reset to page 1 whenever filters change
  const handleStatusFilter = (s: string) => {
    setStatusFilter(s);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const handleBatchFilter = (val: string) => {
    setBatchFilter(val);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  // ─── Selection ───────────────────────────────────────────────────────────
  const toggleSelect = (uuid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === passports.length && passports.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(passports.map((p) => p.uuid)));
    }
  };

  // ─── Bulk action ─────────────────────────────────────────────────────────
  const openBulkModal = (action: string) => {
    setBulkAction(action);
    setEvidence({});
    setShowBulkModal(true);
  };

  const handleBulkTransition = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    const requiredFields = EVIDENCE_FIELDS[bulkAction] || [];
    for (const field of requiredFields) {
      if (!evidence[field.key]?.trim()) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }
    setProcessing(true);
    try {
      const payload: Record<string, unknown> = {
        passport_ids: Array.from(selectedIds),
        action: bulkAction,
      };
      if (requiredFields.length > 0) payload.evidence = evidence;
      await api.post("/passports/bulk/transition", payload);
      toast.success(
        `${selectedIds.size} passport(s) transitioned → ${bulkAction}`,
      );
      setShowBulkModal(false);
      setSelectedIds(new Set());
      setBulkAction("");
      setEvidence({});
      fetchPassports();
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { error?: string } } };
      toast.error(apiErr?.response?.data?.error || "Bulk transition failed");
    } finally {
      setProcessing(false);
    }
  };

  // ─── Per-row single transition ────────────────────────────────────────────
  const handleRowTransition = async () => {
    if (!rowAction) return;
    const requiredFields = EVIDENCE_FIELDS[rowAction.action] || [];
    for (const field of requiredFields) {
      if (!rowEvidence[field.key]?.trim()) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }
    setProcessing(true);
    try {
      const payload: Record<string, unknown> = { action: rowAction.action };
      if (requiredFields.length > 0) payload.evidence = rowEvidence;
      await api.post(
        `/passports/${rowAction.passport.uuid}/transition`,
        payload,
      );
      toast.success(
        `${rowAction.passport.serial_number || rowAction.passport.uuid.slice(0, 8)} → ${rowAction.action}`,
      );
      setRowAction(null);
      setRowEvidence({});
      fetchPassports();
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { error?: string } } };
      toast.error(apiErr?.response?.data?.error || "Transition failed");
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl text-foreground">Lifecycle Operations</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track, transition, and manage battery passports across their
              lifecycle
            </p>
          </div>
          <button
            onClick={() => fetchPassports()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* ── Status Funnel (server-side counts) ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {LIFECYCLE_STATES.slice(1).map((status) => {
            const Icon = STATUS_ICONS[status] || Package;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => handleStatusFilter(isActive ? "ALL" : status)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? "border-foreground bg-muted ring-1 ring-foreground/20"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs font-medium text-muted-foreground truncate">
                    {status.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-lg font-semibold text-foreground tabular-nums">
                  {statusCounts[status] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filter bar ── */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search serial or UUID..."
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Batch filter */}
          <select
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground min-w-45 focus:outline-none focus:ring-1 focus:ring-ring"
            value={batchFilter}
            onChange={(e) => handleBatchFilter(e.target.value)}
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_name}
              </option>
            ))}
          </select>

          {/* Page size info */}
          <span className="text-xs text-muted-foreground ml-auto">
            {totalCount > 0
              ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, totalCount)} of ${totalCount}`
              : "0 passports"}
          </span>
        </div>

        {/* ── Table ── */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : passports.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground text-sm font-medium">
                No passports found
              </p>
              <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
                {statusFilter !== "ALL"
                  ? `No passports with "${statusFilter.replace(/_/g, " ")}" status.`
                  : batchFilter
                    ? "No passports in this batch yet."
                    : "Generate passports from a batch first."}
              </p>
              {statusFilter === "ALL" && !batchFilter && (
                <Link
                  href="/batches"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-medium text-white bg-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Package className="h-4 w-4" />
                  Go to Batches
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-175">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === passports.length &&
                          passports.length > 0
                        }
                        onChange={toggleAll}
                        className="rounded border-border cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Serial
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      SoH
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {passports.map((p) => {
                    const colorClass =
                      STATUS_COLORS[p.status] || STATUS_COLORS.CREATED;
                    const allowedActions = TRANSITIONS[p.status] || [];
                    const isLowSoH =
                      p.state_of_health != null && p.state_of_health < 60;
                    return (
                      <tr
                        key={p.uuid}
                        className={`hover:bg-muted/30 transition-colors ${
                          isLowSoH ? "bg-red-500/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.uuid)}
                            onChange={() => toggleSelect(p.uuid)}
                            className="rounded border-border cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={`/p/${p.uuid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-mono text-blue-500 hover:underline"
                          >
                            {p.serial_number || p.uuid.slice(0, 12) + "…"}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-40 truncate">
                          {p.batch_name || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
                          >
                            {p.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.state_of_health != null ? (
                            <SoHBar value={p.state_of_health} />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {p.updated_at
                            ? new Date(p.updated_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem asChild>
                                <a
                                  href={`/p/${p.uuid}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View passport
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setMagicLinkPassport(p)}
                                className="flex items-center gap-2"
                              >
                                <Key className="h-3.5 w-3.5" />
                                Send magic link
                              </DropdownMenuItem>
                              {allowedActions.length > 0 && (
                                <>
                                  <DropdownMenuSeparator />
                                  {allowedActions.map((action) => (
                                    <DropdownMenuItem
                                      key={action}
                                      onSelect={() => {
                                        setRowAction({ passport: p, action });
                                        setRowEvidence({});
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <ArrowRight className="h-3.5 w-3.5" />
                                      {action.charAt(0) +
                                        action.slice(1).toLowerCase()}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">{currentPage}</span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{totalPages}</span>
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Sticky bulk selection footer ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-background border border-border rounded-full shadow-xl">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {selectedIds.size} selected
          </span>
          <select
            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">Choose action…</option>
            <option value="ACTIVATE">Activate</option>
            <option value="SHIP">Ship</option>
            <option value="INSTALL">Install</option>
            <option value="RECALL">Recall</option>
            <option value="RECYCLE">Recycle</option>
          </select>
          <button
            disabled={!bulkAction}
            onClick={() => bulkAction && openBulkModal(bulkAction)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <ArrowRight className="h-4 w-4" />
            Apply
          </button>
          <button
            onClick={() => {
              setSelectedIds(new Set());
              setBulkAction("");
            }}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Bulk action confirmation modal ── */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirm: {bulkAction} {selectedIds.size} passport
              {selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {(EVIDENCE_FIELDS[bulkAction] || []).map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {field.label}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type={field.type}
                  value={evidence[field.key] || ""}
                  onChange={(e) =>
                    setEvidence((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              This will create an immutable audit event for each of the{" "}
              {selectedIds.size} selected passport
              {selectedIds.size !== 1 ? "s" : ""}.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setShowBulkModal(false)}
              disabled={processing}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkTransition}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Confirm {bulkAction}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Per-row single transition modal ── */}
      <Dialog
        open={!!rowAction}
        onOpenChange={(open) => !open && setRowAction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rowAction?.action}:{" "}
              {rowAction?.passport.serial_number ||
                rowAction?.passport.uuid.slice(0, 12)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {(EVIDENCE_FIELDS[rowAction?.action ?? ""] || []).map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {field.label}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type={field.type}
                  value={rowEvidence[field.key] || ""}
                  onChange={(e) =>
                    setRowEvidence((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
            {(EVIDENCE_FIELDS[rowAction?.action ?? ""] || []).length === 0 && (
              <p className="text-xs text-muted-foreground">
                No additional information required for this transition.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setRowAction(null)}
              disabled={processing}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRowTransition}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Magic link modal ── */}
      {magicLinkPassport && (
        <RequestMagicLinkModal
          passportId={magicLinkPassport.uuid}
          status={magicLinkPassport.status}
          onClose={() => setMagicLinkPassport(null)}
        />
      )}
    </div>
  );
}
