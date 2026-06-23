"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { Upload, ArrowLeft, Camera, FileText } from "lucide-react";

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

  const supplierToken =
    typeof window !== "undefined"
      ? localStorage.getItem("supplier_token") || ""
      : "";

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const res = await api.get("/supplier/batches", {
          headers: { Authorization: `Bearer ${supplierToken}` },
        });
        setBatches(res.data.batches || []);
      } catch {
        toast.error("Failed to load batches");
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchBatches();
  }, [supplierToken]);

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

      await api.post("/supplier/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${supplierToken}`,
        },
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
        <Button size="sm" variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="font-medium text-sm">Upload Document</span>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Upload Document</h1>
          <p className="text-sm text-muted-foreground">
            Submit certificates or reports for buyer review
          </p>
        </div>

        <div className="space-y-3">
          <Label>Document Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {DOC_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setDocType(t.value)}
                className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                  docType === t.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch">Linked Batch (optional)</Label>
          {batchesLoading ? (
            <div className="text-sm text-muted-foreground">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No active batches available
            </div>
          ) : (
            <select
              id="batch"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select a batch...</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name} — {b.product_name}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-muted-foreground">
            Link this document to a specific batch for easier tracking
          </p>
        </div>

        <div className="space-y-3">
          <Label>File</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center gap-2"
          >
            {file ? (
              <>
                <FileText className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </>
            ) : (
              <>
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Tap to select or take a photo
                </span>
                <span className="text-xs text-muted-foreground">
                  PDF, PNG, JPG up to 5MB
                </span>
              </>
            )}
          </button>
        </div>

        <Button
          className="w-full"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? "Uploading..." : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Submit for Review
            </>
          )}
        </Button>
      </main>
    </div>
  );
}
