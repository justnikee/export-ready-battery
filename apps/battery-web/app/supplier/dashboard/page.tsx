"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import supplierApi, { supplierLogout } from "@/lib/supplier-api";
import { Upload, FileText, LogOut, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface SupplierDoc {
  id: string;
  doc_type: string;
  file_name: string;
  status: "pending" | "approved" | "rejected";
  uploaded_at: string;
  reviewer_notes?: string;
}

export default function SupplierDashboardPage() {
  const [docs, setDocs] = useState<SupplierDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      // Cookie and/or in-memory Bearer — never localStorage (S-05).
      const res = await supplierApi.get("/supplier/documents");
      setDocs(res.data.documents || []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supplierLogout();
    window.location.href = "/supplier/login";
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
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-lg font-semibold text-[#37322F]">Your documents</h1>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
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
                {statusBadge(doc.status)}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
