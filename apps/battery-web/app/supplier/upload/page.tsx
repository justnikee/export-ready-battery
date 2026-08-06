"use client";

import { useState, useRef, useEffect } from "react";
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

interface BatchSummary {
  id: string;
  batch_name: string;
  product_name: string;
  status: string;
}

export default function SupplierUploadPage() {
  const [docType, setDocType] = useState("coc");
  const [batchId, setBatchId] = useState("");
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        // Cookie / in-memory token only — never localStorage (S-05).
        const res = await supplierApi.get("/supplier/batches");
        setBatches(res.data.batches || []);
      } catch {
        toast.error("Failed to load batches");
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchBatches();
  }, []);

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
      if (batchId) {
        formData.append("batch_id", batchId);
      }

      await supplierApi.post("/supplier/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully");
      setFile(null);
      setBatchId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-2 sticky top-0 z-10">
        <Button size="sm" variant="ghost" asChild>
          <Link href="/supplier/dashboard">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <span className="font-medium text-sm">Upload Document</span>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Upload Document</h1>
          <p className="text-sm text-muted-foreground">
            Share certificates and provenance files with your buyer
          </p>
        </div>

        <div className="space-y-4 bg-white border rounded-md p-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc_type">Document type</Label>
            <select
              id="doc_type"
              className="w-full h-9 border rounded-md px-2 text-sm bg-transparent"
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
            <Label htmlFor="batch_id">Batch (optional)</Label>
            <select
              id="batch_id"
              className="w-full h-9 border rounded-md px-2 text-sm bg-transparent"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              disabled={batchesLoading}
            >
              <option value="">— None —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name || b.product_name || b.id}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>File (max 5MB)</Label>
            <input
              ref={fileInputRef}
              type="file"
              className="block w-full text-sm"
              onChange={handleFileSelect}
            />
            {file ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {file.name}
              </p>
            ) : null}
          </div>

          <Button
            className="w-full gap-2"
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
