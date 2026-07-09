"use client";

import { useState } from "react";
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
import { Plus, Mail, Building2, Copy, XCircle, CheckCircle2, Search } from "lucide-react";
import type { Supplier } from "@/hooks/use-queries";

export type { Supplier };

interface SupplierListProps {
  suppliers: Supplier[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (supplier: Supplier) => void;
  onChanged: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  invited: "bg-gray-500/10 text-gray-600 border-gray-200",
  active: "bg-green-500/10 text-green-600 border-green-200",
  blocked: "bg-red-500/10 text-red-600 border-red-200",
};

export default function SupplierList({ suppliers, loading, selectedId, onSelect, onChanged }: SupplierListProps) {
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    company_name: "",
    contact_phone: "",
    country: "",
  });

  const filtered = search.trim()
    ? suppliers.filter((s) => {
        const q = search.toLowerCase();
        return s.company_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      })
    : suppliers;

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
      onChanged();
    } catch {
      toast.error("Failed to invite supplier");
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = (id: string) => {
    const link = `${window.location.origin}/supplier/accept?token=${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Invitation link copied to clipboard");
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/suppliers/${id}/status`, { status });
      toast.success(`Supplier ${status}`);
      onChanged();
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="rounded-md flex flex-col h-full bg-muted">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Suppliers ({suppliers.length})</h2>
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Invite
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 px-4 text-sm text-muted-foreground">
            {suppliers.length === 0
              ? 'No suppliers invited yet. Click "Invite" to add your first upstream vendor.'
              : "No suppliers match your search."}
          </div>
        ) : (
          <div className="divide-y divide-background">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className={`w-full text-left p-4 transition-colors ${
                  selectedId === s.id ? "bg-background" : "hover:bg-background/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium truncate">{s.company_name}</span>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${STATUS_STYLES[s.status] || ""}`}>
                    {s.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{s.email}</span>
                </div>
                <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                  {s.status === "invited" && (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => copyInviteLink(s.id)}>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Link
                    </Button>
                  )}
                  {s.status !== "blocked" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => updateStatus(s.id, "blocked")}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Block
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => updateStatus(s.id, "active")}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Unblock
                    </Button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* INVITE DIALOG */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Supplier</DialogTitle>
            <DialogDescription>Send an invitation to an upstream supplier to join your portal.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email *</Label>
              <Input id="invite-email" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="supplier@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-company">Company Name *</Label>
              <Input id="invite-company" value={inviteForm.company_name} onChange={(e) => setInviteForm({ ...inviteForm, company_name: e.target.value })} placeholder="Amara Raja Cells Ltd" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-phone">Contact Phone</Label>
              <Input id="invite-phone" value={inviteForm.contact_phone} onChange={(e) => setInviteForm({ ...inviteForm, contact_phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-country">Country</Label>
              <Input id="invite-country" value={inviteForm.country} onChange={(e) => setInviteForm({ ...inviteForm, country: e.target.value })} placeholder="IN" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting}>{inviting ? "Inviting..." : "Send Invitation"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
