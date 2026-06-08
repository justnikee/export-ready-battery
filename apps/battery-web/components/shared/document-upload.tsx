"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface DocumentUploadProps {
  label: string;
  documentType: "epr" | "bis" | "pli";
  currentStatus?: string; // NOT_UPLOADED, PENDING, VERIFIED, REJECTED
  onUploadSuccess: () => void;
}

export function DocumentUpload({
  label,
  documentType,
  currentStatus = "NOT_UPLOADED",
  onUploadSuccess,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);

      await api.post("/settings/upload-document", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(`${label} certificate uploaded successfully`);
      onUploadSuccess();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || "Failed to upload certificate");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleViewDocument = async () => {
    try {
      const response = await api.get(`/settings/documents/${documentType}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || "Failed to load document");
    }
  };

  const renderStatusBadge = () => {
    switch (currentStatus) {
      case "VERIFIED":
        return (
          <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            Verified
          </span>
        );
      case "PENDING":
        return (
          <span className="flex items-center gap-1.5 text-amber-500 text-xs font-medium">
            ⏳ Verification Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
            ❌ Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const hasDocument = currentStatus !== "NOT_UPLOADED" && currentStatus !== "";

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleUpload}
        className="hidden"
        disabled={uploading}
      />

      {hasDocument ? (
        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          <button
            type="button"
            onClick={handleViewDocument}
            className="text-xs text-blue-500 hover:text-blue-500 flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Replace"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1 border border-border bg-transparent text-foreground hover:bg-background hover:border-border transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-3 w-3" />
              Upload Certificate
            </>
          )}
        </button>
      )}
    </div>
  );
}
