"use client";

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { bulkImportBatches, type BulkImportResult } from "@/lib/api/batches";
import { toast } from "sonner";

export function BulkImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split("\n").slice(0, 6).map((r) => r.split(","));
      setPreview(rows);
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const res = await bulkImportBatches(file);
      setResult(res);
      if (res.created > 0) {
        toast.success(`Imported ${res.created} batch${res.created === 1 ? "" : "es"}`);
      }
      if (res.failed > 0) {
        toast.error(`${res.failed} row${res.failed === 1 ? "" : "s"} failed`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "batch_name",
      "model_name",
      "chemistry",
      "voltage",
      "capacity",
      "manufacturer",
      "weight",
      "country_of_origin",
      "market_region",
      "cell_source",
      "lot_size",
      "production_stage",
      "hsn_code",
      "bis_number",
      "epr_number",
      "bill_of_entry_no",
      "customs_date",
      "sale_price_inr",
      "import_cost_inr",
      "pli_compliant",
      "domestic_value_add",
      "manufacturing_start_date",
      "manufacturing_end_date",
    ];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Batches
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple batches at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drop a CSV file here, or click to browse
              </p>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          )}

          {file && !result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-muted p-3 rounded">
                <span className="text-sm font-medium">{file.name}</span>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Change
                </Button>
              </div>

              {preview.length > 0 && (
                <div className="border rounded overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        {preview[0].map((h, i) => (
                          <th key={i} className="px-2 py-1 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(1, 4).map((row, ri) => (
                        <tr key={ri} className="border-t">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1 text-muted-foreground truncate max-w-[120px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {preview.length > 4 && (
                        <tr>
                          <td
                            colSpan={preview[0].length}
                            className="px-2 py-1 text-muted-foreground italic"
                          >
                            ... and {preview.length - 4} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{result.created} created</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">{result.failed} failed</span>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="border rounded overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-2 py-1 text-left font-medium">Row</th>
                        <th className="px-2 py-1 text-left font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-2 py-1">{err.row}</td>
                          <td className="px-2 py-1 text-red-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={() => { setOpen(false); reset(); }}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || loading}>
                {loading ? "Importing..." : "Import Batches"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
