"use client";

import { useEffect, useState } from "react";
import { Link2, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getTenantCertificateAnchors,
  type CertificateAnchorWithBatch,
} from "@/lib/api/anchors";
import type { AnchorStatus } from "@/lib/types";

const CERT_TYPES = ["BIS", "UN38.3", "IEC_62133", "MSDS", "DOC", "PLI"];
const STATUSES: AnchorStatus[] = ["pending", "anchored", "confirmed", "failed"];

function StatusBadge({ status }: { status: AnchorStatus }) {
  if (status === "confirmed") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">
        <Link2 className="h-3 w-3 mr-1" />
        Confirmed
      </Badge>
    );
  }
  if (status === "anchored") {
    return (
      <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/30 text-[10px]">
        <Link2 className="h-3 w-3 mr-1" />
        Anchored
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Pending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-red-500 border-red-500/30 text-[10px]">
      Failed
    </Badge>
  );
}

export default function AnchorsTab() {
  const [anchors, setAnchors] = useState<CertificateAnchorWithBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [certTypeFilter, setCertTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    getTenantCertificateAnchors({
      certType: certTypeFilter === "all" ? undefined : certTypeFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
      .then(setAnchors)
      .catch(() => setAnchors([]))
      .finally(() => setLoading(false));
  }, [certTypeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={certTypeFilter} onValueChange={setCertTypeFilter}>
          <SelectTrigger className="w-44 bg-background border-border">
            <SelectValue placeholder="Certificate type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All certificate types</SelectItem>
            {CERT_TYPES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-background border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border">
        {loading ? (
          <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading anchors...
          </div>
        ) : anchors.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No certificate anchors match these filters.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs">
              <tr>
                <th className="text-left px-4 py-2.5">Certificate</th>
                <th className="text-left px-4 py-2.5">Batch</th>
                <th className="text-left px-4 py-2.5">File Hash</th>
                <th className="text-left px-4 py-2.5">Status</th>
                <th className="text-left px-4 py-2.5">Bitcoin TX</th>
                <th className="text-left px-4 py-2.5">Anchored</th>
                <th className="text-left px-4 py-2.5">Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {anchors.map((a) => (
                <tr key={a.id} className="text-foreground">
                  <td className="px-4 py-2.5 font-medium">{a.cert_type}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{a.batch_name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {a.file_hash.slice(0, 16)}...
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    {a.bitcoin_tx_id ? (
                      <a
                        href={`https://www.blockchain.com/explorer/transactions/btc/${a.bitcoin_tx_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        {a.bitcoin_tx_id.slice(0, 10)}...
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {a.anchored_at ? new Date(a.anchored_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    {a.ots_proof ? (
                      <a
                        href={`https://opentimestamps.org/?ots=${encodeURIComponent(a.ots_proof)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        Verify
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
