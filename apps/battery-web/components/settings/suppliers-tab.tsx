"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Plus,
  Mail,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  FileText,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Flag,
  FlaskConical,
  Search,
  FileSpreadsheet,
  Wrench,
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

interface RiskProfile {
  id: string;
  supplier_id: string;
  overall_score: number;
  country_risk_tier: number;
  mineral_risk_flags: string[];
  rmap_valid?: boolean;
  last_audit_date?: string;
  next_audit_due?: string;
  computed_at: string;
}

interface DDAssessment {
  id: string;
  supplier_id: string;
  step: string;
  status: string;
  completed_at?: string;
  notes: string;
}

interface CorrectiveAction {
  id: string;
  supplier_id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  due_date: string;
}

const OECD_STEPS = [
  { key: "policy", label: "Policy", desc: "Establish due diligence policy" },
  { key: "identify", label: "Identify", desc: "Identify risks in supply chain" },
  { key: "assess", label: "Assess", desc: "Assess supplier risk profiles" },
  { key: "respond", label: "Respond", desc: "Design & implement response strategy" },
  { key: "audit", label: "Audit", desc: "Independent third-party audit" },
];

export default function SuppliersTab() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<SupplierDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [activeTab, setActiveTab] = useState<"suppliers" | "documents" | "risk" | "actions">("suppliers");

  // Risk & DD state
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [ddAssessments, setDDAssessments] = useState<DDAssessment[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [ddOpen, setDDOpen] = useState(false);
  const [caOpen, setCaOpen] = useState(false);
  const [ddLoading, setDDLoading] = useState(false);
  const [caLoading, setCaLoading] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    company_name: "",
    contact_phone: "",
    country: "",
  });

  useEffect(() => {
    fetchSuppliers();
    fetchDocuments();
    fetchCorrectiveActions();
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

  const fetchCorrectiveActions = async () => {
    setCaLoading(true);
    try {
      const res = await api.get("/corrective-actions");
      setCorrectiveActions(res.data || []);
    } catch {
      // silent — actions tab may be empty
    } finally {
      setCaLoading(false);
    }
  };

  const fetchSupplierRisk = async (supplier: Supplier) => {
    setDDLoading(true);
    setSelectedSupplier(supplier);
    try {
      const [riskRes, ddRes] = await Promise.all([
        api.get(`/suppliers/${supplier.id}/risk-profile`),
        api.get(`/suppliers/${supplier.id}/dd-assessments`),
      ]);
      setRiskProfile(riskRes.data);
      setDDAssessments(ddRes.data || []);
    } catch {
      toast.error("Failed to load supplier risk data");
    } finally {
      setDDLoading(false);
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

  const transitionStep = async (assessmentId: string, status: string) => {
    try {
      await api.post(`/dd-assessments/${assessmentId}/transition`, { status });
      toast.success(`Step marked as ${status}`);
      if (selectedSupplier) fetchSupplierRisk(selectedSupplier);
    } catch {
      toast.error("Failed to transition step");
    }
  };

  const createCorrectiveAction = async (data: Partial<CorrectiveAction>) => {
    try {
      await api.post("/corrective-actions", data);
      toast.success("Corrective action created");
      fetchCorrectiveActions();
    } catch {
      toast.error("Failed to create corrective action");
    }
  };

  const updateCAStatus = async (id: string, status: string) => {
    try {
      await api.put(`/corrective-actions/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchCorrectiveActions();
    } catch {
      toast.error("Failed to update status");
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

  const riskScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-500 text-white text-xs">High Risk ({score})</Badge>;
    if (score >= 40) return <Badge className="bg-amber-500 text-white text-xs">Elevated ({score})</Badge>;
    return <Badge className="bg-green-500 text-white text-xs">Low Risk ({score})</Badge>;
  };

  const countryTierBadge = (tier: number) => {
    const labels = ["", "Low", "Medium", "High", "Extreme"];
    const colors = ["", "bg-green-500", "bg-amber-500", "bg-orange-500", "bg-red-500"];
    return (
      <Badge className={`${colors[tier] || "bg-gray-500"} text-white text-xs`}>
        Tier {tier} — {labels[tier] || "Unknown"}
      </Badge>
    );
  };

  const severityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      low: "bg-blue-500/10 text-blue-600 border-blue-200",
      medium: "bg-amber-500/10 text-amber-600 border-amber-200",
      high: "bg-orange-500/10 text-orange-600 border-orange-200",
      critical: "bg-red-500/10 text-red-600 border-red-200",
    };
    return (
      <Badge variant="outline" className={`text-xs ${styles[severity] || ""}`}>
        {severity}
      </Badge>
    );
  };

  const caStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: "bg-amber-500/10 text-amber-600 border-amber-200",
      remediated: "bg-blue-500/10 text-blue-600 border-blue-200",
      verified: "bg-green-500/10 text-green-600 border-green-200",
      escalated: "bg-red-500/10 text-red-600 border-red-200",
      closed: "bg-gray-500/10 text-gray-600 border-gray-200",
    };
    return (
      <Badge variant="outline" className={`text-xs ${styles[status] || ""}`}>
        {status}
      </Badge>
    );
  };

  const getStepStatus = (stepKey: string) => {
    const found = ddAssessments.find((a) => a.step === stepKey);
    return found ? found.status : "not_started";
  };

  const getStepProgress = () => {
    const completed = ddAssessments.filter((a) => a.status === "complete").length;
    return (completed / 5) * 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium">Supplier Portal</h2>
          <p className="text-xs text-muted-foreground">
            Invite upstream suppliers, track OECD due diligence, and manage corrective actions
          </p>
        </div>
        <Button size="sm" onClick={() => setInviteOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Invite Supplier
        </Button>
      </div>

      <div className="flex gap-1 bg-muted p-1 w-fit flex-wrap">
        {[
          { id: "suppliers" as const, label: `Suppliers (${suppliers.length})` },
          { id: "documents" as const, label: `Documents (${documents.length})` },
          { id: "actions" as const, label: `Actions (${correctiveActions.length})` },
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

      {/* SUPPLIERS TAB */}
      {activeTab === "suppliers" && (
        <>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No suppliers invited yet. Click &quot;Invite Supplier&quot; to add your first upstream vendor.
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
                    <div className="flex items-center gap-2">
                      {statusBadge(s.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    {s.email}
                    {s.country && <span className="ml-2">· {s.country}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    Invited {new Date(s.invited_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => { fetchSupplierRisk(s); setDDOpen(true); }}>
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Due Diligence
                    </Button>
                    {s.status === "invited" && (
                      <Button size="sm" variant="outline" onClick={() => copyInviteLink(s.id)}>
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Link
                      </Button>
                    )}
                    {s.status !== "blocked" && (
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus(s.id, "blocked")}>
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Block
                      </Button>
                    )}
                    {s.status === "blocked" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(s.id, "active")}>
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

      {/* DOCUMENTS TAB */}
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
                  <div className="text-xs text-muted-foreground truncate">{d.file_name}</div>
                  {d.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => reviewDoc(d.id, "approved")}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => reviewDoc(d.id, "rejected")}>
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  {d.reviewer_notes && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{d.reviewer_notes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CORRECTIVE ACTIONS TAB */}
      {activeTab === "actions" && (
        <>
          {caLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : correctiveActions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No corrective actions. They are auto-created when a due diligence step fails.
            </div>
          ) : (
            <div className="space-y-3">
              {correctiveActions.map((ca) => (
                <div key={ca.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{ca.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {severityBadge(ca.severity)}
                      {caStatusBadge(ca.status)}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{ca.description}</div>
                  <div className="text-xs text-muted-foreground">Due: {new Date(ca.due_date).toLocaleDateString()}</div>
                  {ca.status === "open" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateCAStatus(ca.id, "remediated")}>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Mark Remediated
                      </Button>
                    </div>
                  )}
                  {ca.status === "remediated" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateCAStatus(ca.id, "verified")}>
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Verify
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

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

      {/* DUE DILIGENCE WIZARD DIALOG */}
      <Dialog open={ddOpen} onOpenChange={setDDOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Due Diligence — {selectedSupplier?.company_name}</DialogTitle>
            <DialogDescription>OECD 5-Step Due Diligence Assessment</DialogDescription>
          </DialogHeader>

          {ddLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Risk Profile Card */}
              {riskProfile ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Profile</span>
                    {riskScoreBadge(riskProfile.overall_score)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Country Tier:</span>
                    {countryTierBadge(riskProfile.country_risk_tier)}
                  </div>
                  {riskProfile.mineral_risk_flags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Mineral Flags:</span>
                      {riskProfile.mineral_risk_flags.map((f) => (
                        <Badge key={f} variant="outline" className="text-xs capitalize">{f}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">RMAP:</span>
                    {riskProfile.rmap_valid ? (
                      <Badge className="bg-green-500 text-white text-xs"><ShieldCheck className="w-3 h-3 mr-1" />Valid</Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white text-xs"><ShieldAlert className="w-3 h-3 mr-1" />Missing</Badge>
                    )}
                  </div>
                  {riskProfile.next_audit_due && (
                    <div className="text-xs text-muted-foreground">
                      Next audit due: {new Date(riskProfile.next_audit_due).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg p-4 text-sm text-muted-foreground text-center">
                  No risk profile computed yet. Risk is calculated automatically when a supplier is invited.
                </div>
              )}

              {/* OECD Step Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">OECD Progress</span>
                  <span className="text-xs text-muted-foreground">{Math.round(getStepProgress())}%</span>
                </div>
                <Progress value={getStepProgress()} className="h-2" />
              </div>

              {/* Step List */}
              <div className="space-y-2">
                {OECD_STEPS.map((step, idx) => {
                  const status = getStepStatus(step.key);
                  const assessment = ddAssessments.find((a) => a.step === step.key);
                  const isComplete = status === "complete";
                  const isFailed = status === "failed";
                  const isInProgress = status === "in_progress";
                  const canStart = idx === 0 || getStepStatus(OECD_STEPS[idx - 1].key) === "complete";

                  return (
                    <div key={step.key} className={`border rounded-lg p-3 space-y-2 ${isFailed ? "border-red-300 bg-red-50" : isComplete ? "border-green-300 bg-green-50" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isComplete ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                           isFailed ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                           isInProgress ? <ArrowRight className="w-4 h-4 text-amber-600" /> :
                           <CircleIcon className="w-4 h-4 text-muted-foreground" />}
                          <span className="text-sm font-medium">{idx + 1}. {step.label}</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">{status.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{step.desc}</div>
                      {assessment?.notes && <div className="text-xs text-muted-foreground italic">{assessment.notes}</div>}
                      <div className="flex gap-2">
                        {status === "not_started" && canStart && (
                          <Button size="sm" variant="outline" onClick={() => transitionStep(assessment?.id || "", "in_progress")}>
                            <ArrowRight className="w-3.5 h-3.5 mr-1" />
                            Start
                          </Button>
                        )}
                        {status === "in_progress" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => transitionStep(assessment?.id || "", "complete")}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Complete
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => transitionStep(assessment?.id || "", "failed")}>
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Fail
                            </Button>
                          </>
                        )}
                        {status === "failed" && (
                          <Button size="sm" variant="outline" onClick={() => transitionStep(assessment?.id || "", "in_progress")}>
                            <ArrowRight className="w-3.5 h-3.5 mr-1" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Create Assessment Button */}
              {ddAssessments.length === 0 && (
                <Button size="sm" onClick={async () => {
                  if (!selectedSupplier) return;
                  try {
                    await api.post(`/suppliers/${selectedSupplier.id}/dd-assessments`, { step: "policy" });
                    toast.success("Assessment created");
                    fetchSupplierRisk(selectedSupplier);
                  } catch {
                    toast.error("Failed to create assessment");
                  }
                }}>
                  <FlaskConical className="w-3.5 h-3.5 mr-1" />
                  Create Assessment
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
