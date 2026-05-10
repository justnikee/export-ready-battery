"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import {
  Shield,
  Key,
  Trash2,
  Plus,
  Calendar,
  Building2,
  UserCircle,
  RefreshCcw,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface DataAccessToken {
  id: string;
  tenant_id: string;
  token_hash: string;
  label: string;
  grantee_name: string;
  grantee_org: string;
  access_tier: "PARTNER" | "REGULATOR";
  expires_at: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}

export function DataAccessTokens() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<DataAccessToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopied, setShowCopied] = useState<string | null>(null);

  // Form state
  const [showNewTokenForm, setShowNewTokenForm] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    grantee_name: "",
    grantee_org: "",
    access_tier: "PARTNER",
    expires_in: "8760h", // default to 1 year
  });

  // Result state
  const [newTokenResult, setNewTokenResult] = useState<{
    token: string;
    label: string;
  } | null>(null);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await api.get("/data-access/tokens");
      setTokens(response.data || []);
    } catch (error) {
      console.error("Failed to fetch data access tokens:", error);
      toast.error("Failed to load access tokens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTokens();
    }
  }, [user]);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label || !formData.grantee_name) {
      toast.error("Label and Grantee Name are required");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post("/data-access/tokens", formData);
      setNewTokenResult({
        token: response.data.token,
        label: formData.label,
      });
      setFormData({
        label: "",
        grantee_name: "",
        grantee_org: "",
        access_tier: "PARTNER",
        expires_in: "8760h",
      });
      setShowNewTokenForm(false);
      fetchTokens();
      toast.success("Token generated successfully");
    } catch (error: unknown) {
      const apiError = error as ApiErrorResponse;
      console.error("Failed to create token:", error);
      toast.error(apiError.response?.data?.error || "Failed to create token");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this token? This action cannot be undone and any integrations using it will instantly fail.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/data-access/tokens/${id}`);
      toast.success("Token revoked successfully");
      fetchTokens();
    } catch (error: unknown) {
      const apiError = error as ApiErrorResponse;
      console.error("Failed to revoke token:", error);
      toast.error(apiError.response?.data?.error || "Failed to revoke token");
    }
  };

  const copyToClipboard = async (text: string, id: string = "new") => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopied(id);
      setTimeout(() => setShowCopied(null), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getStatusBadge = (token: DataAccessToken) => {
    if (!token.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-muted text-foreground">
          Revoked
        </span>
      );
    }
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-500">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-500">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg text-foreground border-none m-0">
            Data Access Tokens
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API tokens for Partners and Regulators to access Battery
            Passports via Article 78.
          </p>
        </div>
        {!showNewTokenForm && !newTokenResult && (
          <button
            onClick={() => setShowNewTokenForm(true)}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-none hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Token
          </button>
        )}
      </div>

      {/* New Token Result */}
      {newTokenResult && (
        <div className="rounded-lg border border-amber-200 bg-amber-500/10 p-6 shadow-none">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-full shrink-0">
              <Key className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-amber-900">
                Save Your Token: {newTokenResult.label}
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                This token grants direct access to your battery passports.{" "}
                <strong>It will never be shown again.</strong> Copy it now and
                store it securely.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <code className="flex-1 block truncate rounded bg-card px-4 py-3 text-sm font-mono text-foreground border border-amber-200">
                  {newTokenResult.token}
                </code>
                <button
                  onClick={() => copyToClipboard(newTokenResult.token)}
                  className="flex shrink-0 items-center justify-center rounded-lg bg-amber-600 p-3 text-white hover:bg-amber-700 transition-colors"
                  title="Copy token"
                >
                  {showCopied === "new" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setNewTokenResult(null)}
                  className="text-sm font-medium text-amber-900 underline hover:text-amber-500"
                >
                  I have stored this token securely
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Token Form */}
      {showNewTokenForm && (
        <div className="rounded-lg border border-border bg-card p-6 shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base text-foreground">
              Generate New Access Token
            </h3>
            <button
              onClick={() => setShowNewTokenForm(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateToken} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Token Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EU Commission Portal"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  A memorable name for this token.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Access Tier
                </label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-card"
                  value={formData.access_tier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      access_tier: e.target.value as "PARTNER" | "REGULATOR",
                    })
                  }
                >
                  <option value="PARTNER">
                    Business Partner (Limited visibility)
                  </option>
                  <option value="REGULATOR">
                    Regulator (Full transparency visibility)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Grantee Name
                </label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="Name of individual or team"
                    className="w-full rounded-md border border-border pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={formData.grantee_name}
                    onChange={(e) =>
                      setFormData({ ...formData, grantee_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Grantee Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Optional organization name"
                    className="w-full rounded-md border border-border pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={formData.grantee_org}
                    onChange={(e) =>
                      setFormData({ ...formData, grantee_org: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Expiration
                </label>
                <select
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-card"
                  value={formData.expires_in}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_in: e.target.value })
                  }
                >
                  <option value="720h">30 Days (720h)</option>
                  <option value="2160h">90 Days (2160h)</option>
                  <option value="4320h">180 Days (4320h)</option>
                  <option value="8760h">1 Year (8760h)</option>
                  <option value="">Never Expire (Use with caution)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-6">
              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex items-center justify-center rounded-lg bg-background px-6 py-2.5 text-sm font-medium text-white shadow-none hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-4 w-4" />
                )}
                Generate Token
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tokens List */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-none">
        <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h3 className="text-sm font-medium text-foreground">
            Active Access Tokens
          </h3>
          <button
            onClick={fetchTokens}
            className="text-muted-foreground hover:text-foreground transition"
            title="Refresh list"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
          </button>
        </div>

        {loading && tokens.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p>Loading tokens...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-base font-medium text-foreground">
              No Access Tokens
            </h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Generate tokens to grant secure, role-based access to your battery
              passports.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tokens.map((token) => (
              <div
                key={token.id}
                className={`p-6 flex flex-col sm:flex-row gap-6 items-start justify-between ${!token.is_active ? "bg-background opacity-75" : "bg-card"}`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-medium text-foreground border-none m-0">
                      {token.label}
                    </h4>
                    {getStatusBadge(token)}
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] tracking-wider uppercase border 
 ${
   token.access_tier === "REGULATOR"
     ? "bg-blue-500/10 text-blue-500 border-blue-200"
     : "bg-indigo-500/10 text-indigo-700 border-indigo-200"
 }`}
                    >
                      {token.access_tier}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium text-foreground">
                          {token.grantee_name}
                        </span>
                        {token.grantee_org && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({token.grantee_org})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Expires:{" "}
                        {token.expires_at
                          ? new Date(token.expires_at).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground pt-1 flex items-center gap-4">
                    <span>
                      Created {new Date(token.created_at).toLocaleDateString()}
                    </span>
                    {token.last_used_at ? (
                      <span className="text-emerald-500 font-medium">
                        Last used{" "}
                        {formatDistanceToNow(new Date(token.last_used_at))} ago
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never used</span>
                    )}
                  </div>
                </div>

                {token.is_active && (
                  <div className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-border flex sm:justify-end">
                    <button
                      onClick={() => handleRevokeToken(token.id)}
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-red-500 bg-red-500/10 hover:bg-red-100 rounded transition-colors w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-1.5" />
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
