"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import {
  Scale,
  Plus,
  Loader2,
  Search,
  ArrowRightLeft,
  FileText,
  TrendingUp,
  Minus,
  Pencil,
} from "lucide-react";
import {
  listLedgers,
  type MassBalanceLedger,
  type MaterialType,
  MATERIAL_TYPE_LABELS,
  MATERIAL_TYPE_COLORS,
} from "@/lib/api/mass-balance";
import LedgerFormDialog from "./ledger-form-dialog";
import AllocationFormDialog from "./allocation-form-dialog";

export default function MassBalancePage() {
  const [ledgers, setLedgers] = useState<MassBalanceLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [materialFilter, setMaterialFilter] = useState<MaterialType | "">("");
  const [ledgerDialogOpen, setLedgerDialogOpen] = useState(false);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<MassBalanceLedger | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "update">("create");

  const fetchLedgers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listLedgers(materialFilter || undefined);
      setLedgers(res.ledgers || []);
    } catch {
      toast.error("Failed to load mass balance ledgers");
    } finally {
      setLoading(false);
    }
  }, [materialFilter]);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  const filteredLedgers = useMemo(() => {
    if (!search) return ledgers;
    const q = search.toLowerCase();
    return ledgers.filter(
      (l) =>
        l.incoming_source.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q) ||
        MATERIAL_TYPE_LABELS[l.material_type].toLowerCase().includes(q)
    );
  }, [ledgers, search]);

  const summary = useMemo(() => {
    const totals = {} as Record<
      MaterialType,
      { incoming: number; allocated: number; balance: number }
    >;
    for (const mt of Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[]) {
      totals[mt] = { incoming: 0, allocated: 0, balance: 0 };
    }
    for (const l of ledgers) {
      totals[l.material_type].incoming += l.incoming_kg;
      totals[l.material_type].allocated += l.allocated_kg;
      totals[l.material_type].balance += l.balance_kg;
    }
    return totals;
  }, [ledgers]);

  const handleCreate = () => {
    setSelectedLedger(null);
    setDialogMode("create");
    setLedgerDialogOpen(true);
  };

  const handleUpdate = (ledger: MassBalanceLedger) => {
    setSelectedLedger(ledger);
    setDialogMode("update");
    setLedgerDialogOpen(true);
  };

  const handleAllocate = (ledger: MassBalanceLedger) => {
    setSelectedLedger(ledger);
    setAllocationDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-sidebar p-6 w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mass Balance</h1>
          <p className="text-sm text-muted-foreground">
            Track recycled material ledgers and allocate mass to batches (EU Art 8 — Book & Claim)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-1" />
          New Ledger
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[]).map((mt) => {
          const s = summary[mt];
          const hasData = s.incoming > 0;
          return (
            <div
              key={mt}
              className={`rounded-md p-4 space-y-3 ${
                hasData ? "bg-muted" : "bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-[10px] h-5 ${MATERIAL_TYPE_COLORS[mt]}`}
                >
                  {MATERIAL_TYPE_LABELS[mt]}
                </Badge>
                {hasData ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Incoming</span>
                  <span className="font-medium">{s.incoming.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allocated</span>
                  <span className="font-medium">{s.allocated.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={`font-semibold ${s.balance > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {s.balance.toFixed(2)} kg
                  </span>
                </div>
              </div>
              {/* Mini bar */}
              {hasData && (
                <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${Math.min((s.balance / s.incoming) * 100, 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by source, notes, or material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={materialFilter || "all"}
          onValueChange={(v) => setMaterialFilter(v === "all" ? "" : (v as MaterialType))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Materials" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Materials</SelectItem>
            {(Object.keys(MATERIAL_TYPE_LABELS) as MaterialType[]).map((mt) => (
              <SelectItem key={mt} value={mt}>
                {MATERIAL_TYPE_LABELS[mt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredLedgers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted rounded-md">
          <Scale className="w-10 h-10 text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium">No ledgers yet</h3>
          <p className="text-xs text-muted-foreground max-w-[300px] mt-1">
            Create your first mass balance ledger to track recycled material
            incoming stock and allocations to product batches.
          </p>
          <Button size="sm" className="mt-4" onClick={handleCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Ledger
          </Button>
        </div>
      ) : (
        <div className="bg-muted rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Material</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Incoming (kg)</TableHead>
                <TableHead className="text-right">Allocated (kg)</TableHead>
                <TableHead className="text-right">Balance (kg)</TableHead>
                <TableHead>Certificate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLedgers.map((ledger) => (
                <TableRow key={ledger.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 ${
                        MATERIAL_TYPE_COLORS[ledger.material_type]
                      }`}
                    >
                      {MATERIAL_TYPE_LABELS[ledger.material_type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {ledger.incoming_source}
                  </TableCell>
                  <TableCell className="text-sm text-right font-medium">
                    {ledger.incoming_kg.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-right text-muted-foreground">
                    {ledger.allocated_kg.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-right">
                    <span
                      className={`font-semibold ${
                        ledger.balance_kg > 0
                          ? "text-emerald-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {ledger.balance_kg.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {ledger.certificate_url ? (
                      <a
                        href={ledger.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-primary hover:underline"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={ledger.balance_kg <= 0}
                        onClick={() => handleAllocate(ledger)}
                        title="Allocate to batch"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdate(ledger)}
                        title="Update ledger"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LedgerFormDialog
        open={ledgerDialogOpen}
        onOpenChange={setLedgerDialogOpen}
        mode={dialogMode}
        ledger={selectedLedger}
        onSaved={fetchLedgers}
      />

      <AllocationFormDialog
        open={allocationDialogOpen}
        onOpenChange={setAllocationDialogOpen}
        ledger={selectedLedger}
        onSaved={fetchLedgers}
      />
    </div>
  );
}
