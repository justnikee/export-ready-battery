"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import { Upload, FileText, LogOut, Clock, CheckCircle2, XCircle } from "lucide-react";

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
      const res = await api.get("/supplier/documents", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("supplier_token") || ""}`,
        },
      });
      setDocs(res.data.documents || []);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("supplier_token");
    localStorage.removeItem("supplier_id");
    localStorage.removeItem("tenant_id");
    window.location.href = "/supplier/login";
  };

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === "rejected") return <XCircle className="w-4 h-4 text-red-600" />;
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
        <Button size="sm" variant="ghost" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1" />
          Logout
        </Button>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Your Documents</h1>
          <p className="text-sm text-muted-foreground">
            Upload certificates and track review status
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => (window.location.href = "/supplier/upload")}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload New Document
        </Button>

        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No documents yet. Upload your first CoC or audit report.
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">
                      {doc.doc_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {statusBadge(doc.status)}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {doc.file_name}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {statusIcon(doc.status)}
                  <span>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                </div>
                {doc.reviewer_notes && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {doc.reviewer_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
