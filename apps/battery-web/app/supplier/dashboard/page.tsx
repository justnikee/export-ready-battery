"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supplierLogout } from "@/lib/supplier-api";
import { listOwnSupplierDocuments, type SupplierDocument } from "@/lib/api/supplier-documents";
import { SupplierDocumentDownload } from "@/components/due-diligence/supplier-document-download";
import { Upload, FileText, LogOut, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default function SupplierDashboardPage() {
  const [docs, setDocs] = useState<SupplierDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const privateContent = useRef<HTMLElement>(null);

  useEffect(() => {
    void fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      // Cookie and/or in-memory Bearer — never localStorage (S-05).
      setDocs(await listOwnSupplierDocuments());
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supplierLogout();
      if (privateContent.current) privateContent.current.hidden = true;
      window.location.replace("/supplier/login");
    } catch {
      toast.error("Could not log out. Check your connection and try again.");
      setLoggingOut(false);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "approved")
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === "rejected")
      return <XCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-amber-600" />;
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-200",
      approved: "bg-green-500/10 text-green-600 border-green-200",
      rejected: "bg-red-500/10 text-red-600 border-red-200",
    };
    return (
      <Badge variant="outline" className={`text-xs ${styles[status] || ""}`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-[#37322F]" />
          <span className="font-medium text-sm">Supplier Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/supplier/upload">Upload</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={handleLogout} disabled={loggingOut}>
            <LogOut className="w-4 h-4 mr-1" />
            {loggingOut ? "Logging out…" : "Logout"}
          </Button>
        </div>
      </header>

      <main ref={privateContent} className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-lg font-semibold text-[#37322F]">Your documents</h1>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : loadFailed ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground" role="alert">Could not load documents.</p>
            <Button size="sm" variant="outline" onClick={fetchDocs}>Try again</Button>
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-md border bg-white p-6 text-center space-y-2">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <Button size="sm" asChild>
              <Link href="/supplier/upload">Upload your first document</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="bg-white border rounded-md p-3 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2 min-w-0">
                  {statusIcon(doc.status)}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {doc.file_name || doc.doc_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.doc_type} ·{" "}
                      {doc.uploaded_at
                        ? new Date(doc.uploaded_at).toLocaleDateString()
                        : "—"}
                    </p>
                    {doc.reviewer_notes ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {doc.reviewer_notes}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(doc.status)}
                  <SupplierDocumentDownload document={doc} scope="supplier" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
