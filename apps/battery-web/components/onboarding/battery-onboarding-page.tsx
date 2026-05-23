"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { productRoutes } from "@/lib/routes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Shield,
  FileCheck,
  Sparkles,
  Zap,
  Target,
} from "lucide-react";
import { getProductConfigByType, productTypeToSlug } from "@/lib/products";

export function OnboardingPage() {
  const { user, refreshUser, updateUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const routes = productRoutes(user?.product_type);
  const productConfig = getProductConfigByType(user?.product_type);
  const onboardingConfig = productConfig.onboarding;
  const steps = onboardingConfig.steps;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Form data across all steps
  const [formData, setFormData] = useState({
    // Step 1: Company Profile
    company_name: "", // Added as fallback
    address: "",
    support_email: "",
    website: "",
    logo_url: "",
    // Step 2: Markets (stored in address or metadata)
    primary_market: "india", // "eu", "india", "both"
    // Step 3: Compliance
    epr_registration_number: "",
    bis_r_number: "",
    iec_code: "",
    eu_authorized_representative_name: "",
    eu_authorized_representative_address: "",
    eu_contact_email: "",
  });

  // Onboarding is product-owned. If the URL product does not match the tenant,
  // redirect before rendering battery-specific onboarding state.
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

  // Pre-fill with existing user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        company_name: user.company_name || "",
        address: user.address || "",
        support_email: user.support_email || "",
        website: user.website || "",
        logo_url: user.logo_url || "",
        epr_registration_number: user.epr_registration_number || "",
        bis_r_number: user.bis_r_number || "",
        iec_code: user.iec_code || "",
        eu_authorized_representative_name:
          user.eu_authorized_representative_name || "",
        eu_authorized_representative_address:
          user.eu_authorized_representative_address || "",
        eu_contact_email: user.eu_contact_email || "",
      }));
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    // Ensure we have a company name
    const companyName = user?.company_name || formData.company_name; // Fallback if we decided to add it to formData

    if (!companyName) {
      setError(
        "Company name is missing. Please refresh the page or contact support.",
      );
      setLoading(false);
      return;
    }

    try {
      const response = await api.put("/auth/profile", {
        company_name: companyName,
        address: formData.address,
        support_email: formData.support_email,
        website: formData.website,
        logo_url: formData.logo_url,
        epr_registration_number: formData.epr_registration_number,
        bis_r_number: formData.bis_r_number,
        iec_code: formData.iec_code,
        eu_authorized_representative_name:
          formData.eu_authorized_representative_name,
        eu_authorized_representative_address:
          formData.eu_authorized_representative_address,
        eu_contact_email: formData.eu_contact_email,
        // Persist market selection in data_visibility (no dedicated column yet)
        data_visibility: { primary_market: formData.primary_market },
      });

      // OPTIMISTIC UPDATE: Update context immediately with local state
      // This prevents the race condition where refreshUser() might be too slow
      if (response.data) {
        updateUser(response.data);
      } else {
        // Fallback: manually set flag if response is somehow empty
        updateUser({ onboarding_completed: true });
      }

      // Await refresh so user state is fully settled before navigating.
      // Wrapped in try/catch so a transient /auth/me failure wont nuke the session.
      try {
        await refreshUser();
      } catch {
        // updateUser() already set onboarding_completed - safe to proceed
      }

      router.push(productRoutes(user?.product_type).dashboard);
    } catch (err: unknown) {
      console.error("Failed to complete onboarding:", err);
      const apiError = err as {
        response?: { data?: { error?: string } };
        message?: string;
      };
      setError(
        apiError.response?.data?.error ||
          apiError.message ||
          "Failed to save profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Validation for each step
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.support_email);
  const isStep1Valid =
    formData.company_name?.trim() !== "" &&
    formData.address.trim() !== "" &&
    emailValid;
  const isStep2Valid = true; // Market selection always valid (has default)
  const isStep3Valid = true; // Optional step

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      default:
        return true;
    }
  };

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0a0a0a] via-[#171717] to-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{
                  scale: currentStep >= step.id ? 1 : 0.8,
                  backgroundColor:
                    currentStep >= step.id ? "#14b8a6" : "#3F3F46",
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  currentStep > step.id
                    ? "bg-teal-500"
                    : currentStep === step.id
                      ? "bg-teal-500 ring-4 ring-teal-500/30"
                      : "bg-muted"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <step.icon
                    className={`w-5 h-5 ${currentStep >= step.id ? "text-white" : "text-muted-foreground"}`}
                  />
                )}
              </motion.div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-1 rounded-full transition-colors ${
                    currentStep > step.id ? "bg-teal-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <div className="text-center space-y-2">
          <motion.p
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-teal-400 text-sm font-medium uppercase tracking-wider"
          >
            Step {currentStep} of {steps.length}
          </motion.p>
          <motion.h1
            key={`title-${currentStep}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl text-white"
          >
            {steps[currentStep - 1].title}
          </motion.h1>
          <motion.p
            key={`desc-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground"
          >
            {steps[currentStep - 1].description}
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          className="bg-background/80 backdrop-blur-xl p-8 rounded-2xl border border-border shadow-none overflow-hidden"
          layout
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Step 1: Company Profile */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      📋 What you&apos;ll need for setup
                    </p>
                    <ul className="text-xs text-blue-500 space-y-1">
                      <li>• Company name and registered address</li>
                      <li>• EPR registration number (CPCB portal)</li>
                      <li>• BIS R-Number for IS 16046 certification</li>
                      <li>• IEC code (if importing battery cells)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Company Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                        placeholder="Acme Corp"
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Manufacturer Address{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <textarea
                        required
                        className="w-full min-h-[100px] rounded-xl border border-border bg-secondary/50 px-4 py-3 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all resize-none"
                        placeholder="123 Industrial Park, Energy City, Country"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This will appear on all your battery passports
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Support Email <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                        placeholder="support@company.com"
                        value={formData.support_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            support_email: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Website{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type="url"
                        className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                        placeholder="https://company.com"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Target Markets */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <p className="text-muted-foreground text-sm">
                    Select the markets where you plan to sell your batteries.
                    This helps us show relevant compliance requirements.
                  </p>

                  <div className="grid gap-4">
                    {[
                      {
                        id: "eu",
                        label: "European Union",
                        desc: "EU Battery Regulation compliant passports",
                        icon: "🇪🇺",
                      },
                      {
                        id: "india",
                        label: "India",
                        desc: "BWM Rules 2022 & BIS compliant",
                        icon: "🇮🇳",
                      },
                      {
                        id: "both",
                        label: "Both Markets",
                        desc: "Full compliance for global export",
                        icon: "🌍",
                      },
                    ].map((market) => (
                      <motion.button
                        key={market.id}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            primary_market: market.id,
                          })
                        }
                        className={`w-full p-4 rounded-xl border text-left transition-all ${
                          formData.primary_market === market.id
                            ? "border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/30"
                            : "border-border bg-secondary/30 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{market.icon}</span>
                          <div>
                            <p className=" text-white">{market.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {market.desc}
                            </p>
                          </div>
                          {formData.primary_market === market.id && (
                            <CheckCircle2 className="ml-auto h-6 w-6 text-teal-500" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Compliance */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Zap className="h-5 w-5 text-amber-400 shrink-0" />
                    <p className="text-sm text-amber-200">
                      These fields are optional. You can add them later in
                      Settings.
                    </p>
                  </div>

                  {(formData.primary_market === "india" ||
                    formData.primary_market === "both") && (
                    <>
                      <div className="mb-1">
                        <h3 className="text-sm text-teal-400 uppercase tracking-wider">
                          🇮🇳 India Compliance (Required)
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          EPR Registration Number
                        </label>
                        <div className="relative">
                          <FileCheck className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                            placeholder="EPR-XXXX-XXXX"
                            value={formData.epr_registration_number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                epr_registration_number: e.target.value,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          CPCB Extended Producer Responsibility
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          BIS-R Number
                        </label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                            placeholder="R-XXXXX"
                            value={formData.bis_r_number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                bis_r_number: e.target.value,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          BIS CRS registration (IS 16046)
                        </p>
                      </div>
                    </>
                  )}

                  {(formData.primary_market === "eu" ||
                    formData.primary_market === "both") && (
                    <>
                      <div className="mt-4 mb-1">
                        <h3 className="text-sm text-muted-foreground uppercase tracking-wider">
                          🇪🇺 EU Compliance (Optional)
                        </h3>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          EU Authorized Representative Name
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                            placeholder="EU Rep GmbH"
                            value={formData.eu_authorized_representative_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                eu_authorized_representative_name:
                                  e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          EU Contact Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <input
                            type="email"
                            className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                            placeholder="compliance@eurep.eu"
                            value={formData.eu_contact_email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                eu_contact_email: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          EU Authorized Representative Address
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                            placeholder="Street, City, Country"
                            value={
                              formData.eu_authorized_representative_address
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                eu_authorized_representative_address:
                                  e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      IEC Code
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        className="w-full h-12 rounded-xl border border-border bg-secondary/50 px-4 pl-11 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                        placeholder="XXXXXXXXXX"
                        value={formData.iec_code}
                        onChange={(e) =>
                          setFormData({ ...formData, iec_code: e.target.value })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Import Export Code for importers
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-teal-500 to-emerald-500 mb-4"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-xl text-white">You&apos;re all set!</h2>
                    <p className="text-muted-foreground mt-1">
                      Here&apos;s a summary of your profile
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <Link
                      href={routes.batches}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Create Your First Batch
                    </Link>
                  </div>

                  <div className="space-y-4 bg-secondary/50 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Address
                        </p>
                        <p className="text-white">{formData.address || "-"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDirection(-1);
                          setCurrentStep(1);
                        }}
                        className="text-teal-400 text-sm hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="border-t border-border" />
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Support Email
                        </p>
                        <p className="text-white">
                          {formData.support_email || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border" />
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          Target Market
                        </p>
                        <p className="text-white capitalize">
                          {formData.primary_market === "both"
                            ? "EU & India"
                            : formData.primary_market.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    {formData.epr_registration_number && (
                      <>
                        <div className="border-t border-border" />
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            EPR Number
                          </p>
                          <p className="text-white">
                            {formData.epr_registration_number}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentStep === 1
                  ? "text-muted-foreground cursor-not-allowed"
                  : "text-muted-foreground hover:text-white hover:bg-primary/90"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-linear-to-r from-teal-500 to-emerald-500 text-white text-sm hover:from-teal-400 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Launch Dashboard
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Skip link for optional steps */}
        {currentStep === 3 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground text-sm"
          >
            Don&apos;t have these details?{" "}
            <button
              type="button"
              onClick={handleNext}
              className="text-teal-400 hover:underline"
            >
              Skip for now
            </button>
          </motion.p>
        )}

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-none flex items-center gap-3"
          >
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 hover:opacity-80"
            >
              ✕
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;
