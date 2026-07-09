"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Download,
  Plus,
  Users,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getApiErrorMessage } from "@/lib/utils";

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
  /** Passport activation slots included (quota is metered per passport). */
  quotaCount: number;
  pricePerUnit: string;
  features: string[];
  description: string;
  isPopular?: boolean;
  isEnterprise?: boolean;
  quota_units?: number;
  /** 30 for monthly tiers, 365 for annual — absent/0 for enterprise (custom). */
  billingCycleDays?: number;
  /** "/mo" comparison rate shown on annual cards, e.g. 11999 for ₹11,999/mo. */
  monthlyEquivalentInr?: number;
}

// A purchasable top-up (extra quota or an extra seat) — see
// PRICING_AND_PACKAGING_STRATEGY.md §4 "Overage & Add-On Packs". Unlike a
// Package, buying one never changes the tenant's plan tier.
interface AddOn {
  id: string;
  name: string;
  kind: "quota_addon" | "seat_addon";
  price: number;
  display_price: string;
  quota?: number;
  seat_bonus?: number;
  description: string;
}

interface Transaction {
  id: string;
  tenant_id: string;
  description: string;
  quota_change: number; // Negative for usage, positive for top-up
  batch_id?: string;
  payment_id?: string; // Present on Razorpay purchase transactions — GST invoice is downloadable for these
  created_at: string;
}

interface ApiPackage {
  id: string;
  name?: string;
  title?: string;
  display_price?: string;
  price?: string;
  quota?: number;
  quotaCount?: number;
  // `price_per_batch` is the backend's JSON field name (kept for API-contract
  // stability — see Package struct in billing_handlers.go); it means "price per
  // quota unit" i.e. per passport, not literally per batch.
  price_per_batch?: string;
  pricePerUnit?: string;
  quota_units?: number;
  description: string;
  features?: string[];
  is_popular?: boolean;
  isPopular?: boolean;
  is_enterprise?: boolean;
  isEnterprise?: boolean;
  billing_cycle_days?: number;
  monthly_equivalent_inr?: number;
}

interface PackagesResponse {
  packages?: ApiPackage[];
  add_ons?: AddOn[];
}

interface TransactionsResponse {
  transactions?: Transaction[];
}

interface OrderResponse {
  order_id: string;
  key_id: string;
  amount: number;
}

