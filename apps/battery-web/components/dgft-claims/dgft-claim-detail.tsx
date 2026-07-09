"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  FileText,
  Download,
  Trash2,
  Send,
  Landmark,
  Loader2,
  ExternalLink,
  CheckCircle2,
  X,
  Upload,
} from "lucide-react";

interface DGFTClaimDocument {
  doc_type: string;
  file_url?: string;
  status: string;
  uploaded_at?: string;
}

interface DGFTClaim {
  id: string;
  scheme_type: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  claim_period_start: string;
  claim_period_end: string;
  hsn_code?: string;
  destination_country?: string;
  export_value_inr: number;
  export_quantity: number;
  estimated_claim_amount: number;
  approved_claim_amount?: number;
  dgft_reference_no?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  documents?: DGFTClaimDocument[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-600 border-gray-200",
  SUBMITTED: "bg-blue-500/10 text-blue-600 border-blue-200",
  APPROVED: "bg-green-500/10 text-green-600 border-green-200",
  REJECTED: "bg-red-500/10 text-red-600 border-red-200",
};

interface DGFTClaimDetailProps {
  claim: DGFTClaim;
  onClose: () => void;
  onUpdated: () => void;
}

export default function DGFTClaimDetail({ claim, onClose, onUpdated }: DGFTClaimDetailProps) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [referenceNo, setReferenceNo] = useState(claim.dgft_reference_no || "");
  const [savingRef, setSavingRef] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDraft = claim.status === "DRAFT";
  const canUpload = claim.status === "DRAFT" || claim.status === "SUBMITTED";

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/dgft-claims/${claim.id}/submit`);
      toast.success("Claim marked as submitted");
      setConfirmSubmit(false);
      onUpdated();
      onClose();
    } catch {
      toast.error("Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/dgft-claims/${claim.id}`);
      toast.success("Claim deleted");
      setConfirmDelete(false);
      onUpdated();
      onClose();
    } catch {
      toast.error("Failed to delete claim");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveReference = async () => {
    setSavingRef(true);
    try {
      await api.put(`/dgft-claims/${claim.id}`, {
        scheme_type: claim.scheme_type,
        claim_period_start: claim.claim_period_start,
        claim_period_end: claim.claim_period_end,
        hsn_code: claim.hsn_code,
        destination_country: claim.destination_country,
        export_value_inr: claim.export_value_inr,
        export_quantity: claim.export_quantity,
        notes: claim.notes,
        dgft_reference_no: referenceNo,
      });
      toast.success("Reference number updated");
      onUpdated();
    } catch {
      toast.error("Failed to update reference");
    } finally {
      setSavingRef(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Only PDF files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB");
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", file.name.replace(/\.pdf$/i, ""));

      await api.post(`/dgft-claims/${claim.id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully");
      onUpdated();
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await api.get(url, { responseType: "blob" });
      const blob = new Blob([response.data]);
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    await downloadFile(
      `/dgft-claims/${claim.id}/export/pdf`,
      `dgft_claim_${claim.scheme_type.toLowerCase()}_${claim.id.slice(0, 8)}.pdf`
    );
    setDownloadingPDF(false);
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    await downloadFile(
      `/dgft-claims/${claim.id}/export/excel`,
      `dgft_claim_${claim.scheme_type.toLowerCase()}_${claim.id.slice(0, 8)}.csv`
    );
    setDownloadingExcel(false);
  };

  const schemeName = claim.scheme_type.replace(/_/g, " ");

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            DGFT Claim Detail
          </DialogTitle>
          <DialogDescription>
            Claim #{claim.id.slice(0, 8)} · Created {new Date(claim.created_at).toLocaleDateString("en-IN")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status badge */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`text-xs h-6 px-2 ${STATUS_COLORS[claim.status]}`}>
              {claim.status}
            </Badge>
            {claim.approved_claim_amount !== undefined && claim.approved_claim_amount > 0 && (
              <Badge variant="outline" className="text-xs h-6 px-2 bg-green-500/10 text-green-600 border-green-200">
                Approved: ₹{claim.approved_claim_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </Badge>
            )}
          </div>

          {/* Summary grid */}
          <div className="rounded-md bg-muted p-4">
            <h4 className="text-sm font-medium mb-3">Claim Information</h4>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="text-muted-foreground">Scheme</div>
              <div className="font-medium">{schemeName}</div>

              <div className="text-muted-foreground">Claim Period</div>
              <div>{claim.claim_period_start} → {claim.claim_period_end}</div>

              <div className="text-muted-foreground">HSN Code</div>
              <div>{claim.hsn_code || "—"}</div>

              <div className="text-muted-foreground">Destination</div>
              <div>{claim.destination_country || "—"}</div>

              <div className="text-muted-foreground">Export Value</div>
              <div>₹{claim.export_value_inr.toLocaleString("en-IN")}</div>

              <div className="text-muted-foreground">Export Quantity</div>
              <div>{claim.export_quantity.toLocaleString("en-IN")}</div>

              <div className="text-muted-foreground">Estimated Claim</div>
              <div className="font-medium text-primary">
                ₹{claim.estimated_claim_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>

              {claim.notes && (
                <>
                  <div className="text-muted-foreground">Notes</div>
                  <div>{claim.notes}</div>
                </>
              )}
            </div>
          </div>

          {/* DGFT Reference */}
          <div className="rounded-md bg-muted p-4 space-y-3">
            <h4 className="text-sm font-medium">DGFT Tracking</h4>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="dgft-ref">DGFT Reference Number</Label>
                <Input
                  id="dgft-ref"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Enter DGFT portal reference after submission..."
                />
              </div>
              <Button size="sm" onClick={handleSaveReference} disabled={savingRef}>
                {savingRef ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>

          {/* Documents */}
          <div className="rounded-md bg-muted p-4 space-y-3">
            <h4 className="text-sm font-medium">Documents</h4>
            <div className="text-sm text-muted-foreground">
              Upload supporting documents (shipping bill, eBRC, invoice, packing list) before submitting.
            </div>

            {/* Uploaded documents list */}
            {claim.documents && claim.documents.length > 0 && (
              <div className="space-y-2">
                {claim.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="capitalize">{doc.doc_type.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-xs h-5">
                        {doc.status}
                      </Badge>
                    </div>
                    {doc.file_url && (
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {doc.file_url.split("/").pop()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={!canUpload || uploadingDoc}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingDoc ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1" />
                )}
                Upload Document
              </Button>
            </div>
          </div>

          {/* Generated files */}
          <div className="rounded-md bg-muted p-4 space-y-3">
            <h4 className="text-sm font-medium">Generated Files</h4>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={downloadingPDF}>
                {downloadingPDF ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1" />
                )}
                Download Claim PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadExcel} disabled={downloadingExcel}>
                {downloadingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1" />
                )}
                Download Excel
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {isDraft && (
            <>
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="sm:mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Draft
              </Button>
              <Button
                onClick={() => setConfirmSubmit(true)}
                disabled={submitting}
              >
                <Send className="w-4 h-4 mr-1" />
                Mark as Submitted
              </Button>
            </>
          )}
          {!isDraft && (
            <Button variant="outline" onClick={onClose} className="ml-auto">
              Close
            </Button>
          )}
        </DialogFooter>

        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={(open) => { if (!open) setConfirmDelete(false); }}
          title="Delete Claim Draft?"
          description="This will permanently delete the claim draft. This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />

        <ConfirmDialog
          open={confirmSubmit}
          onOpenChange={(open) => { if (!open) setConfirmSubmit(false); }}
          title="Mark as Submitted?"
          description="Once marked as submitted, you can no longer edit this claim. Make sure you have uploaded all required documents and submitted the claim on the DGFT portal."
          confirmText="Yes, Mark Submitted"
          variant="default"
          onConfirm={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
