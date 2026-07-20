"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Upload,
  Zap,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import { PassportList } from "@/components/batches/passport-list";
import { UploadCSV } from "@/components/batches/upload-csv";
import type { Passport } from "@/lib/types";
import type { PaginationInfo, MarketRegion } from "../types";

interface PassportsTabProps {
  batchId: string;
  passports: Passport[];
  passportCount: number;
  pagination: PaginationInfo;
  region: MarketRegion;
  chemistry?: string;
  morthCode?: string;
  isDraft: boolean;
  onPageChange: (page: number) => void;
  onUploadComplete: () => void;
}

export function PassportsTab({
  batchId,
  passports,
  passportCount,
  pagination,
  region,
  chemistry,
  morthCode,
  isDraft,
  onPageChange,
  onUploadComplete,
}: PassportsTabProps) {
  const [showTools, setShowTools] = useState(passportCount === 0);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPassports = searchQuery.trim()
    ? passports.filter((p) =>
        p.serial_number.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : passports;

  const isIndia = region === "INDIA";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Passports
          </h2>
          <p className="text-sm text-muted-foreground">
            {passportCount > 0
              ? `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )} of ${pagination.total.toLocaleString()}`
              : "No passports created yet"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {passportCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTools(!showTools)}
              className="border-border text-foreground hover:bg-muted gap-1.5"
            >
              {showTools ? (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Hide Tools
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Create Passports
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Empty state guidance */}
      {passportCount === 0 && !isDraft && (
        <div className="bg-background rounded-md p-4 relative"><div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Create passports for this batch
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You have two options:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc pl-4">
                <li>
                  <strong className="text-foreground">Auto-Generate</strong> —
                  Let the system create serial numbers automatically{" "}
                  {isIndia
                    ? `(IN-${morthCode || "XXX"}-${chemistry || "LFP"}-YYYY-XXXXX format)`
                    : "in the standard format"}
                </li>
                <li>
                  <strong className="text-foreground">Upload CSV</strong> —
                  Import your own serial numbers from a spreadsheet
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {passportCount === 0 && isDraft && (
        <div className="rounded-md bg-emerald-500/10 p-4 relative">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-600">
                Draft Batch - Passports Ready for Creation
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You can upload a CSV of serial numbers or auto-generate passports while the batch is in DRAFT. Quota slots will be deducted when you activate the batch.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Creation tools — always shown when 0 passports, toggled otherwise */}
      {(showTools || passportCount === 0) && (
        <div className="bg-background rounded-md p-4 relative"><UploadCSV
            batchId={batchId}
            marketRegion={region}
            chemistry={chemistry}
            morthCode={morthCode}
            isDraft={isDraft}
            onUploadComplete={() => {
              onUploadComplete();
              if (passportCount > 0) setShowTools(false);
            }}
          />
        </div>
      )}

      {/* Search */}
      {passportCount > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search serial number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
      )}

      {/* Table */}
      <PassportList passports={filteredPassports} />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="border-border text-foreground hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, index) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = index + 1;
                  } else if (
                    pagination.page >=
                    pagination.totalPages - 2
                  ) {
                    pageNum = pagination.totalPages - 4 + index;
                  } else {
                    pageNum = pagination.page - 2 + index;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === pagination.page ? "default" : "ghost"
                      }
                      size="sm"
                      className={`w-8 h-8 p-0 ${
                        pageNum === pagination.page
                          ? ""
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                },
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
              className="border-border text-foreground hover:bg-muted disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
