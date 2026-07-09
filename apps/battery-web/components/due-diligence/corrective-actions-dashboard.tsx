"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MoreHorizontal,
  Wrench,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Filter,
} from "lucide-react";
import { useCorrectiveActions, useUpdateCAStatus, type CorrectiveAction } from "@/hooks/use-queries";

const ITEMS_PER_PAGE = 25;

const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
const STATUS_ORDER = { open: 1, escalated: 2, remediated: 3, verified: 4, closed: 5 };

interface CorrectiveActionsDashboardProps {
  /** When set, scopes the list to one supplier and renders compactly without the page chrome. */
  supplierId?: string;
}

export default function CorrectiveActionsDashboard({ supplierId }: CorrectiveActionsDashboardProps = {}) {
  const embedded = !!supplierId;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const statusParam = statusFilter === "all" ? undefined : statusFilter;
  const { data: actions = [], isLoading } = useCorrectiveActions(statusParam);
  const updateStatus = useUpdateCAStatus();

  const filtered = useMemo(() => {
    let list = [...actions];
    if (supplierId) {
      list = list.filter((a) => a.supplier_id === supplierId);
    }
    if (severityFilter !== "all") {
      list = list.filter((a) => a.severity === severityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.supplier_id.toLowerCase().includes(q)
      );
    }
    // Sort by severity desc, then status, then due date
    list.sort((a, b) => {
      const sevDiff =
        (SEVERITY_ORDER[b.severity as keyof typeof SEVERITY_ORDER] || 0) -
        (SEVERITY_ORDER[a.severity as keyof typeof SEVERITY_ORDER] || 0);
      if (sevDiff !== 0) return sevDiff;
      const statDiff =
        (STATUS_ORDER[a.status as keyof typeof STATUS_ORDER] || 0) -
        (STATUS_ORDER[b.status as keyof typeof STATUS_ORDER] || 0);
      if (statDiff !== 0) return statDiff;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    return list;
  }, [actions, supplierId, severityFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const severityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      low: "bg-blue-500/10 text-blue-600 border-blue-200",
      medium: "bg-amber-500/10 text-amber-600 border-amber-200",
      high: "bg-orange-500/10 text-orange-600 border-orange-200",
      critical: "bg-red-500/10 text-red-600 border-red-200",
    };
    return (
      <Badge variant="outline" className={`text-xs capitalize ${styles[severity] || ""}`}>
        {severity}
      </Badge>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-amber-500/10 text-amber-600 border-amber-200",
      remediated: "bg-blue-500/10 text-blue-600 border-blue-200",
      verified: "bg-green-500/10 text-green-600 border-green-200",
      escalated: "bg-red-500/10 text-red-600 border-red-200",
      closed: "bg-gray-500/10 text-gray-600 border-gray-200",
    };
    return (
      <Badge variant="outline" className={`text-xs capitalize ${styles[status] || ""}`}>
        {status}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  return (
    <div className={embedded ? "space-y-3" : "min-h-screen bg-background p-6 w-full mx-auto space-y-6"}>
      {/* Header */}
      {embedded ? (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Corrective Actions</h3>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} total
          </Badge>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Corrective Actions</h2>
            <p className="text-sm text-muted-foreground">
              Track and manage remediation tickets from OECD due diligence failures
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {filtered.length} total
          </Badge>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!embedded && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, or supplier..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
        )}
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 pl-8 pr-6 text-sm border rounded-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="remediated">Remediated</option>
              <option value="verified">Verified</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={severityFilter}
              onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
              className="h-9 pl-8 pr-6 text-sm border rounded-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Title</TableHead>
              {!embedded && <TableHead>Supplier</TableHead>}
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={embedded ? 5 : 6} className="text-center py-8 text-sm text-muted-foreground">
                  Loading corrective actions...
                </TableCell>
              </TableRow>
            ) : paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={embedded ? 5 : 6} className="text-center py-8 text-sm text-muted-foreground">
                  {actions.length === 0
                    ? "No corrective actions yet. They are auto-created when an OECD due diligence step fails."
                    : "No matching corrective actions for the current filters."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((ca) => (
                <TableRow key={ca.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{ca.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{ca.description}</div>
                    </div>
                  </TableCell>
                  {!embedded && (
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {ca.supplier_id.slice(0, 8)}...
                    </TableCell>
                  )}
                  <TableCell>{severityBadge(ca.severity)}</TableCell>
                  <TableCell>{statusBadge(ca.status)}</TableCell>
                  <TableCell>
                    <div className={`text-sm ${isOverdue(ca.due_date) && ca.status === "open" ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      {new Date(ca.due_date).toLocaleDateString()}
                      {isOverdue(ca.due_date) && ca.status === "open" && (
                        <span className="ml-1 text-xs">(overdue)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ca.status === "open" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(ca.id, "remediated")}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-blue-600" />
                            Mark Remediated
                          </DropdownMenuItem>
                        )}
                        {ca.status === "remediated" && (
                          <DropdownMenuItem onClick={() => handleStatusChange(ca.id, "verified")}>
                            <ShieldCheck className="w-4 h-4 mr-2 text-green-600" />
                            Verify
                          </DropdownMenuItem>
                        )}
                        {(ca.status === "open" || ca.status === "remediated") && (
                          <DropdownMenuItem onClick={() => handleStatusChange(ca.id, "escalated")}>
                            <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                            Escalate
                          </DropdownMenuItem>
                        )}
                        {(ca.status === "verified" || ca.status === "escalated") && (
                          <DropdownMenuItem onClick={() => handleStatusChange(ca.id, "closed")}>
                            <XCircle className="w-4 h-4 mr-2 text-gray-600" />
                            Close
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} ({filtered.length} total)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
