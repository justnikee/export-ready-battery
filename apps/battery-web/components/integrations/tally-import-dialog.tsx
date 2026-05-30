"use client";

import { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Factory,
  Beaker,
  Hash,
  IndianRupee,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface TallyDraft {
  batch_name: string;
  material_composition: Array<{
    name: string;
    category: string;
    chemistry?: string;
    qty: number;
    rate?: string;
    amount?: number;
  }>;
  supplier_name: string;
  supplier_state: string;
  total_gst: number;
  hsn_code: string;
  import_date?: string;
}

interface TallyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (draft: TallyDraft) => void;
}

export default function TallyImportDialog({
  open,
  onOpenChange,
  onApply,
}: TallyImportDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [draft, setDraft] = useState<TallyDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const reset = useCallback(() => {
    setDraft(null);
    setError(null);
    setFileName(null);
    setDragActive(false);
  }, []);

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const parseFile = async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setError('Please upload a Tally XML export file (.xml)');
      toast.error('Invalid file format. Only .xml files are supported.');
      return;
    }

    setParsing(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/integrations/tally/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDraft(response.data.draft);
      toast.success(
        `Parsed ${response.data.vouchers} voucher(s) and ${response.data.stock_items} stock item(s)`
      );
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string; details?: string } } };
      const msg = apiErr.response?.data?.details || apiErr.response?.data?.error || 'Failed to parse Tally XML';
      setError(msg);
      toast.error(msg);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        parseFile(e.dataTransfer.files[0]);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      parseFile(e.target.files[0]);
    }
  };

  const handleApply = () => {
    if (!draft) return;
    onApply(draft);
    reset();
    onOpenChange(false);
    toast.success('Tally data applied to batch form');
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Factory className="w-5 h-5 text-primary" />
            Import from Tally ERP
          </SheetTitle>
          <SheetDescription>
            Upload a Tally Prime XML export to auto-fill your batch creation form.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Upload Zone */}
          {!draft && !error && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {dragActive ? 'Drop your Tally XML export here' : 'Drag & drop your Tally XML export'}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                or click to browse — only .xml files accepted
              </p>
              <Label
                htmlFor="tally-xml-upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Select File
              </Label>
              <Input
                id="tally-xml-upload"
                type="file"
                accept=".xml,application/xml"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Upload Tally XML"
              />
            </div>
          )}

          {/* Parsing state */}
          {parsing && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Parsing Tally XML...</p>
            </div>
          )}

          {/* Error state */}
          {error && !parsing && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-500">Import Failed</h4>
                  <p className="text-xs text-red-500/80 mt-1">{error}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={reset} className="h-8 px-2">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-3">
                <Label
                  htmlFor="tally-xml-retry"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 text-xs font-medium rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  Try Again
                </Label>
                <Input
                  id="tally-xml-retry"
                  type="file"
                  accept=".xml,application/xml"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {draft && !parsing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-foreground">
                  Parsed successfully — {fileName}
                </span>
              </div>

              {/* Draft Preview Card */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                {/* Batch Name */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Batch Name</p>
                  <p className="text-sm font-medium text-foreground">{draft.batch_name}</p>
                </div>

                {/* Supplier */}
                {(draft.supplier_name || draft.supplier_state) && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Supplier</p>
                    <p className="text-sm text-foreground">
                      {draft.supplier_name}
                      {draft.supplier_state && ` — ${draft.supplier_state}`}
                    </p>
                  </div>
                )}

                {/* GST & HSN */}
                <div className="flex items-center gap-4">
                  {draft.hsn_code && (
                    <div className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">HSN {draft.hsn_code}</Badge>
                    </div>
                  )}
                  {draft.total_gst > 0 && (
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">GST ₹{draft.total_gst.toFixed(2)}</Badge>
                    </div>
                  )}
                </div>

                {/* Material Composition */}
                {draft.material_composition.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Material Composition</p>
                    <div className="space-y-2">
                      {draft.material_composition.map((mat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Beaker className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{mat.name}</p>
                              <p className="text-xs text-muted-foreground">{mat.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {mat.chemistry && (
                              <Badge variant="outline" className="text-xs">
                                {mat.chemistry}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{mat.qty} pcs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleApply} className="flex-1">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Apply to Batch Form
                </Button>
                <Button variant="outline" onClick={reset}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
