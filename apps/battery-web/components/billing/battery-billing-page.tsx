"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PricingCard } from "@/components/billing/pricing-card";
import {
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Loader2,
  Package,
  Wallet,
  TrendingDown,
  Zap,
  AlertTriangle,
  Building2,
  Mail,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// Declare Razorpay type for TypeScript
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  prefill: {
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface Package {
  id: string;
  title: string;
  price: string;
  batchCount: number;
  pricePerBatch: string;
  features: string[];
  description: string;
  isPopular?: boolean;
  isEnterprise?: boolean;
  quota_units?: number;
}

interface Transaction {
  id: string;
  tenant_id: string;
  description: string;
  quota_change: number; // Negative for usage, positive for top-up
  batch_id?: string;
  created_at: string;
}

interface ApiPackage {
  id: string;
  name?: string;
  title?: string;
  display_price?: string;
  price?: string;
  quota?: number;
  batchCount?: number;
  price_per_batch?: string;
  pricePerBatch?: string;
  quota_units?: number;
  description: string;
  features?: string[];
  is_popular?: boolean;
  isPopular?: boolean;
  is_enterprise?: boolean;
  isEnterprise?: boolean;
}

interface PackagesResponse {
  packages?: ApiPackage[];
}

interface TransactionsResponse {
  transactions?: Transaction[];
}

interface OrderResponse {
  order_id: string;
  key_id: string;
  amount: number;
}

// Default packages as fallback
const defaultPackages: Package[] = [
  {
    id: "starter",
    title: "Starter License",
    price: "₹4,999",
    batchCount: 10,
    pricePerBatch: "₹499",
    quota_units: 10,
    description: "Perfect for pilot runs and small scale manufacturing.",
    features: [
      "10 Batch Activations",
      "Standard PDF Label Generation",
      "India Compliance (EPR/BIS)",
      "Email Support",
      "Basic Analytics",
    ],
  },
  {
    id: "growth",
    title: "Growth License",
    price: "₹19,999",
    batchCount: 50,
    pricePerBatch: "₹399",
    quota_units: 50,
    isPopular: true,
    description: "For high-volume production and export compliance.",
    features: [
      "Everything in Starter",
      "50 Batch Activations",
      "Priority Label Generation",
      "Importer Mode (China/Korea)",
      "WhatsApp Priority Support",
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise License",
    price: "Custom",
    batchCount: 200,
    pricePerBatch: "Contact Us",
    quota_units: 200,
    isEnterprise: true,
    description: "Industrial scale solution for large manufacturers.",
    features: [
      "Everything in Growth",
      "200+ Batch Activations",
      "Custom Label Formats",
      "Dedicated Account Manager",
      "API Access & Custom Integrations",
    ],
  },
];

// Transform API response to frontend Package interface
function transformApiPackage(apiPkg: ApiPackage): Package {
  return {
    id: apiPkg.id,
    title: apiPkg.name || apiPkg.title || "Enterprise License",
    price: apiPkg.display_price || apiPkg.price || "Contact us",
    batchCount: apiPkg.quota || apiPkg.batchCount || 0,
    pricePerBatch: apiPkg.price_per_batch || apiPkg.pricePerBatch || "Custom",
    quota_units: apiPkg.quota || apiPkg.quota_units,
    description: apiPkg.description,
    features: apiPkg.features || [],
    isPopular: apiPkg.is_popular || apiPkg.isPopular,
    isEnterprise: apiPkg.is_enterprise || apiPkg.isEnterprise,
  };
}

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [packages, setPackages] = useState<Package[]>(defaultPackages);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // All-time and month-to-date usage, derived from the same ledger the table
  // renders — no separate endpoint needed. Purchases are positive quota_change,
  // activations negative.
  const usage = useMemo(() => {
    let purchased = 0;
    let used = 0;
    let usedThisMonth = 0;
    let activations = 0;
    const now = new Date();
    for (const tx of transactions) {
      if (tx.quota_change > 0) {
        purchased += tx.quota_change;
      } else if (tx.quota_change < 0) {
        used += -tx.quota_change;
        activations += 1;
        const d = new Date(tx.created_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          usedThisMonth += -tx.quota_change;
        }
      }
    }
    return { purchased, used, usedThisMonth, activations };
  }, [transactions]);

  const fetchBalance = async () => {
    try {
      const response = await api.get<{ quota_balance?: number }>("/billing/balance");
      if (typeof response.data?.quota_balance === "number") {
        setBalance(response.data.quota_balance);
      }
    } catch {
      // Non-fatal: overview falls back to the user's cached quota_balance.
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await api.get<PackagesResponse>("/billing/packages");
      if (response.data.packages && response.data.packages.length > 0) {
        const transformedPackages =
          response.data.packages.map(transformApiPackage);
        setPackages(transformedPackages);
      }
    } catch (error: unknown) {
      console.warn("Using default packages - API unavailable:", error);
      // Keep using default packages
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get<TransactionsResponse>(
        "/billing/transactions",
      );
      setTransactions(response.data.transactions || []);
    } catch (error: unknown) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load billing transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchPackages();
    fetchBalance();
    // Balance is bumped after a successful top-up (see handleBuyPackage) and by
    // batch activations elsewhere in the app — both dispatch "quota-updated".
    window.addEventListener("quota-updated", fetchBalance);
    return () => window.removeEventListener("quota-updated", fetchBalance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuyPackage = async (pkg: Package) => {
    if (pkg.isEnterprise) {
      window.location.assign(
        "mailto:sales@anvayalabs.com?subject=Enterprise License Inquiry",
      );
      return;
    }

    setPurchasing(pkg.id);

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await api.post<OrderResponse>(
        "/billing/razorpay/order",
        {
          package_id: pkg.id,
        },
      );

      const { order_id, key_id, amount } = orderResponse.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: key_id,
        amount: amount,
        currency: "INR",
        name: "Anviora Battery",
        description: pkg.description,
        order_id: order_id,
        handler: async function (response: RazorpayResponse) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await api.post("/billing/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              package_id: pkg.id,
            });

            if (verifyResponse.data.success) {
              toast.success(
                `Payment successful! Added ${pkg.quota_units} quota units.`,
              );
              await refreshUser();
              // Dispatch event to update balance banner
              window.dispatchEvent(new Event("quota-updated"));
              // Refresh transactions
              fetchTransactions();
            }
          } catch (error: unknown) {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          email: user?.email || "",
          contact: "",
        },
        theme: {
          color: "var(--foreground)",
        },
        modal: {
          ondismiss: function () {
            setPurchasing(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: unknown) {
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  const getTransactionIcon = (quotaChange: number) => {
    if (quotaChange > 0) {
      return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-amber-500" />;
  };

  const getTransactionColor = (quotaChange: number) => {
    if (quotaChange > 0) {
      return "text-emerald-500";
    }
    return "text-amber-500";
  };

  const quota = balance ?? user?.quota_balance ?? 0;
  const isLow = quota <= 2;

  return (
    <div className="min-h-screen bg-sidebar">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Billing &amp; Usage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your production quota, usage history, and license packages. Quota is
            consumed when you activate a batch.
          </p>
        </div>

        {/* Low-balance alert */}
        {!loadingBalance && isLow && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <p className="flex-1 text-sm text-amber-600 dark:text-amber-300">
              Your quota is running low. Top up below to keep activating batches
              without interruption.
            </p>
            <a
              href="#packages"
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              <Zap className="h-4 w-4" />
              Top up quota
            </a>
          </div>
        )}

        {/* Overview stat row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label="Current Balance"
            value={loadingBalance ? null : `${quota}`}
            hint="batches remaining"
            tone={isLow ? "danger" : "success"}
            emphasize
          />
          <StatCard
            icon={<TrendingDown className="h-4 w-4" />}
            label="Used This Month"
            value={loadingTransactions ? null : `${usage.usedThisMonth}`}
            hint="batches activated"
          />
          <StatCard
            icon={<Zap className="h-4 w-4" />}
            label="Batches Activated"
            value={loadingTransactions ? null : `${usage.activations}`}
            hint="recent history"
          />
          <StatCard
            icon={<ArrowUpRight className="h-4 w-4" />}
            label="Quota Purchased"
            value={loadingTransactions ? null : `${usage.purchased}`}
            hint="recent history"
          />
        </div>

        {/* Billing account */}
        <div className="rounded-lg border border-border bg-muted">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded bg-blue-500/10 p-2">
                <Building2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-base font-medium text-foreground">
                  Billing Account
                </h2>
                <p className="text-xs text-muted-foreground">
                  Details used for invoices and payment receipts
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings?tab=profile"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Manage
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 px-6 py-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="mt-0.5 text-sm text-foreground">
                {user?.company_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Billing Email</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {user?.support_email || user?.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Razorpay (secure checkout)
              </p>
            </div>
          </div>
        </div>

        {/* License packages */}
        <div id="packages" className="scroll-mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              License Packages
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PricingCard
                key={pkg.id}
                {...pkg}
                loading={purchasing === pkg.id}
                onAction={() => handleBuyPackage(pkg)}
                actionLabel={pkg.isEnterprise ? "Contact Sales" : "Buy License"}
              />
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Payments are processed securely by Razorpay. Quota is credited
            instantly on successful payment.
          </p>
        </div>

        {/* Transaction history */}
        <div className="rounded-lg border border-border bg-muted">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-medium text-foreground">
                Transaction History
              </h2>
            </div>
            {!loadingTransactions && transactions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {transactions.length} record{transactions.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {loadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                No transactions yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Purchase a license package above to get started.
              </p>
            </div>
          ) : (
            <div className="max-h-112 divide-y divide-border overflow-y-auto">
              {transactions.map((tx) => {
                const isCredit = tx.quota_change > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          isCredit ? "bg-emerald-500/10" : "bg-amber-500/10",
                        )}
                      >
                        {getTransactionIcon(tx.quota_change)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "d MMM yyyy, h:mm a")}
                          {" · "}
                          {formatDistanceToNow(new Date(tx.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={cn(
                          "hidden rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide sm:inline-block",
                          isCredit
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500",
                        )}
                      >
                        {isCredit ? "Top-up" : "Usage"}
                      </span>
                      <p
                        className={cn(
                          "text-sm font-medium tabular-nums",
                          getTransactionColor(tx.quota_change),
                        )}
                      >
                        {isCredit ? "+" : ""}
                        {tx.quota_change} units
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact overview metric used in the billing stat row.
function StatCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
  emphasize = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  hint?: string;
  tone?: "default" | "success" | "danger";
  emphasize?: boolean;
}) {
  const valueTone =
    tone === "danger"
      ? "text-red-500"
      : tone === "success"
        ? "text-emerald-500"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-muted p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        {value === null ? (
          <div className="h-8 w-16 animate-pulse rounded bg-background" />
        ) : (
          <span
            className={cn(
              emphasize ? "text-3xl" : "text-2xl",
              "font-semibold tabular-nums",
              valueTone,
            )}
          >
            {value}
          </span>
        )}
        {hint && value !== null && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}
