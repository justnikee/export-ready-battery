"use client";

import { Link2, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CertificateAnchor } from "@/lib/types";

interface BlockchainAnchorsProps {
  anchors: CertificateAnchor[];
  anchorsLoading: boolean;
}

export function BlockchainAnchors({
  anchors,
  anchorsLoading,
}: BlockchainAnchorsProps) {
  return (
    <div className="border border-border rounded-lg bg-transparent">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Link2 className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-foreground">
          Blockchain Anchors
        </h3>
      </div>
      <div className="p-4">
        {anchorsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading anchors...
          </div>
        ) : anchors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No certificates anchored yet. Upload a certificate and click
            &ldquo;Anchor to Blockchain&rdquo; to create a tamper-evident
            timestamp.
          </p>
        ) : (
          <div className="space-y-2">
            {anchors.map((anchor) => (
              <div
                key={anchor.id}
                className="flex items-center justify-between p-3 bg-background border border-border rounded-md"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {anchor.cert_type}
                    </span>
                    {anchor.status === "confirmed" && (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px]">
                        <Link2 className="h-3 w-3 mr-1" />
                        Confirmed
                      </Badge>
                    )}
                    {anchor.status === "anchored" && (
                      <Badge className="bg-teal-500/10 text-teal-500 border-teal-500/30 text-[10px]">
                        <Link2 className="h-3 w-3 mr-1" />
                        Anchored
                      </Badge>
                    )}
                    {anchor.status === "pending" && (
                      <Badge
                        variant="outline"
                        className="text-amber-500 border-amber-500/30 text-[10px]"
                      >
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Pending
                      </Badge>
                    )}
                    {anchor.status === "failed" && (
                      <Badge
                        variant="outline"
                        className="text-red-500 border-red-500/30 text-[10px]"
                      >
                        Failed
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    Hash: {anchor.file_hash.slice(0, 16)}...
                  </div>
                  {anchor.anchored_at && (
                    <div className="text-xs text-muted-foreground">
                      Anchored:{" "}
                      {new Date(anchor.anchored_at).toLocaleString()}
                    </div>
                  )}
                </div>
                {anchor.ots_proof && (
                  <a
                    href={`https://opentimestamps.org/?ots=${encodeURIComponent(anchor.ots_proof)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 shrink-0 ml-2"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Verify
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
