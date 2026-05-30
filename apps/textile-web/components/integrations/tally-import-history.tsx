"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface TallyImportLog {
  id: string;
  file_name: string;
  status: "success" | "error";
  error_message?: string;
  vouchers_count: number;
  stock_items_count: number;
  created_lot_id?: string;
  created_at: string;
}

interface TallyImportHistoryProps {
  refreshKey?: number;
}

export default function TallyImportHistory({ refreshKey }: TallyImportHistoryProps) {
  const [logs, setLogs] = useState<TallyImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/integrations/tally/history?limit=${limit}&offset=${offset}`);
        setLogs(response.data.logs || []);
        setTotal(response.data.total || 0);
      } catch (err) {
        toast.error("Failed to load Tally import history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [offset, limit, refreshKey]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Factory className="w-8 h-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No Tally imports yet.</p>
        <p className="text-xs text-muted-foreground">Upload your first Tally XML export to see history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vouchers</TableHead>
              <TableHead>Stock Items</TableHead>
              <TableHead>Created Lot</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium text-sm truncate max-w-[180px]" title={log.file_name}>
                  {log.file_name}
                </TableCell>
                <TableCell>
                  {log.status === "success" ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20" title={log.error_message}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">{log.vouchers_count}</TableCell>
                <TableCell className="text-sm">{log.stock_items_count}</TableCell>
                <TableCell className="text-sm font-mono text-xs">
                  {log.created_lot_id ? log.created_lot_id.slice(0, 8) + "…" : "—"}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatDate(log.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              disabled={offset === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => o + limit)}
              disabled={offset + limit >= total}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
