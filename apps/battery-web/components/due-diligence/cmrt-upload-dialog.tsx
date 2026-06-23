"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useUploadCMRT } from "@/hooks/use-queries";
import type { CMRTSmelter } from "@/lib/types";

interface CMRTUploadDialogProps {
  supplierId: string;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsePreview {
  reporting_year: number;
  smelter_count: number;
  unknown_smelters: number;
  rmi_conformant_pct: number;
  smelters: CMRTSmelter[];
}

export function CMRTUploadDialog({ supplierId, supplierName, open, onOpenChange }: CMRTUploadDialogProps) {
  const [reportingYear, setReportingYear] = useState<number>(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsePreview | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCMRT = useUploadCMRT();

  const reset = () => {
    setFile(null);
    setPreview(null);
    setReportingYear(new Date().getFullYear());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    if (!selected.name.endsWith(".xlsx") && !selected.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setFile(selected);
    setPreview(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const handleParse = async () => {
    if (!file) return;
    try {
      const result = await uploadCMRT.mutateAsync({ supplierId, file, reportingYear });
      setPreview({
        reporting_year: result.report?.reporting_year || reportingYear,
        smelter_count: result.smelter_count || 0,
        unknown_smelters: result.unknown_smelters || 0,
        rmi_conformant_pct: result.rmi_conformant_pct || 0,
        smelters: (result.report?.smelters || []).map((s: any) => ({
          name: s.name || "",
          country: s.country || "",
          mineral: s.mineral || "",
          smelter_ref: s.smelter_ref || "",
          rmi_status: s.rmi_status || "unknown",
        })),
      });
      toast.success("CMRT parsed successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to parse CMRT file");
    }
  };

  const handleConfirm = () => {
    toast.success("CMRT report saved");
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Upload CMRT — {supplierName}
          </DialogTitle>
          <DialogDescription>
            Upload a Standard CMRT Excel file to parse smelters and validate against the RMI conformant list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reporting-year">Reporting Year</Label>
              <Input
                id="reporting-year"
                type="number"
                value={reportingYear}
                onChange={(e) => setReportingYear(Number(e.target.value))}
                min={2000}
                max={2100}
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <div className="flex items-center gap-2">
                {file ? (
                  <div className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 flex-1">
                    <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{file.name}</span>
                    <button
                      onClick={() => { setFile(null); setPreview(null); }}
                      className="ml-auto hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>

          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"
              }`}
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag and drop a CMRT Excel file here, or click Choose File
              </p>
            </div>
          )}

          {file && !preview && (
            <Button onClick={handleParse} disabled={uploadCMRT.isPending} className="w-full">
              {uploadCMRT.isPending ? "Parsing..." : "Parse CMRT"}
            </Button>
          )}

          {preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">{preview.smelter_count}</div>
                  <div className="text-xs text-muted-foreground">Smelters</div>
                </div>
                <div className="flex-1 border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{preview.rmi_conformant_pct}%</div>
                  <div className="text-xs text-muted-foreground">RMI Conformant</div>
                </div>
                <div className="flex-1 border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-600">{preview.unknown_smelters}</div>
                  <div className="text-xs text-muted-foreground">Unknown</div>
                </div>
              </div>

              {preview.unknown_smelters > 0 && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    {preview.unknown_smelters} smelter(s) could not be matched against the RMI list.
                    A corrective action has been created automatically.
                  </span>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Smelter Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Mineral</TableHead>
                      <TableHead>RMI Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.smelters.map((sm, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{sm.name}</TableCell>
                        <TableCell>{sm.country}</TableCell>
                        <TableCell className="capitalize">{sm.mineral}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              sm.rmi_status === "conformant"
                                ? "default"
                                : sm.rmi_status === "active"
                                ? "secondary"
                                : sm.rmi_status === "unknown"
                                ? "outline"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {sm.rmi_status === "conformant" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {sm.rmi_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={reset}>
                  Upload Another
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
