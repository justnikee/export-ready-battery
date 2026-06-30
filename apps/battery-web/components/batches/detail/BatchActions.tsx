"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Printer,
  QrCode,
  FileSpreadsheet,
  FileText,
  Leaf,
  Shield,
  Archive,
  Trash2,
  Download,
  LayoutTemplate,
  PackageSearch,
  Calculator,
  Package,
} from "lucide-react";
import type { Batch } from "@/lib/types";

interface BatchActionsProps {
  batch: Batch;
  isDraft: boolean;
  onPrintLabels: () => void;
  onDownloadQR: () => void;
  onExportCSV: () => void;
  onExportAuditCSV: () => void;
  onDownloadComplianceReport: () => void;
  onExportComplianceDeclaration: () => void;
  onExportDueDiligence: () => void;
  onExportEPCIS: () => void;
  onExportDVAReport: () => void;
  onExportPLIPacket: () => void;
  onArchive: () => void;
  onDeleteDraft: () => void;
  onSaveAsTemplate: () => void;
}

export function BatchActions({
  batch,
  isDraft,
  onPrintLabels,
  onDownloadQR,
  onExportCSV,
  onExportAuditCSV,
  onDownloadComplianceReport,
  onExportComplianceDeclaration,
  onExportDueDiligence,
  onExportEPCIS,
  onExportDVAReport,
  onExportPLIPacket,
  onArchive,
  onDeleteDraft,
  onSaveAsTemplate,
}: BatchActionsProps) {
  const [open, setOpen] = useState(false);
  const isActive = batch.status === "ACTIVE";
  const isArchived = batch.status === "ARCHIVED";
  const isEUorGlobal =
    batch.market_region === "EU" || batch.market_region === "GLOBAL";
  const isIndiaOrGlobal =
    batch.market_region === "INDIA" || batch.market_region === "GLOBAL";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-border text-foreground hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Passport documents */}
        {(isActive || isArchived) && (
          <>
            <DropdownMenuItem
              onClick={() => {
                onPrintLabels();
                setOpen(false);
              }}
              disabled={isArchived}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Labels
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onDownloadQR();
                setOpen(false);
              }}
              disabled={isArchived}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Download QR Codes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onExportCSV();
                setOpen(false);
              }}
              disabled={isArchived}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export Serial List
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Compliance documents */}
        {(isActive || isArchived) && (
          <>
            <DropdownMenuItem
              onClick={() => {
                onDownloadComplianceReport();
                setOpen(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Compliance Report
            </DropdownMenuItem>
            {isEUorGlobal && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    onExportComplianceDeclaration();
                    setOpen(false);
                  }}
                >
                  <Leaf className="mr-2 h-4 w-4" />
                  Carbon Declaration
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onExportDueDiligence();
                    setOpen(false);
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Due Diligence Report
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onExportEPCIS();
                    setOpen(false);
                  }}
                >
                  <PackageSearch className="mr-2 h-4 w-4" />
                  Export EPCIS (GS1 2.0)
                </DropdownMenuItem>
              </>
            )}
            {isIndiaOrGlobal && (
              <DropdownMenuItem
                onClick={() => {
                  onExportDVAReport();
                  setOpen(false);
                }}
              >
                <Calculator className="mr-2 h-4 w-4" />
                DVA Calculation Report
              </DropdownMenuItem>
            )}
            {isIndiaOrGlobal && (
              <DropdownMenuItem
                onClick={() => {
                  onExportPLIPacket();
                  setOpen(false);
                }}
              >
                <Package className="mr-2 h-4 w-4" />
                PLI Claim Packet
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Templates */}
        <DropdownMenuItem
          onClick={() => {
            onSaveAsTemplate();
            setOpen(false);
          }}
        >
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Save as Template
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Audit */}
        <DropdownMenuItem
          onClick={() => {
            onExportAuditCSV();
            setOpen(false);
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          Export Audit Log
        </DropdownMenuItem>

        {/* Danger zone */}
        <DropdownMenuSeparator />
        {isActive && (
          <DropdownMenuItem
            onClick={() => {
              onArchive();
              setOpen(false);
            }}
            className="text-amber-600 focus:text-amber-600"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive Batch
          </DropdownMenuItem>
        )}
        {isDraft && batch.total_passports === 0 && (
          <DropdownMenuItem
            onClick={() => {
              onDeleteDraft();
              setOpen(false);
            }}
            className="text-red-500 focus:text-red-500"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Draft
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
