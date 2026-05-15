"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Factory,
  Globe,
  Layers3,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { productRoutes } from "@/lib/routes";
import { productTypeToSlug } from "@/lib/products";
import {
  mapPrimaryMarketToList,
  mapPrimaryMarketsToSelection,
  TEXTILE_CERTIFICATION_OPTIONS,
  type TextileFacilityType,
  type TextileFiberType,
  type TextilePrimaryMarket,
  type TextilePublishScope,
  type TextileSupplyChainTier,
} from "@/lib/textile-profile";

const STEPS = [
  {
    id: 1,
    title: "Organization Profile",
    description: "Basic company and workspace information",
    icon: Building2,
  },
  {
    id: 2,
    title: "Supply Chain Setup",
    description: "Define how your textile operation is structured",
    icon: Factory,
  },
  {
    id: 3,
    title: "Product Data Readiness",
    description: "Decide what traceability information you will publish first",
    icon: Layers3,
  },
  {
    id: 4,
    title: "Launch Workspace",
    description: "Review and activate your textile workspace",
    icon: Sparkles,
  },
] as const;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 240 : -240,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 240 : -240,
    opacity: 0,
  }),
};

type TextileOnboardingForm = {
  company_name: string;
  address: string;
  support_email: string;
  website: string;
  primary_market: TextilePrimaryMarket;
  facility_type: TextileFacilityType;
  supply_chain_tier: TextileSupplyChainTier;
  core_material_focus: TextileFiberType;
  certifications: string[];
  publish_scope: TextilePublishScope;
};

