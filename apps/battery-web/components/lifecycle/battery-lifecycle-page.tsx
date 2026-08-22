"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { isAdminRole } from "@/lib/rbac";
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
import { BatchCombobox } from "@/components/batches/batch-combobox";
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
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardPathFromPathname } from "@/lib/routes";
import { LIFECYCLE_EVIDENCE_FIELDS } from "@/lib/lifecycle-evidence";

interface PassportSummary {
  uuid: string;
  serial_number: string;
  status: string;
  state_of_health: number | null;
  circularity_status?: string;
  batch_name: string;
  updated_at: string;
}


interface BulkAllowedActionsResponse {
  allowed_actions: string[];
}

const STATUS_COLORS: Record<string, string> = {
  CREATED: "bg-muted text-foreground",
  ACTIVE: "bg-blue-500/15 text-blue-500",
  SHIPPED: "bg-amber-500/15 text-amber-500",
  IN_SERVICE: "bg-emerald-500/15 text-emerald-500",
  RECALLED: "bg-red-500/15 text-red-500",
  RECYCLED: "bg-purple-100 text-purple-700",
  REMANUFACTURED: "bg-teal-100 text-teal-700",
  REUSED: "bg-cyan-100 text-cyan-700",
  REPURPOSED: "bg-orange-100 text-orange-700",
  END_OF_LIFE: "bg-muted text-muted-foreground",
};

const STATUS_ICONS: Record<string, typeof Package> = {
  CREATED: Package,
  ACTIVE: Package,
  SHIPPED: Truck,
  IN_SERVICE: Wrench,
  RECALLED: AlertTriangle,
  RECYCLED: Recycle,
  REMANUFACTURED: Wrench,
  REUSED: Package,
  REPURPOSED: Package,
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
  "REMANUFACTURED",
  "REUSED",
  "REPURPOSED",
  "END_OF_LIFE",
];

const EVIDENCE_FIELDS = LIFECYCLE_EVIDENCE_FIELDS;

type MaintenanceAction = "REPAIR" | "REPLACE";

const MAINTENANCE_FIELDS: Record<
  MaintenanceAction,
  { key: string; label: string; type: "text" | "date" | "textarea" }[]
> = {
  REPAIR: [
    { key: "repair_date", label: "Repair Date", type: "date" },
    {
      key: "technician_id",
      label: "Technician / Service ID",
      type: "text",
    },
    {
      key: "component_repaired",
      label: "Component Repaired",
      type: "text",
    },
    { key: "repair_notes", label: "Repair Notes", type: "textarea" },
  ],
  REPLACE: [
    { key: "replacement_date", label: "Replacement Date", type: "date" },
    {
      key: "technician_id",
      label: "Technician / Service ID",
      type: "text",
    },
    {
      key: "component_replaced",
      label: "Component Replaced",
      type: "text",
    },
    {
      key: "replacement_reason",
      label: "Replacement Reason",
      type: "textarea",
    },
    {
      key: "new_component_serial",
      label: "New Component Serial",
      type: "text",
    },
  ],
};

