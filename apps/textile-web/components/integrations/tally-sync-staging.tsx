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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Factory, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface StagingItem {
  id: string;
  source_type: string;
  tally_name: string;
  tally_parent?: string;
  tally_qty?: number;
  tally_rate?: number;
  tally_amount?: number;
  tally_gst?: number;
  tally_hsn?: string;
  tally_party?: string;
  detected_category?: string;
  detected_fiber_type?: string;
  status: string;
  created_at: string;
}

export default function TallySyncStaging() {
  const [items, setItems] = useState<StagingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/integrations/tally/staging?status=${statusFilter}&limit=${limit}&offset=${offset}`
      );
      setItems(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch {
      toast.error("Failed to load staging items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, offset, limit]);

  const handleApply = async (id: string) => {
    setActioning(id);
    try {
      await api.post(`/integrations/tally/staging/${id}/apply`);
      toast.success("Item applied");
      fetchItems();
    } catch {
      toast.error("Failed to apply item");
    } finally {
      setActioning(null);
    }
  };

  const handleDiscard = async (id: string) => {
    setActioning(id);
    try {
      await api.post(`/integrations/tally/staging/${id}/discard`);
      toast.success("Item discarded");
      fetchItems();
    } catch {
      toast.error("Failed to discard item");
    } finally {
      setActioning(null);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setOffset(0); }}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
          <TabsTrigger value="discarded">Discarded</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Factory className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No {statusFilter} items.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Fiber</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      {statusFilter === "pending" && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate" title={item.tally_name}>
                          {item.tally_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.source_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.detected_category || "—"}
                        </TableCell>
                        <TableCell>
                          {item.detected_fiber_type ? (
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <Leaf className="w-3 h-3" />
                              {item.detected_fiber_type}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{item.tally_qty ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {item.tally_amount ? `₹${item.tally_amount.toFixed(2)}` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.created_at)}
                        </TableCell>
                        {statusFilter === "pending" && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => handleApply(item.id)}
                                disabled={actioning === item.id}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Apply
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleDiscard(item.id)}
                                disabled={actioning === item.id}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Discard
                              </Button>
                            </div>
                          </TableCell>
                        )}
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
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