// Default packages as fallback — mirrors services.Packages / GetPackages in
// billing_handlers.go. Keep these two in sync; see PRICING_AND_PACKAGING_STRATEGY.md.
const defaultPackages: Package[] = [
  {
    id: "starter",
    title: "Starter License",
    price: "₹14,999",
    quotaCount: 500,
    pricePerUnit: "₹30",
    quota_units: 500,
    billingCycleDays: 30,
    description: "Perfect for pilot runs and small scale manufacturing.",
    features: [
      "500 Passport Activations / month",
      "2 Team Seats",
      "Standard PDF Label Generation",
      "India Compliance (EPR/BIS)",
      "Email Support (48h SLA)",
      "Basic Analytics",
    ],
  },
  {
    id: "starter-annual",
    title: "Starter License",
    price: "₹1,43,988",
    quotaCount: 6000,
    pricePerUnit: "₹30",
    quota_units: 6000,
    billingCycleDays: 365,
    monthlyEquivalentInr: 11999,
    description: "6,000 Passport Activations (500/mo, billed annually).",
    features: [
      "500 Passport Activations / month",
      "2 Team Seats",
      "Standard PDF Label Generation",
      "India Compliance (EPR/BIS)",
      "Email Support (48h SLA)",
      "Basic Analytics",
    ],
  },
  {
    id: "growth",
    title: "Growth License",
    price: "₹44,999",
    quotaCount: 5000,
    pricePerUnit: "₹9",
    quota_units: 5000,
    billingCycleDays: 30,
    isPopular: true,
    description: "For high-volume production and export compliance.",
    features: [
      "Everything in Starter",
      "5,000 Passport Activations / month",
      "10 Team Seats",
      "Priority Label Generation",
      "Importer Mode (China/Korea)",
      "Priority Support (24h SLA) + Onboarding Call",
    ],
  },
  {
    id: "growth-annual",
    title: "Growth License",
    price: "₹4,31,988",
    quotaCount: 60000,
    pricePerUnit: "₹9",
    quota_units: 60000,
    billingCycleDays: 365,
    monthlyEquivalentInr: 35999,
    isPopular: true,
    description: "60,000 Passport Activations (5,000/mo, billed annually).",
    features: [
      "Everything in Starter",
      "5,000 Passport Activations / month",
      "10 Team Seats",
      "Priority Label Generation",
      "Importer Mode (China/Korea)",
      "Priority Support (24h SLA) + Onboarding Call",
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise License",
    price: "Custom",
    quotaCount: 50000,
    pricePerUnit: "Contact Us",
    quota_units: 50000,
    isEnterprise: true,
    description: "Industrial scale solution for large manufacturers.",
    features: [
      "Everything in Growth",
      "50,000+ Passport Activations / month",
      "Up to 100 Team Seats",
      "Custom Label Formats",
      "Dedicated CSM + SLA Guarantees",
      "SSO/SAML & Multi-Entity Support",
    ],
  },
];

// Transform API response to frontend Package interface
function transformApiPackage(apiPkg: ApiPackage): Package {
  return {
    id: apiPkg.id,
    title: apiPkg.name || apiPkg.title || "Enterprise License",
    price: apiPkg.display_price || apiPkg.price || "Contact us",
    quotaCount: apiPkg.quota || apiPkg.quotaCount || 0,
    pricePerUnit: apiPkg.price_per_batch || apiPkg.pricePerUnit || "Custom",
    quota_units: apiPkg.quota || apiPkg.quota_units,
    description: apiPkg.description,
    features: apiPkg.features || [],
    isPopular: apiPkg.is_popular || apiPkg.isPopular,
    isEnterprise: apiPkg.is_enterprise || apiPkg.isEnterprise,
    billingCycleDays: apiPkg.billing_cycle_days,
    monthlyEquivalentInr: apiPkg.monthly_equivalent_inr,
  };
}

// A tier package is billed annually if its SKU id says so — the backend's
// billing_cycle_days is the authoritative signal, but the fallback/default
// packages array above doesn't round-trip through the API, so id is used as
// a robust fallback for the same check.
function isAnnual(pkg: Package): boolean {
  return pkg.billingCycleDays === 365 || pkg.id.endsWith("-annual");
}

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [packages, setPackages] = useState<Package[]>(defaultPackages);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

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
      setAddOns(response.data.add_ons || []);
    } catch (error: unknown) {
      console.warn("Using default packages - API unavailable:", error);
      // Keep using default packages; add-ons have no offline fallback (they
      // depend on the tenant's current plan, which we can't guess offline).
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

  // Shared 3-step Razorpay flow (create order → checkout → verify) used by
  // both tier packages and add-ons — they differ only in the description
  // shown at checkout and the success message once the purchase is verified.
  const purchase = async (
    packageId: string,
    description: string,
    buildSuccessMessage: (quotaAdded: number, seatsAdded: number) => string,
  ) => {
    // The checkout modal needs checkout.js from checkout.razorpay.com (loaded
    // in app/layout.tsx, allowed by the CSP in next.config.ts). If it hasn't
    // loaded — ad-blocker, offline, or a CSP regression — say exactly that
    // before creating an order that could never be paid.
    if (typeof window.Razorpay === "undefined") {
      toast.error(
        "Payment window can't open: the Razorpay checkout script didn't load. " +
          "Disable ad-blockers for this page or check your connection, then reload and try again.",
      );
      return;
    }

    setPurchasing(packageId);

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await api.post<OrderResponse>(
        "/billing/razorpay/order",
        { package_id: packageId },
      );

      const { order_id, key_id, amount } = orderResponse.data;

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: key_id,
        amount: amount,
        currency: "INR",
        name: "Anviora Battery",
        description,
        order_id: order_id,
        handler: async function (response: RazorpayResponse) {
          // Step 3: Verify payment on backend
          try {
            const verifyResponse = await api.post<{
              success: boolean;
              quota_added?: number;
              seats_added?: number;
            }>("/billing/razorpay/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              package_id: packageId,
            });

            if (verifyResponse.data.success) {
              toast.success(
                buildSuccessMessage(
                  verifyResponse.data.quota_added || 0,
                  verifyResponse.data.seats_added || 0,
                ),
              );
              await refreshUser();
              // Dispatch event to update balance banner
              window.dispatchEvent(new Event("quota-updated"));
              // Refresh transactions + add-on eligibility (a tier purchase
              // changes which add-ons are available at which price)
              fetchTransactions();
              fetchPackages();
            }
          } catch {
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
      const message = await getApiErrorMessage(
        error,
        "Failed to initiate payment. Please try again.",
      );
      toast.error(message);
    } finally {
      setPurchasing(null);
    }
  };

  const handleBuyPackage = (pkg: Package) => {
    if (pkg.isEnterprise) {
      window.location.assign(
        "mailto:sales@anvayalabs.com?subject=Enterprise License Inquiry",
      );
      return;
    }
    purchase(
      pkg.id,
      pkg.description,
      (quotaAdded) => `Payment successful! Added ${quotaAdded} quota units.`,
    );
  };

  const handleBuyAddOn = (addOn: AddOn) => {
    purchase(addOn.id, addOn.description, (quotaAdded, seatsAdded) =>
      addOn.kind === "seat_addon"
        ? `Payment successful! Added ${seatsAdded} team seat.`
        : `Payment successful! Added ${quotaAdded} passport credits.`,
    );
  };

  // A transaction with payment_id but quota_change === 0 is a seat add-on
  // purchase — real money changed hands (and it's invoiceable) but no quota
  // moved, so it's neither a credit nor usage; render it as neutral, not amber.
  const getTransactionIcon = (quotaChange: number, hasPayment: boolean) => {
    if (quotaChange > 0) {
      return <ArrowUpRight className="h-4 w-4 text-emerald-500" />;
    }
    if (quotaChange === 0 && hasPayment) {
      return <Plus className="h-4 w-4 text-blue-500" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-amber-500" />;
  };

  const getTransactionColor = (quotaChange: number, hasPayment: boolean) => {
    if (quotaChange > 0) {
      return "text-emerald-500";
    }
    if (quotaChange === 0 && hasPayment) {
      return "text-blue-500";
    }
    return "text-amber-500";
  };

  const downloadInvoice = async (paymentId: string) => {
    setDownloadingInvoice(paymentId);
    try {
      const response = await api.get(
        `/billing/invoices/${paymentId}/download`,
        { responseType: "blob" },
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `invoice_${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch {
      toast.error("Failed to download invoice");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const quota = balance ?? user?.quota_balance ?? 0;
  const isLow = quota <= 2;

  // Enterprise has no monthly/annual variant (custom, annual contract only —
  // see rbac_strategy_extracted.txt) so it's always shown regardless of toggle.
  const hasAnnualOption = packages.some(isAnnual);
  const displayPackages = useMemo(
    () =>
      packages.filter(
        (pkg) => pkg.isEnterprise || isAnnual(pkg) === (billingCycle === "annual"),
      ),
    [packages, billingCycle],
  );

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
            consumed per passport when you activate a batch.
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
            hint="passports remaining"
            tone={isLow ? "danger" : "success"}
            emphasize
          />
          <StatCard
            icon={<TrendingDown className="h-4 w-4" />}
            label="Used This Month"
            value={loadingTransactions ? null : `${usage.usedThisMonth}`}
            hint="passports activated"
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
                  Billing Contact
                </h2>
                <p className="text-xs text-muted-foreground">
                  Company name and email shown on your invoices
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/settings?tab=profile"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Edit in Profile
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                License Packages
              </h2>
            </div>
            {hasAnnualOption && (
              <div className="inline-flex items-center rounded-lg border border-border bg-muted p-1">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    billingCycle === "monthly"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    billingCycle === "annual"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Annual
                  <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
                    Save 20%
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {displayPackages.map((pkg) => (
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
            {billingCycle === "annual"
              ? "Annual licenses are a one-time purchase covering a full 365-day term — not auto-renewing recurring billing. Your full year's quota is credited instantly."
              : "Payments are processed securely by Razorpay. Quota is credited instantly on successful payment."}
          </p>
        </div>

        {/* Add-ons: extra quota / seats, priced for the tenant's current plan */}
        {addOns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Add-Ons
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {addOns.map((addOn) => (
                <div
                  key={addOn.id}
                  className="flex flex-col justify-between rounded-lg border border-border bg-muted p-5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {addOn.kind === "seat_addon" ? (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-medium text-foreground">
                        {addOn.name}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {addOn.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-lg font-semibold text-foreground">
                      {addOn.display_price}
                    </span>
                    <Button
                      size="sm"
                      disabled={purchasing === addOn.id}
                      onClick={() => handleBuyAddOn(addOn)}
                    >
                      {purchasing === addOn.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                const hasPayment = !!tx.payment_id;
                const isNeutralPurchase = tx.quota_change === 0 && hasPayment;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-4 px-6 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          isCredit
                            ? "bg-emerald-500/10"
                            : isNeutralPurchase
                              ? "bg-blue-500/10"
                              : "bg-amber-500/10",
                        )}
                      >
                        {getTransactionIcon(tx.quota_change, hasPayment)}
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
                            : isNeutralPurchase
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-amber-500/10 text-amber-500",
                        )}
                      >
                        {isCredit ? "Top-up" : isNeutralPurchase ? "Purchase" : "Usage"}
                      </span>
                      {!isNeutralPurchase && (
                        <p
                          className={cn(
                            "text-sm font-medium tabular-nums",
                            getTransactionColor(tx.quota_change, hasPayment),
                          )}
                        >
                          {isCredit ? "+" : ""}
                          {tx.quota_change} units
                        </p>
                      )}
                      {tx.payment_id && (
                        <button
                          type="button"
                          onClick={() => downloadInvoice(tx.payment_id!)}
                          disabled={downloadingInvoice === tx.payment_id}
                          title="Download GST invoice"
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                        >
                          {downloadingInvoice === tx.payment_id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
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
