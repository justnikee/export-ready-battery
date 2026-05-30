"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/lib/api";
import { CheckCircle2, ArrowRight } from "lucide-react";

function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!token) {
      toast.error("Invalid or missing invitation token");
      return;
    }

    setLoading(true);
    try {
      await api.post("/suppliers/accept", { token, password });
      toast.success("Invitation accepted! You can now log in.");
      setAccepted(true);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to accept invitation";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (accepted) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
        <h2 className="text-xl font-semibold">Invitation Accepted!</h2>
        <p className="text-sm text-muted-foreground">
          Your account is now active. Log in to start uploading documents.
        </p>
        <Button
          className="w-full"
          onClick={() => (window.location.href = "/supplier/login")}
        >
          Go to Login
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-4 py-8">
        <h2 className="text-xl font-semibold text-red-600">Invalid Link</h2>
        <p className="text-sm text-muted-foreground">
          This invitation link is missing or invalid. Please ask your buyer to resend the invitation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Accept Invitation</h1>
        <p className="text-sm text-muted-foreground">
          Set a password to activate your supplier account
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Activating..." : "Activate Account"}
      </Button>
    </form>
  );
}

export default function SupplierAcceptPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border rounded-xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-[#37322F]">AnvayaLabs</h1>
          <p className="text-sm text-muted-foreground">Supplier Portal</p>
        </div>
        <Suspense
          fallback={
            <div className="text-center py-8 text-sm text-muted-foreground">
              Loading invitation...
            </div>
          }
        >
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </div>
  );
}
