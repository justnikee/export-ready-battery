"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Printer,
  Download,
  FileText,
  Grid3X3,
  QrCode,
  Globe,
} from "lucide-react";

interface DownloadLabelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchName: string;
  passportCount: number;
  onDownload: () => Promise<void>;
  marketRegion?: string;
}

export function DownloadLabelsDialog({
  open,
  onOpenChange,
  batchName,
  passportCount,
  onDownload,
  marketRegion = "INDIA",
}: DownloadLabelsDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const labelsPerPage = 21;
  const totalPages = Math.ceil(passportCount / labelsPerPage);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
      onOpenChange(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const regionConfig: Record<
    string,
    { label: string; color: string; bgColor: string }
  > = {
    INDIA: {
      label: "India",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    EU: { label: "EU", color: "text-blue-400", bgColor: "bg-blue-500/10" },
    GLOBAL: {
      label: "Global",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
  };
  const region = regionConfig[marketRegion] || regionConfig["GLOBAL"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Printer className="h-5 w-5 text-teal-400" />
            Download Product Tags
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Generate printable tag sheets for lot &quot;{batchName}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="bg-secondary/50 p-4 border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              Tag Format Preview
            </h4>
            <div className="bg-transparent p-2 aspect-[210/297] max-h-48 mx-auto flex items-center justify-center">
              <div className="grid grid-cols-3 gap-[2px] p-1 w-full h-full">
                {[...Array(21)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted border border-border flex items-center justify-center"
                  >
                    <QrCode className="h-2 w-2 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              3 x 7 grid layout per A4 page
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-3 bg-secondary/50">
              <p className="text-2xl text-white">
                {passportCount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total Tags</p>
            </div>
            <div className="text-center p-3 bg-secondary/50">
              <p className="text-2xl text-teal-400">{totalPages}</p>
              <p className="text-xs text-muted-foreground">Pages</p>
            </div>
            <div className="text-center p-3 bg-secondary/50">
              <p className="text-2xl text-muted-foreground">A4</p>
              <p className="text-xs text-muted-foreground">Paper Size</p>
            </div>
            <div className={"text-center p-3 " + region.bgColor}>
              <p className={"text-lg " + region.color}>{region.label}</p>
              <p className="text-xs text-muted-foreground">Region</p>
            </div>
          </div>

          <div className="bg-secondary/30 p-3 border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Each Tag Contains
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
              <li>QR Code (links to digital product passport)</li>
              <li>Lot number and production stage</li>
              <li>Fibre composition and care instructions</li>
              <li>Manufacturer and country of origin</li>
              <li className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                Market region badge
                <span className={"text-[10px] font-medium " + region.color}>
                  {region.label}
                </span>
              </li>
              <li>Certifications (GOTS, GRS, OEKO-TEX where applicable)</li>
              <li>ZDHC MRSL compliance indicator</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isDownloading || passportCount === 0}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isDownloading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF ({totalPages} {totalPages === 1 ? "page" : "pages"}
                )
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
