"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  FileText,
} from "lucide-react";

interface Supplier {
  id: string;
  email: string;
  company_name: string;
  contact_phone?: string;
  country?: string;
  status: "invited" | "active" | "blocked";
  invited_at: string;
  accepted_at?: string;
}

interface SupplierDoc {
  id: string;
  supplier_id: string;
  doc_type: string;
  file_name: string;
  status: "pending" | "approved" | "rejected";
  uploaded_at: string;
  reviewer_notes?: string;
}

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<SupplierDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState<"suppliers" | "documents">("suppliers");

  const [inviteForm, setInviteForm] = useState({
    email: "",
    company_name: "",
    contact_phone: "",
    country: "",
  });

  useEffect(() => {
    fetchSuppliers();
    fetchDocuments();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data.suppliers || []);
    } catch {
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/supplier-documents");
      setDocuments(res.data.documents || []);
    } catch {
      toast.error("Failed to load supplier documents");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.company_name) {
      toast.error("Email and company name are required");
      return;
    }
    setInviting(true);
    try {
      await api.post("/suppliers/invitations", inviteForm);
      toast.success("Supplier invited successfully");
      setInviteOpen(false);
      setInviteForm({ email: "", company_name: "", contact_phone: "", country: "" });
      fetchSuppliers();
    } catch {
      toast.error("Failed to invite supplier");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/supplier/accept?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard");
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/suppliers/${id}/status`, { status });
      toast.success(`Supplier ${status}`);
      fetchSuppliers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const reviewDoc = async (id: string, status: string) => {
    try {
      await api.put(`/supplier-documents/${id}/status`, { status });
      toast.success(`Document ${status}`);
      fetchDocuments();
      fetchSuppliers();
    } catch {
      toast.error("Failed to review document");
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      invited: "bg-gray-500/10 text-gray-600 border-gray-200",
      active: "bg-green-500/10 text-green-600 border-green-200",
      blocked: "bg-red-500/10 text-red-600 border-red-200",
    };
    return (
      <Badge variant="outline" className={`text-xs ${styles[status] || ""}`}>
        {status}
      </Badge>
    );
  };

  const docStatusBadge = (status: string) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Supplier Portal</h2>
          <p className="text-xs text-muted-foreground">
            Invite upstream suppliers to submit CoCs and provenance data directly
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Invite Supplier
        </Button>
      </div>

      <div className="flex gap-1 bg-muted p-1 w-fit">
        {[
          { id: "suppliers" as const, label: `Suppliers (${suppliers.length})` },
          { id: "documents" as const, label: `Documents (${documents.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-transparent text-foreground shadow-none"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "suppliers" && (
        <>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No suppliers invited yet. Click "Invite Supplier" to add your first upstream vendor.
            </div>
          ) : (
            <div className="space-y-3">
              {suppliers.map((s) => (
                <div key={s.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{s.company_name}</span>
                    </div>
                    {statusBadge(s.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {s.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    Invited {new Date(s.invited_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    {s.status === "invited" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(s.id)}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Link
                      </Button>
                    )}
                    {s.status !== "blocked" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => updateStatus(s.id, "blocked")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Block
                      </Button>
                    )}
                    {s.status === "blocked" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(s.id, "active")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Unblock
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "documents" && (
        <>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No supplier documents uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((d) => (
                <div key={d.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">
                        {d.doc_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    {docStatusBadge(d.status)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {d.file_name}
                  </div>
                  {d.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewDoc(d.id, "approved")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => reviewDoc(d.id, "rejected")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {d.reviewer_notes && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {d.reviewer_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Supplier</DialogTitle>
            <DialogDescription>
              Send an invitation to an upstream supplier to join your portal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                placeholder="supplier@example.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-company">Company Name *</Label>
              <Input
                id="invite-company"
                value={inviteForm.company_name}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, company_name: e.target.value })
                }
                placeholder="Amara Raja Cells Ltd"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-phone">Contact Phone</Label>
              <Input
                id="invite-phone"
                value={inviteForm.contact_phone}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, contact_phone: e.target.value })
                }
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-country">Country</Label>
              <Input
                id="invite-country"
                value={inviteForm.country}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, country: e.target.value })
                }
                placeholder="IN"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Inviting..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
