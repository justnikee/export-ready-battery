"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadSupplierDocument, type SupplierDocument } from "@/lib/api/supplier-documents";

export function SupplierDocumentDownload({
  document: supplierDocument,
  scope,
}: {
  document: SupplierDocument;
  scope: "supplier" | "manufacturer";
}) {
  const [pending, setPending] = useState(false);
  const filename = supplierDocument.file_name || supplierDocument.doc_type;

  const download = async () => {
    setPending(true);
    try {
      const file = await downloadSupplierDocument(supplierDocument.id, scope);
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      const unavailable = isAxiosError(error) && error.response?.status === 404;
      toast.error(unavailable ? "This document is unavailable." : "Could not download the document. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={download}
      disabled={pending}
      aria-label={`Download ${filename}`}
    >
      {pending ? "Preparing…" : "Download"}
    </Button>
  );
}