export function TextileOnboardingPage() {
  const { user, refreshUser, updateUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TextileOnboardingForm>({
    company_name: "",
    address: "",
    support_email: "",
    website: "",
    primary_market: "both",
    facility_type: "manufacturer",
    supply_chain_tier: "multi_tier",
    core_material_focus: "mixed",
    certifications: [],
    publish_scope: "internal",
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    const actualProductSlug = pathname.startsWith("/textile")
      ? "textile"
      : pathname.startsWith("/battery")
        ? "battery"
        : null;
    const expectedProductSlug = productTypeToSlug(user.product_type);

    if (actualProductSlug && actualProductSlug !== expectedProductSlug) {
      router.replace(
        user.onboarding_completed
          ? productRoutes(user.product_type).dashboard
          : productRoutes(user.product_type).onboarding,
      );
      return;
    }

    if (user.onboarding_completed) {
      router.push(productRoutes(user.product_type).dashboard);
    }
  }, [pathname, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const complianceDefaults = user.textile_compliance_defaults || {};

    setFormData((prev) => ({
      ...prev,
      company_name: user.company_name || "",
      address: user.address || "",
      support_email: user.support_email || "",
      website: user.website || "",
      primary_market: mapPrimaryMarketsToSelection(
        user.textile_primary_markets,
      ),
      facility_type:
        user.textile_facility_type === "mill" ||
        user.textile_facility_type === "brand" ||
        user.textile_facility_type === "integrated"
          ? user.textile_facility_type
          : "manufacturer",
      supply_chain_tier:
        user.textile_supply_chain_tier === "tier_1" ||
        user.textile_supply_chain_tier === "tier_2"
          ? user.textile_supply_chain_tier
          : "multi_tier",
      core_material_focus: user.textile_default_fiber_types?.includes("natural")
        ? "natural"
        : user.textile_default_fiber_types?.includes("synthetic")
          ? "synthetic"
          : user.textile_default_fiber_types?.includes("blended")
            ? "blended"
            : "mixed",
      certifications: user.textile_certifications || [],
      publish_scope:
        complianceDefaults.publish_scope === "partner" ||
        complianceDefaults.publish_scope === "public"
          ? complianceDefaults.publish_scope
          : "internal",
    }));
  }, [user]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.support_email);
  const stepOneValid =
    formData.company_name.trim() !== "" &&
    formData.address.trim() !== "" &&
    emailValid;

  const canProceed = currentStep === 1 ? stepOneValid : true;

  const handleBack = () => {
    if (currentStep === 1) {
      return;
    }
    setDirection(-1);
    setCurrentStep((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentStep === STEPS.length) {
      return;
    }
    setDirection(1);
    setCurrentStep((prev) => prev + 1);
  };

  const setField = <K extends keyof TextileOnboardingForm>(
    key: K,
    value: TextileOnboardingForm[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put("/auth/profile", {
        company_name: formData.company_name,
        address: formData.address,
        support_email: formData.support_email,
        website: formData.website,
        textile_facility_type: formData.facility_type,
        textile_supply_chain_tier: formData.supply_chain_tier,
        textile_primary_markets: mapPrimaryMarketToList(
          formData.primary_market,
        ),
        textile_default_fiber_types: [formData.core_material_focus],
        textile_certifications: formData.certifications,
        textile_compliance_defaults: {
          publish_scope: formData.publish_scope,
        },
        data_visibility: user?.data_visibility || {},
      });

      if (response.data) {
        updateUser(response.data);
      } else {
        updateUser({ onboarding_completed: true });
      }

      try {
        await refreshUser();
      } catch {
        // Keep the optimistic update and continue routing.
      }

      router.push(productRoutes(user?.product_type).dashboard);
    } catch (err: unknown) {
      console.error("Failed to complete textile onboarding:", err);
      const apiError = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        apiError.response?.data?.error ||
          apiError.message ||
          "Failed to save textile workspace setup.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0b1320] via-[#121a2a] to-[#0b1320] px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-300">
              Textile onboarding
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Set up the textile workspace, not the battery flow.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              This onboarding keeps textile concerns separate: organization
              profile, supply-chain shape, and product-data readiness.
            </p>

            <div className="mt-8 space-y-4">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    currentStep === step.id
                      ? "border-cyan-300/50 bg-cyan-300/10"
                      : currentStep > step.id
                        ? "border-emerald-300/30 bg-emerald-300/10"
                        : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                        currentStep >= step.id
                          ? "bg-cyan-300 text-slate-950"
                          : "bg-slate-700 text-slate-200"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-300">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="rounded-3xl border border-border bg-background/90 p-6 shadow-none backdrop-blur-xl sm:p-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 260, damping: 28 }}
              >
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-cyan-600">
                        Step 1 of 4
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-foreground">
                        Organization profile
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Capture the shared organization details the platform
                        needs before textile-specific workflows branch out.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">
                          Company name
                        </span>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={formData.company_name}
                            onChange={(e) =>
                              setField("company_name", e.target.value)
                            }
                            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                            placeholder="AnvayaLabs Textile"
                          />
                        </div>
                      </label>

                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">
                          Registered address
                        </span>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={formData.address}
                            onChange={(e) =>
                              setField("address", e.target.value)
                            }
                            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                            placeholder="Registered office or primary manufacturing site"
                          />
                        </div>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                          Support email
                        </span>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={formData.support_email}
                            onChange={(e) =>
                              setField("support_email", e.target.value)
                            }
                            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                            placeholder="ops@company.com"
                          />
                        </div>
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">
                          Website
                        </span>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) =>
                              setField("website", e.target.value)
                            }
                            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                            placeholder="https://example.com"
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-cyan-600">
                        Step 2 of 4
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-foreground">
                        Supply chain setup
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Define the commercial and operational shape of the
                        textile workspace using the dedicated textile tenant
                        profile.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Primary market
                        </label>
                        <select
                          value={formData.primary_market}
                          onChange={(e) =>
                            setField(
                              "primary_market",
                              e.target
                                .value as TextileOnboardingForm["primary_market"],
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        >
                          <option value="domestic">Domestic market</option>
                          <option value="export">Export market</option>
                          <option value="both">Domestic + export</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Facility type
                        </label>
                        <select
                          value={formData.facility_type}
                          onChange={(e) =>
                            setField(
                              "facility_type",
                              e.target
                                .value as TextileOnboardingForm["facility_type"],
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        >
                          <option value="mill">Mill / processor</option>
                          <option value="manufacturer">
                            Garment manufacturer
                          </option>
                          <option value="brand">Brand / aggregator</option>
                          <option value="integrated">
                            Integrated operation
                          </option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Supply-chain tier
                        </label>
                        <select
                          value={formData.supply_chain_tier}
                          onChange={(e) =>
                            setField(
                              "supply_chain_tier",
                              e.target
                                .value as TextileOnboardingForm["supply_chain_tier"],
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        >
                          <option value="tier_1">Tier 1 only</option>
                          <option value="tier_2">Tier 2 focus</option>
                          <option value="multi_tier">
                            Multi-tier supply chain
                          </option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Material focus
                        </label>
                        <select
                          value={formData.core_material_focus}
                          onChange={(e) =>
                            setField(
                              "core_material_focus",
                              e.target
                                .value as TextileOnboardingForm["core_material_focus"],
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        >
                          <option value="natural">Natural fibers</option>
                          <option value="synthetic">Synthetic fibers</option>
                          <option value="blended">Blended materials</option>
                          <option value="mixed">Mixed portfolio</option>
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-foreground">
                          Certifications in scope
                        </label>
                        <div className="grid gap-3 md:grid-cols-2">
                          {TEXTILE_CERTIFICATION_OPTIONS.map((option) => {
                            const selected = formData.certifications.includes(
                              option.value,
                            );

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    certifications: selected
                                      ? prev.certifications.filter(
                                          (item) => item !== option.value,
                                        )
                                      : [...prev.certifications, option.value],
                                  }))
                                }
                                className={`rounded-2xl border p-3 text-left text-sm transition-colors ${
                                  selected
                                    ? "border-cyan-300 bg-cyan-300/10"
                                    : "border-border bg-card hover:border-cyan-500/30"
                                }`}
                              >
                                <p className="font-medium text-foreground">
                                  {option.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-cyan-600">
                        Step 3 of 4
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-foreground">
                        Product data readiness
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This replaces the battery-specific compliance capture
                        with textile traceability priorities.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        {
                          key: "internal",
                          title: "Internal first",
                          description:
                            "Stand up the workspace and team structure before exposing data externally.",
                        },
                        {
                          key: "partner",
                          title: "Partner-ready",
                          description:
                            "Prepare material and facility data for mills, brands, and auditors.",
                        },
                        {
                          key: "public",
                          title: "Public-ready",
                          description:
                            "Aim to publish selected consumer-facing traceability and care guidance.",
                        },
                      ].map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              publish_scope: option.key as TextilePublishScope,
                            }))
                          }
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            formData.publish_scope === option.key
                              ? "border-cyan-300 bg-cyan-300/10"
                              : "border-border bg-card hover:border-cyan-500/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-cyan-600" />
                            <span className="text-sm font-medium text-foreground">
                              {option.title}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-cyan-600">
                        Step 4 of 4
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-foreground">
                        Launch the textile workspace
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Review the setup that will be saved now. Deeper textile
                        profile data is now written into the textile workspace
                        record.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Organization
                        </p>
                        <p className="mt-2 text-sm text-foreground">
                          {formData.company_name || "Not set"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formData.address || "No address provided"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Operating model
                        </p>
                        <p className="mt-2 text-sm text-foreground capitalize">
                          {formData.facility_type.replace("_", " ")}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground capitalize">
                          {formData.supply_chain_tier.replace("_", " ")} ·{" "}
                          {formData.core_material_focus}
                        </p>
                        {formData.certifications.length > 0 && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formData.certifications.join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Go-to-market
                        </p>
                        <p className="mt-2 text-sm text-foreground capitalize">
                          {formData.primary_market}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground capitalize">
                          Publish scope: {formData.publish_scope}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-card p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Next workspace moves
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <li>Invite mills, brands, and operators</li>
                          <li>Create textile production lots</li>
                          <li>Configure settings and compliance modules</li>
                        </ul>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {error}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed || loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Complete setup"}
                  {!loading && <Sparkles className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
