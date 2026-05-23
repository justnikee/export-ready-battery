"use client";

import { useEffect, useState } from "react";
import {
  Search,
  History,
  ChevronRight,
  X,
  Loader2,
  MoreHorizontal,
  ArrowRightLeft,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Passport, PassportEvent, TransitionAction, PassportStatus } from "@/lib/types";
import { TRANSITION_ACTION_LABELS, PASSPORT_STATUS_LABELS } from "@/lib/types";

const TEXTILE_STATUSES: PassportStatus[] = [
  "RAW_MATERIAL",
  "IN_PRODUCTION",
  "FINISHED",
  "SHIPPED",
  "IN_USE",
  "RECYCLED",
];

interface PassportListResponse {
  passports: Passport[];
  total: number;
  status_counts: Record<string, number>;
}

interface TextilePassportOperationsProps {
  selectedBatchId: string | null;
}

export function TextilePassportOperations({
  selectedBatchId,
}: TextilePassportOperationsProps) {
  const { user } = useAuth();

  const [passports, setPassports] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PassportStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 25;

  // Transition modal state
  const [transitionPassport, setTransitionPassport] = useState<Passport | null>(null);
  const [transitionAction, setTransitionAction] = useState<TransitionAction | "">("");
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [allowedActions, setAllowedActions] = useState<TransitionAction[]>([]);
  const [allowedActionsLoading, setAllowedActionsLoading] = useState(false);

  // Event panel state
  const [eventPassport, setEventPassport] = useState<Passport | null>(null);
  const [events, setEvents] = useState<PassportEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchPassports = async () => {
    if (!user?.tenant_id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("tenant_id", user.tenant_id);
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedBatchId) params.set("batch_id", selectedBatchId);

      const res = await api.get<PassportListResponse>(`/passports?${params.toString()}`);
      setPassports(res.data.passports ?? []);
      setStatusCounts(res.data.status_counts ?? {});
      setTotal(res.data.total ?? 0);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        "Failed to load passports";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
  }, [statusFilter, searchQuery, selectedBatchId]);

  useEffect(() => {
    fetchPassports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, selectedBatchId, offset, user?.tenant_id]);

  const fetchAllowedActions = async (uuid: string) => {
    setAllowedActionsLoading(true);
    try {
      const res = await api.get<{ allowed_actions: TransitionAction[] }>(
        `/passports/${uuid}/transitions`
      );
      setAllowedActions(res.data.allowed_actions ?? []);
    } catch {
      setAllowedActions([]);
    } finally {
      setAllowedActionsLoading(false);
    }
  };

  const openTransitionModal = async (passport: Passport) => {
    setTransitionPassport(passport);
    setTransitionAction("");
    setTransitionError(null);
    await fetchAllowedActions(passport.uuid);
  };

  const executeTransition = async () => {
    if (!transitionPassport || !transitionAction) return;
    setTransitionLoading(true);
    setTransitionError(null);
    try {
      await api.post(`/passports/${transitionPassport.uuid}/transition`, {
        action: transitionAction,
      });
      setTransitionPassport(null);
      setTransitionAction("");
      fetchPassports();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (err as Error)?.message ||
        "Transition failed";
      setTransitionError(msg);
    } finally {
      setTransitionLoading(false);
    }
  };

  const openEventPanel = async (passport: Passport) => {
    setEventPassport(passport);
    setEventsLoading(true);
    try {
      const res = await api.get<{ events: PassportEvent[] }>(
        `/passports/${passport.uuid}/events`
      );
      setEvents(res.data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "RAW_MATERIAL":
        return "bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300";
      case "IN_PRODUCTION":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "FINISHED":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300";
      case "SHIPPED":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "IN_USE":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300";
      case "RECYCLED":
        return "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-foreground">
            Passport Operations
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage individual textile passport lifecycle transitions.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {total} passport{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status funnel */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {TEXTILE_STATUSES.map((status) => {
          const count = statusCounts[status] ?? 0;
          const active = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(active ? "" : status)}
              className={`rounded-sm border p-3 text-left transition-colors ${
                active
                  ? "border-cyan-300 bg-cyan-50/40 dark:border-cyan-800 dark:bg-cyan-950/20"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <p className="text-xs text-muted-foreground">
                {PASSPORT_STATUS_LABELS[status] ?? status}
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-sm border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        {statusFilter && (
          <Badge
            variant="secondary"
            className="w-fit cursor-pointer gap-1"
            onClick={() => setStatusFilter("")}
          >
            {PASSPORT_STATUS_LABELS[statusFilter] ?? statusFilter}
            <X className="h-3 w-3" />
          </Badge>
        )}
      </div>

      {/* Passport table */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-sm border border-red-200 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {!loading && !error && passports.length === 0 && (
        <div className="rounded-sm border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">No passports found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusFilter
              ? `No passports in "${PASSPORT_STATUS_LABELS[statusFilter]}" status.`
              : "Generate passports from a lot to see them here."}
          </p>
        </div>
      )}

      {!loading && !error && passports.length > 0 && (
        <>
          <div className="overflow-hidden rounded-sm border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Serial
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Batch
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                    Updated
                  </th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {passports.map((p) => (
                  <tr
                    key={p.uuid}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {p.serial_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(p.batch_snapshot?.batch_name as string | undefined) ?? p.batch_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${statusColor(p.status)}`}
                      >
                        {PASSPORT_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.updated_at
                        ? new Date(p.updated_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEventPanel(p)}
                            className="cursor-pointer"
                          >
                            <History className="mr-2 h-4 w-4" />
                            View Events
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openTransitionModal(p)}
                            className="cursor-pointer"
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Transition
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                {offset + 1} – {Math.min(offset + limit, total)} of {total}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + limit >= total}
                onClick={() => setOffset((o) => o + limit)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Transition Modal */}
      <Dialog
        open={!!transitionPassport}
        onOpenChange={(open) => {
          if (!open) {
            setTransitionPassport(null);
            setTransitionAction("");
            setTransitionError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transition Passport</DialogTitle>
          </DialogHeader>

          {transitionPassport && (
            <div className="space-y-4 py-2">
              <div className="rounded-sm border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Serial</p>
                <p className="text-sm font-medium text-foreground">
                  {transitionPassport.serial_number}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Current Status</p>
                <p className="text-sm font-medium text-foreground">
                  {PASSPORT_STATUS_LABELS[transitionPassport.status] ??
                    transitionPassport.status}
                </p>
              </div>

              {allowedActionsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading allowed actions...
                </div>
              ) : allowedActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No transitions available from this status.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Select Action
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {allowedActions.map((action) => (
                      <button
                        key={action}
                        onClick={() => setTransitionAction(action)}
                        className={`rounded-sm border px-3 py-2 text-left text-sm transition-colors ${
                          transitionAction === action
                            ? "border-cyan-300 bg-cyan-50/40 dark:border-cyan-800 dark:bg-cyan-950/20"
                            : "border-border bg-card hover:bg-muted/50"
                        }`}
                      >
                        {TRANSITION_ACTION_LABELS[action] ?? action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {transitionError && (
                <div className="rounded-sm border border-red-200 bg-red-500/10 p-3 text-sm text-red-500">
                  {transitionError}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransitionPassport(null);
                setTransitionAction("");
                setTransitionError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={executeTransition}
              disabled={!transitionAction || transitionLoading}
            >
              {transitionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Panel */}
      <Sheet
        open={!!eventPassport}
        onOpenChange={(open) => {
          if (!open) setEventPassport(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Event History</SheetTitle>
          </SheetHeader>

          {eventPassport && (
            <div className="mt-4 space-y-4">
              <div className="rounded-sm border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Serial</p>
                <p className="text-sm font-medium text-foreground">
                  {eventPassport.serial_number}
                </p>
              </div>

              {eventsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events recorded.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-sm border border-border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {event.event_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {event.created_at
                            ? new Date(event.created_at).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {event.action}
                      </p>
                      {event.status_from && event.status_to && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {PASSPORT_STATUS_LABELS[event.status_from as PassportStatus] ?? event.status_from}
                          <ChevronRight className="mx-1 inline h-3 w-3" />
                          {PASSPORT_STATUS_LABELS[event.status_to as PassportStatus] ?? event.status_to}
                        </p>
                      )}
                      {event.actor_identifier && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Actor: {event.actor_identifier}
                          {event.actor_role && ` (${event.actor_role})`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