const MAINTENANCE_ENDPOINTS: Record<MaintenanceAction, string> = {
  REPAIR: "repairs",
  REPLACE: "replacements",
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

function LifecycleTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="relative border border-border bg-transparent p-3 space-y-2"
          ><Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="relative border border-border overflow-visible"><div className="border-b border-border bg-muted/60 px-4 py-3">
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[32px_1.4fr_1fr_120px_120px_100px_32px] gap-4 px-4 py-3 items-center"
            >
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LifecyclePage() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);

  // Data
  const [passports, setPassports] = useState<PassportSummary[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [allowedActionsByPassport, setAllowedActionsByPassport] = useState<
    Record<string, string[]>
  >({});
  const [bulkAllowedActions, setBulkAllowedActions] = useState<string[]>([]);
  const [bulkAllowedActionsLoading, setBulkAllowedActionsLoading] =
    useState(false);

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
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkStatusMsg, setBulkStatusMsg] = useState("");
  // Refs for smooth progress animation â€” target driven by async steps
  const progressTargetRef = useRef(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // selectAllMode = user clicked "Select all N passports" banner
  const [selectAllMode, setSelectAllMode] = useState(false);

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

  // Undo last transition (admin-only, 30-minute grace window — enforced server-side)
  const [undoTarget, setUndoTarget] = useState<PassportSummary | null>(null);
  const [undoNote, setUndoNote] = useState("");
  const [undoing, setUndoing] = useState(false);

  const [maintenanceAction, setMaintenanceAction] = useState<{
    passport: PassportSummary;
    action: MaintenanceAction;
  } | null>(null);
  const [maintenanceEvidence, setMaintenanceEvidence] = useState<
    Record<string, string>
  >({});

  // Reason code + admin note for ACTIVATE actions (required by backend)
  const [reasonCode, setReasonCode] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [rowReasonCode, setRowReasonCode] = useState("");
  const [rowAdminNote, setRowAdminNote] = useState("");
  // Document attachment state (per-row modal)
  const [rowDocFile, setRowDocFile] = useState<File | null>(null);
  const [rowDocId, setRowDocId] = useState<string | null>(null);
  const [rowDocLabel, setRowDocLabel] = useState("");
  const [rowDocUploading, setRowDocUploading] = useState(false);
  const [rowDocInfo, setRowDocInfo] = useState<{
    filename: string;
    sha256_hash: string;
  } | null>(null);

  // â”€â”€â”€ Events panel (Phase 6 proof viewer) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  interface PassportEventEntry {
    id: string;
    action: string;
    event_type: string;
    actor_identifier: string;
    actor_role: string;
    status_from: string;
    status_to: string;
    created_at: string;
    metadata?: Record<string, unknown>;
  }
  interface PassportDocument {
    id: string;
    filename: string;
    label: string;
    sha256_hash: string;
    file_url: string;
    uploaded_at: string;
  }
  const [eventsPassport, setEventsPassport] = useState<PassportSummary | null>(
    null,
  );
  const [passportEvents, setPassportEvents] = useState<PassportEventEntry[]>(
    [],
  );
  const [passportDocs, setPassportDocs] = useState<PassportDocument[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [docModalDoc, setDocModalDoc] = useState<PassportDocument | null>(null);

  const openEventsPanel = async (p: PassportSummary) => {
    setEventsPassport(p);
    setEventsLoading(true);
    try {
      const [evRes, docsRes] = await Promise.all([
        api.get(`/passports/${p.uuid}/events`),
        api
          .get(`/passports/${p.uuid}/documents`)
          .catch(() => ({ data: { documents: [] } })),
      ]);
      setPassportEvents(evRes.data.events ?? []);
      setPassportDocs(docsRes.data.documents ?? []);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleExportEPCIS = async (passportUUID: string) => {
    try {
      const res = await api.get(`/passports/${passportUUID}/epcis`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `passport_${passportUUID}_epcis.jsonld`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export EPCIS document");
    }
  };

  // â”€â”€â”€ Fetch passports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // Allowed actions per status come from the backend (the same source the
  // bulk select-all flow already used below) rather than a duplicated local
  // state machine, so role/status rules never drift between the two.
  useEffect(() => {
    if (passports.length === 0) {
      setAllowedActionsByPassport({});
      return;
    }

    const controller = new AbortController();
    const uniqueStatuses = Array.from(new Set(passports.map((p) => p.status)));

    Promise.all(
      uniqueStatuses.map((status) =>
        api
          .get<BulkAllowedActionsResponse>(
            `/passports/bulk/allowed-actions?status=${encodeURIComponent(status)}`,
            { signal: controller.signal },
          )
          .then((res): [string, string[]] => [status, res.data.allowed_actions || []])
          .catch((err): [string, string[]] => {
            if (axios.isCancel(err)) throw err;
            return [status, []];
          }),
      ),
    )
      .then((entries) => {
        const actionsByStatus = new Map(entries);
        const nextAllowedActions = passports.reduce<Record<string, string[]>>(
          (accumulator, passport) => {
            accumulator[passport.uuid] = actionsByStatus.get(passport.status) || [];
            return accumulator;
          },
          {},
        );
        setAllowedActionsByPassport(nextAllowedActions);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
      });

    return () => controller.abort();
  }, [passports]);

  useEffect(() => {
    if (!selectAllMode) {
      setBulkAllowedActions([]);
      setBulkAllowedActionsLoading(false);
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (searchTerm) params.set("search", searchTerm);
    if (batchFilter) params.set("batch_id", batchFilter);

    setBulkAllowedActions([]);
    setBulkAllowedActionsLoading(true);

    api
      .get<BulkAllowedActionsResponse>(
        `/passports/bulk/allowed-actions?${params.toString()}`,
        { signal: controller.signal },
      )
      .then((res) => {
        setBulkAllowedActions(res.data.allowed_actions || []);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setBulkAllowedActions([]);
        toast.error("Failed to resolve bulk actions");
      })
      .finally(() => {
        setBulkAllowedActionsLoading(false);
      });

    return () => controller.abort();
  }, [selectAllMode, statusFilter, searchTerm, batchFilter]);

  // â”€â”€â”€ Search debounce â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearchTerm(val);
      setCurrentPage(1);
      setSelectedIds(new Set());
      setSelectAllMode(false);
    }, 300);
  };

  // Reset to page 1 whenever filters change
  const handleStatusFilter = (s: string) => {
    setStatusFilter(s);
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSelectAllMode(false);
  };

  const handleBatchFilter = (val: string) => {
    setBatchFilter(val);
    setCurrentPage(1);
    setSelectedIds(new Set());
    setSelectAllMode(false);
  };

  // â”€â”€â”€ Selection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleSelect = (uuid: string) => {
    // Deselecting any individual item exits selectAllMode
    if (selectedIds.has(uuid)) setSelectAllMode(false);
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
      setSelectAllMode(false);
    } else {
      setSelectedIds(new Set(passports.map((p) => p.uuid)));
      setSelectAllMode(false); // page-level select; banner prompts for cross-page
    }
  };

  // â”€â”€â”€ Bulk action â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openBulkModal = (action: string) => {
    setBulkAction(action);
    setEvidence({});
    setReasonCode("");
    setAdminNote("");
    setShowBulkModal(true);
  };

  const handleBulkTransition = async () => {
    if (!bulkAction || (selectedIds.size === 0 && !selectAllMode)) return;
    const requiredFields = EVIDENCE_FIELDS[bulkAction] || [];
    for (const field of requiredFields) {
      if (!evidence[field.key]?.trim()) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }
    // ACTIVATE always requires a reason code
    if (bulkAction === "ACTIVATE" && !reasonCode.trim()) {
      toast.error("Reason code is required for ACTIVATE");
      return;
    }

    // â”€â”€ Smooth progress animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // An interval ticks the displayed value toward progressTargetRef at a
    // decelerating rate, so even single-chunk jobs show a visible sweep.
    const setTarget = (t: number, msg?: string) => {
      progressTargetRef.current = t;
      if (msg !== undefined) setBulkStatusMsg(msg);
    };

    setBulkProgress(0);
    setBulkStatusMsg("");
    progressTargetRef.current = 0;
    setProcessing(true);

    progressTimerRef.current = setInterval(() => {
      setBulkProgress((prev) => {
        const t = progressTargetRef.current;
        if (prev >= t) return prev;
        // Ease-out: large steps early, smaller as we approach the target
        const step = Math.max(1, Math.ceil((t - prev) / 7));
        return Math.min(t, prev + step);
      });
    }, 80);

    try {
      setTarget(10, "Preparing\u2026");

      const payload: Record<string, unknown> = { action: bulkAction };
      if (requiredFields.length > 0) payload.evidence = evidence;
      if (reasonCode.trim()) payload.reason_code = reasonCode.trim();
      if (adminNote.trim()) payload.admin_note = adminNote.trim();

      const actionLabel =
        bulkAction.charAt(0) + bulkAction.slice(1).toLowerCase();

      if (selectAllMode) {
        setTarget(30, "Resolving filtered passportsâ€¦");
        const res = await api.post("/passports/bulk/transition", {
          ...payload,
          select_all: true,
          batch_id: batchFilter || undefined,
          state_filter: statusFilter !== "ALL" ? statusFilter : undefined,
          search_query: searchTerm || undefined,
          strict: true,
        });

        const succeeded: number = res.data.succeeded ?? 0;
        const failed: number = res.data.failed ?? 0;
        const doneMsg =
          failed > 0
            ? `Done â€” ${succeeded} transitioned, ${failed} failed`
            : `${succeeded.toLocaleString()} passport${succeeded !== 1 ? "s" : ""} ${actionLabel}d ✓`;
        setTarget(100, doneMsg);

        await new Promise((r) => setTimeout(r, 800));

        if (failed > 0) {
          toast.warning(
            res.data.message || `${succeeded} transitioned, ${failed} failed`,
          );
        } else {
          toast.success(`${succeeded} passport(s) â†’ ${bulkAction}`);
        }
        setShowBulkModal(false);
        setSelectedIds(new Set());
        setSelectAllMode(false);
        setBulkAction("");
        setEvidence({});
        setReasonCode("");
        setAdminNote("");
        setBulkProgress(0);
        setBulkStatusMsg("");
        fetchPassports();
        return;
      }

      // â”€â”€ Standard path: fetch explicit IDs then chunk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const idsToProcess = Array.from(selectedIds);

      setTarget(30);
      const CHUNK_SIZE = 500;
      const totalChunks = Math.ceil(idsToProcess.length / CHUNK_SIZE);
      let totalSucceeded = 0;
      let totalFailed = 0;

      for (let i = 0; i < idsToProcess.length; i += CHUNK_SIZE) {
        const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
        setTarget(
          30 + Math.round((chunkIndex / totalChunks) * 60), // 30 â†’ 90
          totalChunks > 1
            ? `Applying ${actionLabel}\u2026 (${chunkIndex} of ${totalChunks})`
            : `Applying ${actionLabel}\u2026`,
        );

        const chunk = idsToProcess.slice(i, i + CHUNK_SIZE);
        const res = await api.post("/passports/bulk/transition", {
          ...payload,
          passport_ids: chunk,
        });
        totalSucceeded += res.data.succeeded ?? chunk.length;
        totalFailed += res.data.failed ?? 0;

        // Bump slightly above the pre-call target once the chunk returns
        setTarget(30 + Math.round((chunkIndex / totalChunks) * 65)); // up to 95
      }

      // Mark complete and let bar fill to 100 before closing
      const doneMsg =
        totalFailed > 0
          ? `Done \u2014 ${totalSucceeded} transitioned, ${totalFailed} failed`
          : `${totalSucceeded.toLocaleString()} passport${totalSucceeded !== 1 ? "s" : ""} ${actionLabel}d \u2713`;
      setTarget(100, doneMsg);

      // Hold "done" state briefly so user sees it
      await new Promise((r) => setTimeout(r, 800));

      if (totalFailed > 0) {
        toast.warning(`${totalSucceeded} transitioned, ${totalFailed} failed`);
      } else {
        toast.success(`${totalSucceeded} passport(s) \u2192 ${bulkAction}`);
      }
      setShowBulkModal(false);
      setSelectedIds(new Set());
      setSelectAllMode(false);
      setBulkAction("");
      setEvidence({});
      setReasonCode("");
      setAdminNote("");
      setBulkProgress(0);
      setBulkStatusMsg("");
      fetchPassports();
    } catch (error: unknown) {
      const apiErr = error as {
        response?: {
          status?: number;
          data?: {
            error?: string;
            message?: string;
            failed?: number;
            total?: number;
          };
        };
      };
      if (apiErr?.response?.status === 409) {
        toast.error(
          apiErr.response.data?.message ||
            `Bulk ${bulkAction.toLowerCase()} blocked before execution`,
        );
      } else {
        toast.error(apiErr?.response?.data?.error || "Bulk transition failed");
      }
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setProcessing(false);
    }
  };

  // â”€â”€â”€ Per-row single transition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleRowTransition = async () => {
    if (!rowAction) return;
    const requiredFields = EVIDENCE_FIELDS[rowAction.action] || [];
    for (const field of requiredFields) {
      if (!rowEvidence[field.key]?.trim()) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }
    // ACTIVATE always requires a reason code
    if (rowAction.action === "ACTIVATE" && !rowReasonCode.trim()) {
      toast.error("Reason code is required for ACTIVATE");
      return;
    }
    setProcessing(true);
    try {
      // Capture GPS for field actions â€” best-effort, never blocks transition
      let location: {
        lat: number;
        lng: number;
        accuracy_meters: number;
      } | null = null;
      if (
        ["INSTALL", "SHIP"].includes(rowAction.action) &&
        "geolocation" in navigator
      ) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 8000,
                maximumAge: 60000,
                enableHighAccuracy: true,
              });
            },
          );
          location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy_meters: pos.coords.accuracy,
          };
        } catch {
          toast.warning(
            "Location not captured â€” audit record will note this",
          );
        }
      }

      const payload: Record<string, unknown> = { action: rowAction.action };
      if (requiredFields.length > 0) payload.evidence = rowEvidence;
      if (rowReasonCode.trim()) payload.reason_code = rowReasonCode.trim();
      if (rowAdminNote.trim()) payload.admin_note = rowAdminNote.trim();
      if (rowDocId) payload.document_id = rowDocId;
      if (location) payload.location = location;
      await api.post(
        `/passports/${rowAction.passport.uuid}/transition`,
        payload,
      );
      toast.success(
        `${rowAction.passport.serial_number || rowAction.passport.uuid.slice(0, 8)} â†’ ${rowAction.action}`,
      );
      setRowAction(null);
      setRowEvidence({});
      setRowReasonCode("");
      setRowAdminNote("");
      setRowDocFile(null);
      setRowDocId(null);
      setRowDocLabel("");
      setRowDocInfo(null);
      fetchPassports();
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { error?: string } } };
      toast.error(apiErr?.response?.data?.error || "Transition failed");
    } finally {
      setProcessing(false);
    }
  };

  // ─── Undo last transition ──────────────────────────────────────────────
  const handleUndoTransition = async () => {
    if (!undoTarget) return;
    if (!undoNote.trim()) {
      toast.error("Admin note is required");
      return;
    }
    setUndoing(true);
    try {
      await api.post(`/passports/${undoTarget.uuid}/undo-transition`, {
        admin_note: undoNote.trim(),
      });
      toast.success(
        `Undid last transition for ${undoTarget.serial_number || undoTarget.uuid.slice(0, 8)}`,
      );
      setUndoTarget(null);
      setUndoNote("");
      fetchPassports();
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { error?: string } } };
      toast.error(apiErr?.response?.data?.error || "Failed to undo transition");
    } finally {
      setUndoing(false);
    }
  };

  const handleMaintenanceEvent = async () => {
    if (!maintenanceAction) return;

    const requiredFields = MAINTENANCE_FIELDS[maintenanceAction.action] || [];
    for (const field of requiredFields) {
      if (!maintenanceEvidence[field.key]?.trim()) {
        toast.error(`"${field.label}" is required`);
        return;
      }
    }

    setProcessing(true);
    try {
      await api.post(
        `/passports/${maintenanceAction.passport.uuid}/${MAINTENANCE_ENDPOINTS[maintenanceAction.action]}`,
        maintenanceEvidence,
      );
      toast.success(
        `${maintenanceAction.passport.serial_number || maintenanceAction.passport.uuid.slice(0, 8)} â†’ ${maintenanceAction.action}`,
      );
      const refreshedPassport = maintenanceAction.passport;
      setMaintenanceAction(null);
      setMaintenanceEvidence({});
      fetchPassports();
      if (eventsPassport?.uuid === refreshedPassport.uuid) {
        openEventsPanel(refreshedPassport);
      }
    } catch (error: unknown) {
      const apiErr = error as { response?: { data?: { error?: string } } };
      toast.error(apiErr?.response?.data?.error || "Maintenance event failed");
    } finally {
      setProcessing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // True when every passport on the current page is checked
  const allPageSelected =
    selectedIds.size === passports.length && passports.length > 0;
  // The count shown in modals/footer: total dataset if in selectAllMode, else page selection
  const effectiveCount = selectAllMode ? totalCount : selectedIds.size;
  const selectedVisiblePassports = passports.filter((passport) =>
    selectedIds.has(passport.uuid),
  );
  const bulkActionOptions = selectAllMode
    ? bulkAllowedActions
    : selectedVisiblePassports.reduce<string[]>(
        (intersection, passport, index) => {
          const allowedActions = allowedActionsByPassport[passport.uuid] || [];
          if (index === 0) return [...allowedActions];
          return intersection.filter((action) =>
            allowedActions.includes(action),
          );
        },
        [],
      );

  useEffect(() => {
    if (bulkAction && !bulkActionOptions.includes(bulkAction)) {
      setBulkAction("");
    }
  }, [bulkAction, bulkActionOptions]);

  return (
    <div className="min-h-screen bg-sidebar pb-24">
      <div className="mx-auto px-6 py-6 space-y-5">
        {/* â”€â”€ Header â”€â”€ */}
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
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-muted hover:bg-accent transition-colors text-muted-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* â”€â”€ Status Funnel (server-side counts) â”€â”€ */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {LIFECYCLE_STATES.slice(1).map((status) => {
            const Icon = STATUS_ICONS[status] || Package;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`p-3 rounded-md text-left transition-all ${
                  isActive
                    ? "bg-muted ring-1 ring-foreground/20"
                    : "bg-muted/50 hover:bg-muted"
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

        {/* â”€â”€ Filter bar â”€â”€ */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search serial or UUID..."
              className="w-full pl-9 pr-4 py-2 border border-border text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Batch filter */}
          <BatchCombobox
            value={batchFilter}
            onChange={handleBatchFilter}
            status="ACTIVE"
            allOptionLabel="All Batches"
          />

          {statusFilter !== "ALL" && (
            <button
              onClick={() => handleStatusFilter("ALL")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-muted hover:bg-accent transition-colors text-foreground"
            >
              <span>Status: {statusFilter.replace(/_/g, " ")}</span>
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}

          {/* Page size info */}
          <span className="text-xs text-muted-foreground ml-auto">
            {totalCount > 0
              ? `${(currentPage - 1) * PAGE_SIZE + 1}â€“${Math.min(currentPage * PAGE_SIZE, totalCount)} of ${totalCount}`
              : "0 passports"}
          </span>
        </div>

        {/* â”€â”€ Table â”€â”€ */}
        <div className="relative bg-muted rounded-md overflow-visible">{loading ? (
            <LifecycleTableSkeleton />
          ) : passports.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground text-sm font-medium">
                No passports found
              </p>
              <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">
                {statusFilter !== "ALL"
                  ? `No passports with ${statusFilter.replace(/_/g, " ")} status.`
                  : batchFilter
                    ? "No passports in this batch yet."
                    : "Generate passports from a batch first."}
              </p>
              {statusFilter === "ALL" && !batchFilter && (
                <Link
                  href={dashboardPathFromPathname(pathname, "batches")}
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-medium text-white bg-foreground hover:opacity-90 transition-opacity"
                >
                  <Package className="h-4 w-4" />
                  Go to Batches
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* â”€â”€ Gmail-style cross-page select-all banner â”€â”€ */}
              {allPageSelected && totalCount > passports.length && (
                <div className="border-b border-border bg-blue-500/8 px-4 py-2.5 flex items-center gap-2 text-sm">
                  {selectAllMode ? (
                    <>
                      <span className="text-foreground">
                        All <strong>{totalCount.toLocaleString()}</strong>{" "}
                        passports are selected.
                      </span>
                      <button
                        onClick={() => {
                          setSelectAllMode(false);
                          setSelectedIds(new Set());
                        }}
                        className="text-blue-500 hover:underline font-medium ml-1"
                      >
                        Clear selection
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground">
                        All{" "}
                        <strong className="text-foreground">
                          {passports.length}
                        </strong>{" "}
                        passports on this page are selected.
                      </span>
                      <button
                        onClick={() => setSelectAllMode(true)}
                        className="text-blue-500 hover:underline font-medium ml-1"
                      >
                        Select all {totalCount.toLocaleString()} passports
                      </button>
                    </>
                  )}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-175">
                  <thead className="bg-background border-b border-border">
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
                        Circularity
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
                      const allowedActions =
                        allowedActionsByPassport[p.uuid] || [];
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
                              {p.serial_number || p.uuid.slice(0, 12) + "â€¦"}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-40 truncate">
                            {p.batch_name || "â€”"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
                            >
                              {p.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.circularity_status ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                {p.circularity_status.replace(/_/g, " ")}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                â€”
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {p.state_of_health != null ? (
                              <SoHBar value={p.state_of_health} />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                â€”
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {p.updated_at
                              ? new Date(p.updated_at).toLocaleDateString()
                              : "â€”"}
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button aria-label="Passport actions" className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
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
                                <DropdownMenuItem
                                  onSelect={() => handleExportEPCIS(p.uuid)}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Export EPCIS
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => openEventsPanel(p)}
                                  className="flex items-center gap-2"
                                >
                                  <Search className="h-3.5 w-3.5" />
                                  View events
                                </DropdownMenuItem>
                                {isAdmin && p.status !== "CREATED" && (
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setUndoTarget(p);
                                      setUndoNote("");
                                    }}
                                    className="flex items-center gap-2 text-amber-600 focus:text-amber-600"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Undo last transition
                                  </DropdownMenuItem>
                                )}
                                {p.status === "IN_SERVICE" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        setMaintenanceAction({
                                          passport: p,
                                          action: "REPAIR",
                                        });
                                        setMaintenanceEvidence({
                                          repair_date: new Date()
                                            .toISOString()
                                            .slice(0, 10),
                                        });
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <Wrench className="h-3.5 w-3.5" />
                                      Log repair
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onSelect={() => {
                                        setMaintenanceAction({
                                          passport: p,
                                          action: "REPLACE",
                                        });
                                        setMaintenanceEvidence({
                                          replacement_date: new Date()
                                            .toISOString()
                                            .slice(0, 10),
                                        });
                                      }}
                                      className="flex items-center gap-2"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" />
                                      Log replacement
                                    </DropdownMenuItem>
                                  </>
                                )}
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
            </>
          )}
        </div>

        {/* â”€â”€ Pagination â”€â”€ */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-muted hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
              className="flex items-center gap-1 px-3 py-2 rounded-md bg-muted hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* â”€â”€ Sticky bulk selection footer â”€â”€ */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-card rounded-full shadow-xl">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {effectiveCount.toLocaleString()} selected
          </span>
          <select
            className="border border-border px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">
              {bulkAllowedActionsLoading
                ? "Loading actionsâ€¦"
                : "Choose actionâ€¦"}
            </option>
            {bulkActionOptions.map((action) => (
              <option key={action} value={action}>
                {action.charAt(0) + action.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button
            disabled={!bulkAction || bulkAllowedActionsLoading}
            onClick={() => bulkAction && openBulkModal(bulkAction)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <ArrowRight className="h-4 w-4" />
            Apply
          </button>
          <button
            onClick={() => {
              setSelectedIds(new Set());
              setSelectAllMode(false);
              setBulkAction("");
            }}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* â”€â”€ Bulk action confirmation modal â”€â”€ */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirm: {bulkAction} {effectiveCount.toLocaleString()} passport
              {effectiveCount !== 1 ? "s" : ""}
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
                  className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
            {bulkAction === "ACTIVATE" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Reason Code
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BATCH_QC_PASS, MANUAL_OVERRIDE"
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Admin Note
                    <span className="text-muted-foreground ml-1">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Optional free-text note (max 500 chars)"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground pt-1">
              This will create an immutable audit event for each of the{" "}
              {effectiveCount.toLocaleString()} selected passport
              {effectiveCount !== 1 ? "s" : ""}.
            </p>
          </div>

          {/* Progress bar â€” visible only while processing */}
          {processing && (
            <div className="space-y-1.5 px-1 pb-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground truncate">
                  {bulkStatusMsg || "Working\u2026"}
                </span>
                <span className="text-xs font-medium tabular-nums text-foreground shrink-0">
                  {bulkProgress}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    bulkProgress >= 100 ? "bg-emerald-500" : "bg-foreground"
                  }`}
                  style={{ width: `${bulkProgress}%` }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <button
              onClick={() => setShowBulkModal(false)}
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkTransition}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {!processing && <ArrowRight className="h-4 w-4" />}
              {processing ? "Working\u2026" : `Confirm ${bulkAction}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Per-row single transition modal â”€â”€ */}
      <Dialog
        open={!!rowAction}
        onOpenChange={(open) => {
          if (!open) {
            setRowAction(null);
            setRowEvidence({});
            setRowReasonCode("");
            setRowAdminNote("");
            setRowDocFile(null);
            setRowDocId(null);
            setRowDocLabel("");
            setRowDocInfo(null);
          }
        }}
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
                  className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            ))}
            {rowAction?.action === "ACTIVATE" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Reason Code
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BATCH_QC_PASS, MANUAL_OVERRIDE"
                    value={rowReasonCode}
                    onChange={(e) => setRowReasonCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Admin Note
                    <span className="text-muted-foreground ml-1">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    placeholder="Optional free-text note (max 500 chars)"
                    value={rowAdminNote}
                    onChange={(e) => setRowAdminNote(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              </>
            )}
            {(EVIDENCE_FIELDS[rowAction?.action ?? ""] || []).length === 0 &&
              rowAction?.action !== "ACTIVATE" && (
                <p className="text-xs text-muted-foreground">
                  No additional information required for this transition.
                </p>
              )}
            {/* Document attachment (optional) for evidence-bearing actions */}
            {["SHIP", "INSTALL", "RECYCLE", "RECALL", "REMANUFACTURE", "REUSE", "REPURPOSE"].includes(
              rowAction?.action ?? "",
            ) && (
              <div className="space-y-1 border-t border-border pt-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Supporting document
                  <span className="text-muted-foreground ml-1">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Label (e.g. Bill of Lading)"
                    value={rowDocLabel}
                    onChange={(e) => setRowDocLabel(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.tiff"
                    id="row-doc-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error("File too large (max 10 MiB)");
                        return;
                      }
                      setRowDocFile(file);
                      setRowDocId(null);
                      setRowDocInfo(null);
                      setRowDocUploading(true);
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("passport_id", rowAction!.passport.uuid);
                        if (rowDocLabel.trim())
                          form.append("label", rowDocLabel.trim());
                        const res = await api.post<{
                          document_id: string;
                          sha256_hash: string;
                          filename: string;
                        }>("/documents/upload", form);
                        setRowDocId(res.data.document_id);
                        setRowDocInfo({
                          filename: res.data.filename,
                          sha256_hash: res.data.sha256_hash,
                        });
                        toast.success("Document uploaded");
                      } catch {
                        toast.error("Document upload failed");
                        setRowDocFile(null);
                      } finally {
                        setRowDocUploading(false);
                      }
                    }}
                  />
                  <label
                    htmlFor="row-doc-upload"
                    className="cursor-pointer px-3 py-2 text-xs border border-border hover:bg-muted transition-colors"
                  >
                    {rowDocUploading
                      ? "Uploadingâ€¦"
                      : rowDocFile
                        ? "Change file"
                        : "Choose file"}
                  </label>
                  {rowDocInfo && (
                    <span
                      className="text-xs text-muted-foreground truncate max-w-35"
                      title={rowDocInfo.sha256_hash}
                    >
                      {rowDocInfo.filename} ✓
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => setRowAction(null)}
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRowTransition}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
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

      <Dialog
        open={!!undoTarget}
        onOpenChange={(open) => {
          if (!open) {
            setUndoTarget(null);
            setUndoNote("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Undo last transition:{" "}
              {undoTarget?.serial_number || undoTarget?.uuid.slice(0, 12)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              This reverts the passport to its status before the most recent
              transition. Only allowed within 30 minutes of that transition.
              The original event is kept — a new REVERSE_TRANSITION audit
              event is appended, not a deletion.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Admin Note <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                maxLength={500}
                placeholder="Why is this being undone? (required, max 500 chars)"
                value={undoNote}
                onChange={(e) => setUndoNote(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setUndoTarget(null);
                setUndoNote("");
              }}
              className="px-3 py-1.5 text-sm rounded-md bg-muted hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUndoTransition}
              disabled={undoing || !undoNote.trim()}
              className="px-3 py-1.5 text-sm bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50 flex items-center gap-1.5"
            >
              {undoing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Undo Transition
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!maintenanceAction}
        onOpenChange={(open) => {
          if (!open) {
            setMaintenanceAction(null);
            setMaintenanceEvidence({});
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {maintenanceAction?.action === "REPAIR"
                ? "Log repair"
                : "Log replacement"}
              :{" "}
              {maintenanceAction?.passport.serial_number ||
                maintenanceAction?.passport.uuid.slice(0, 12)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {(maintenanceAction
              ? MAINTENANCE_FIELDS[maintenanceAction.action]
              : []
            ).map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {field.label}
                  {field.key !== "new_component_serial" && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={maintenanceEvidence[field.key] || ""}
                    onChange={(e) =>
                      setMaintenanceEvidence((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                ) : (
                  <input
                    type={field.type}
                    value={maintenanceEvidence[field.key] || ""}
                    onChange={(e) =>
                      setMaintenanceEvidence((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              This logs a tamper-evident maintenance event without changing the
              passport lifecycle status.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <button
              onClick={() => {
                setMaintenanceAction(null);
                setMaintenanceEvidence({});
              }}
              disabled={processing}
              className="px-4 py-2 text-sm rounded-md bg-muted hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMaintenanceEvent}
              disabled={processing}
              className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : maintenanceAction?.action === "REPAIR" ? (
                <Wrench className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Magic link modal â”€â”€ */}
      {magicLinkPassport && (
        <RequestMagicLinkModal
          passportId={magicLinkPassport.uuid}
          status={magicLinkPassport.status}
          onClose={() => setMagicLinkPassport(null)}
        />
      )}

      {/* â”€â”€ Phase 6: Events panel / Proof Viewer â”€â”€ */}
      <Dialog
        open={!!eventsPassport}
        onOpenChange={(o) => {
          if (!o) setEventsPassport(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lifecycle events â€” {eventsPassport?.serial_number}
            </DialogTitle>
          </DialogHeader>
          {eventsLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="relative bg-muted rounded-md p-4 space-y-3"
                ><div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {passportEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No events recorded yet.
                </p>
              )}
              {passportEvents.map((ev) => {
                const meta = ev.metadata ?? {};
                const lat = meta.lat as number | undefined;
                const lng = meta.lng as number | undefined;
                const reasonCode = meta.reason_code as string | undefined;
                const adminNote = meta.admin_note as string | undefined;
                const docId = meta.document_id as string | undefined;
                const attachedDoc = docId
                  ? passportDocs.find((d) => d.id === docId)
                  : undefined;

                return (
                  <div key={ev.id} className="border p-3 space-y-1.5 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {ev.action || ev.event_type}
                        </span>
                        {ev.status_from && ev.status_to && (
                          <span className="text-muted-foreground text-xs">
                            {ev.status_from} â†’ {ev.status_to}
                          </span>
                        )}
                        {reasonCode && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                            {reasonCode}
                          </span>
                        )}
                        {attachedDoc && (
                          <button
                            onClick={() => setDocModalDoc(attachedDoc)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            title={attachedDoc.filename}
                          >
                            📎 {attachedDoc.label || attachedDoc.filename}
                          </button>
                        )}
                        {lat !== undefined && lng !== undefined && (
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=13`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                          >
                            📍 GPS
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>
                    {(ev.actor_identifier || ev.actor_role) && (
                      <p className="text-xs text-muted-foreground">
                        by {ev.actor_identifier}
                        {ev.actor_role ? ` (${ev.actor_role})` : ""}
                      </p>
                    )}
                    {adminNote && (
                      <p className="text-xs text-muted-foreground italic">
                        &quot;{adminNote}&quot;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* â”€â”€ Phase 6: Document detail modal â”€â”€ */}
      <Dialog
        open={!!docModalDoc}
        onOpenChange={(o) => {
          if (!o) setDocModalDoc(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Attached Document</DialogTitle>
          </DialogHeader>
          {docModalDoc && (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Filename</span>
                <p className="font-medium">{docModalDoc.filename}</p>
              </div>
              {docModalDoc.label && (
                <div>
                  <span className="text-muted-foreground">Label</span>
                  <p>{docModalDoc.label}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">SHA-256</span>
                <p className="font-mono text-xs break-all">
                  {docModalDoc.sha256_hash}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Uploaded</span>
                <p>{new Date(docModalDoc.uploaded_at).toLocaleString()}</p>
              </div>
              {docModalDoc.file_url && (
                <a
                  href={docModalDoc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              )}
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setDocModalDoc(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
