"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Landmark, Plus, Loader2, Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import DGFTClaimFormDialog from "./dgft-claim-form-dialog";
import DGFTClaimDetail from "./dgft-claim-detail";

interface DGFTClaim {
  id: string;
  scheme_type: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  claim_period_start: string;
  claim_period_end: string;
  hsn_code?: string;
  destination_country?: string;
  export_value_inr: number;
  export_quantity: number;
  estimated_claim_amount: number;
  approved_claim_amount?: number;
  dgft_reference_no?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-600 border-gray-200",
  SUBMITTED: "bg-blue-500/10 text-blue-600 border-blue-200",
  APPROVED: "bg-green-500/10 text-green-600 border-green-200",
  REJECTED: "bg-red-500/10 text-red-600 border-red-200",
};

export default function DGFTClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<DGFTClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [schemeFilter, setSchemeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<DGFTClaim | null>(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (schemeFilter) params.set("scheme_type", schemeFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("page_size", String(pageSize));

      const res = await api.get(`/dgft-claims?${params.toString()}`);
      setClaims(res.data.claims || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load DGFT claims");
    } finally {
      setLoading(false);
    }
  }, [schemeFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const filteredClaims = claims.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.scheme_type.toLowerCase().includes(q) ||
      c.hsn_code?.toLowerCase().includes(q) ||
      c.dgft_reference_no?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">DGFT Claims</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage export incentive claims (RoDTEP, Interest Equalization, Duty Drawback)
          </p>
        </div>
        <Button onClick={() => { setSelectedClaim(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" />
          New Claim
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by scheme, HSN, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={schemeFilter} onValueChange={(v) => { setSchemeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Schemes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Schemes</SelectItem>
            <SelectItem value="RODTEP">RoDTEP</SelectItem>
            <SelectItem value="INTEREST_EQUALIZATION">Interest Equalization</SelectItem>
            <SelectItem value="DUTY_DRAWBACK">Duty Drawback</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-border rounded-lg">
          <Landmark className="w-10 h-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium">No claims yet</h3>
          <p className="text-xs text-muted-foreground max-w-[300px] mt-1">
            Create your first DGFT export incentive claim to track reimbursement from the government.
          </p>
          <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Claim
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Scheme</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>HSN</TableHead>
                <TableHead className="text-right">Export Value</TableHead>
                <TableHead className="text-right">Est. Claim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow
                  key={claim.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedClaim(claim)}
                >
                  <TableCell className="font-medium text-sm">
                    {claim.scheme_type.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {claim.claim_period_start} → {claim.claim_period_end}
                  </TableCell>
                  <TableCell className="text-sm">{claim.hsn_code || "—"}</TableCell>
                  <TableCell className="text-sm text-right">
                    ₹{claim.export_value_inr.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    ₹{claim.estimated_claim_amount.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] h-5 ${STATUS_COLORS[claim.status] || ""}`}>
                      {claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedClaim(claim); }}>
                      <FileText className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <DGFTClaimFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={fetchClaims}
      />

      {selectedClaim && (
        <DGFTClaimDetail
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onUpdated={fetchClaims}
        />
      )}
    </div>
  );
}
