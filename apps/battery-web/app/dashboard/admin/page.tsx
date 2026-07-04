"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  listSignupRequests,
  approveSignupRequest,
  rejectSignupRequest,
  runDailyAlerts,
  upgradeCertificateAnchors,
  type SignupRequest,
} from "@/lib/api/admin";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Anchor,
  AlertTriangle,
  Clock,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted rounded-md relative"><div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "owner" || user?.role === "admin";

  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const [jobLoading, setJobLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await listSignupRequests("pending");
      setRequests(res.requests || []);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to load signup requests";
      toast.error(msg);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin, fetchRequests]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveSignupRequest(id);
      toast.success("Signup request approved");
      fetchRequests();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to approve request";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionLoading(rejectId);
    try {
      await rejectSignupRequest(
        rejectId,
        rejectReason || "Application did not meet qualification criteria"
      );
      toast.success("Signup request rejected");
      setRejectOpen(false);
      setRejectId("");
      setRejectReason("");
      fetchRequests();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to reject request";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const openReject = (id: string) => {
    setRejectId(id);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleRunDailyAlerts = async () => {
    setJobLoading("daily-alerts");
    try {
      const res = await runDailyAlerts();
      toast.success(res.message);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Daily alert scan failed";
      toast.error(msg);
    } finally {
      setJobLoading(null);
    }
  };

  const handleUpgradeAnchors = async () => {
    setJobLoading("upgrade-anchors");
    try {
      const res = await upgradeCertificateAnchors();
      toast.success(res.message);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Anchor upgrade failed";
      toast.error(msg);
    } finally {
      setJobLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-sidebar p-6 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-semibold text-foreground">
            Admin Access Required
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This area is restricted to workspace owners and administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sidebar p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-3">
            <Shield className="h-6 w-6 text-foreground" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage signup requests and run system jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-muted rounded-md p-4 relative"><div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Pending Requests
            </span>
          </div>
          <p className="text-2xl text-foreground mt-1">
            {requestsLoading ? "..." : requests.length}
          </p>
        </div>
      </div>

      {/* Signup Requests */}
      <Section title="Signup Requests">
        {requestsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No pending signup requests
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-background rounded-md p-3 relative"
              ><div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {req.company_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {req.email} · {req.product_type}
                      {req.market_region && ` · ${req.market_region}`}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(req.created_at).toLocaleDateString()}
                      {req.gstin && <span>GSTIN: {req.gstin}</span>}
                      {req.estimated_batches && (
                        <span>~{req.estimated_batches} batches/yr</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      disabled={actionLoading === req.id}
                      onClick={() => handleApprove(req.id)}
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1 text-red-500 hover:bg-red-500/10"
                      disabled={actionLoading === req.id}
                      onClick={() => openReject(req.id)}
                    >
                      <XCircle className="h-3 w-3" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* System Jobs */}
      <Section title="System Jobs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-background rounded-md p-3 relative"><div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-foreground">
                Daily Alert Scan
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Runs certificate expiry checks (30-day window) and compliance score
              monitoring (70% threshold).
            </p>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={jobLoading === "daily-alerts"}
              onClick={handleRunDailyAlerts}
            >
              {jobLoading === "daily-alerts" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Run Now
            </Button>
          </div>

          <div className="bg-background rounded-md p-3 relative"><div className="flex items-center gap-2 mb-2">
              <Anchor className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-foreground">
                Upgrade Certificate Anchors
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Manually trigger the anchor upgrade job for pending blockchain
              certificate anchors.
            </p>
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              disabled={jobLoading === "upgrade-anchors"}
              onClick={handleUpgradeAnchors}
            >
              {jobLoading === "upgrade-anchors" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Run Now
            </Button>
          </div>
        </div>
      </Section>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Reject Signup Request
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be visible to the applicant.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm text-muted-foreground">
              Rejection Reason
            </label>
            <Input
              placeholder="Application did not meet qualification criteria"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={actionLoading === rejectId}
              onClick={handleReject}
            >
              {actionLoading === rejectId ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
