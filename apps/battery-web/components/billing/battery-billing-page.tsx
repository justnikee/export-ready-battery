"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { toast } from "sonner";
import { PricingCard } from "@/components/billing/pricing-card";
import { LiveBalanceBanner } from "@/components/billing/live-balance-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Loader2,
  CreditCard,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { formatDistanceToNow } from "date-fns";

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

const faqs = [
  {
    question: "Do quota credits expire?",
    answer:
      "No, your purchased batch activation licenses are valid forever. They never expire.",
  },
  {
    question: "What defines a 'batch'?",
    answer:
      "A batch is defined as a single production run (up to 5,000 batteries) with unique manufacturing specifications.",
  },
  {
    question: "Can I top up later?",
    answer:
      "Yes, you can purchase additional licenses at any time. They will be added to your existing balance immediately.",
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

  useEffect(() => {
    fetchTransactions();
    fetchPackages();
  }, []);

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

  const handleBuyPackage = async (pkg: Package) => {
    if (pkg.isEnterprise) {
      window.location.href =
        "mailto:sales@anvayalabs.com?subject=Enterprise License Inquiry";
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-foreground tracking-tight flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20">
                <CreditCard className="h-5 w-5 text-amber-500" />
              </div>
              Production Capacity
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase licenses to activate batches and generate compliant
              labels.
            </p>
          </div>
        </div>

        {/* Live Balance */}
        <LiveBalanceBanner />

        {/* Transaction History */}
        <Card className="bg-transparent border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No transactions yet. Purchase a license to get started.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        {getTransactionIcon(tx.quota_change)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tx.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm ${getTransactionColor(tx.quota_change)}`}
                      >
                        {tx.quota_change > 0 ? "+" : ""}
                        {tx.quota_change} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
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

        {/* FAQ Section */}
        <div className="pt-8 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-xl text-foreground flex items-center justify-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-foreground">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
