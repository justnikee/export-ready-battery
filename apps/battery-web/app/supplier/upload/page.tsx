"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import supplierApi from "@/lib/supplier-api";
import { Upload, ArrowLeft, Camera, FileText } from "lucide-react";
import Link from "next/link";

const DOC_TYPES = [
  { value: "coc", label: "Certificate of Conformance" },
  { value: "audit_report", label: "Audit Report" },
  { value: "provenance", label: "Provenance Declaration" },
  { value: "msds", label: "MSDS" },
  { value: "test_report", label: "Test Report" },
  { value: "other", label: "Other" },
];

const selectClassName =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:text-muted-foreground";

export default function SupplierUploadPage() {
  const [docType, setDocType] = useState("coc");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doc_type", docType);

      await supplierApi.post("/supplier/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground [color-scheme:light] dark:[color-scheme:dark]">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-4 py-3 text-card-foreground">
        <Button size="sm" variant="ghost" asChild>
          <Link href="/supplier/dashboard" aria-label="Back to supplier documents">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <span className="font-medium text-sm">Upload Document</span>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Upload Document</h1>
          <p className="text-sm text-muted-foreground">
            Send certificates and supporting files to your buyer for review.
          </p>
        </div>

        <div className="space-y-5 rounded-md border border-border bg-card p-4 text-card-foreground sm:p-5">
          <div className="space-y-1.5">
            <Label htmlFor="doc_type">Document type</Label>
            <select
              id="doc_type"
              className={selectClassName}
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supplier-file">File (max 5 MB)</Label>
            <input
              id="supplier-file"
              ref={fileInputRef}
              type="file"
              className="block w-full min-w-0 rounded-md border border-input bg-background p-1 text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-muted file:px-3 file:py-2 file:font-medium file:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              onChange={handleFileSelect}
            />
            {file ? (
              <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <FileText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-all">{file.name}</span>
              </p>
            ) : null}
          </div>

          <Button
            className="w-full gap-2 disabled:bg-muted disabled:text-foreground/75 disabled:opacity-100"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? (
              "Uploading…"
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Camera className="w-3 h-3" />
          You can also photograph certificates on mobile devices.
        </p>
      </main>
    </div>
  );
}
