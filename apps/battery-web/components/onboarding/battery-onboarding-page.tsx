"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import api from "@/lib/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { productRoutes } from "@/lib/routes";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getProductConfigByType, productTypeToSlug } from "@/lib/products";
import { useOnboardingReadiness } from "@/hooks/use-onboarding-readiness";
import { onboardingStep1Schema, onboardingStep3Schema } from "@/lib/validation/onboarding";

import { OnboardingShell } from "./onboarding-shell";
import { StepIndicator } from "./step-indicator";
import { StepHeader } from "./step-header";
import { AnimatedStep } from "./animated-step";
import { MarketSelector } from "./market-selector";
import { ReviewSummary } from "./review-summary";
import { OnboardingNavigation } from "./onboarding-navigation";
import { StepCompanyProfile } from "./step-company-profile";
import { StepComplianceSetup } from "./step-compliance-setup";

export function OnboardingPage() {
  const { user, refreshUser, updateUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routes = productRoutes(user?.product_type);
  const productConfig = getProductConfigByType(user?.product_type);
  const steps = productConfig.onboarding.steps;

  const stepFromUrl = parseInt(searchParams.get("step") || "", 10);
  const initialStep =
    !isNaN(stepFromUrl) && stepFromUrl >= 1 && stepFromUrl <= 4 ? stepFromUrl : 1;

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(1);
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    company_name: "",
    address: "",
    support_email: "",
    website: "",
    logo_url: "",
    primary_market: "india",
    epr_registration_number: "",
    bis_r_number: "",
    iec_code: "",
    eu_authorized_representative_name: "",
    eu_authorized_representative_address: "",
    eu_contact_email: "",
    morth_manufacturer_code: "",
  });

  useEffect(() => {
    if (!user) return;
    // Allow re-entry to specific steps (e.g., step=3 for compliance update)
    // even after onboarding is marked complete. Only redirect away if
    // the user lands on the base onboarding URL without a step param.
    if (user.onboarding_completed && !searchParams.get("step")) {
      router.push(productRoutes(user.product_type).dashboard);
    }
  }, [pathname, router, user, searchParams]);

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
        eu_authorized_representative_name: user.eu_authorized_representative_name || "",
        eu_authorized_representative_address: user.eu_authorized_representative_address || "",
        eu_contact_email: user.eu_contact_email || "",
        primary_market: user.data_visibility?.primary_market || "india",
        morth_manufacturer_code: user.morth_manufacturer_code || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    const currentStepParam = searchParams.get("step");
    if (currentStepParam === String(currentStep)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", String(currentStep));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Real-time Zod validation for Step 1
  useEffect(() => {
    if (currentStep !== 1) {
      setStep1Errors({});
      return;
    }
    const result = onboardingStep1Schema.safeParse({
      company_name: formData.company_name,
      address: formData.address,
      support_email: formData.support_email,
      website: formData.website,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        const key = String(e.path[0]);
        errs[key] = e.message;
      });
      setStep1Errors(errs);
    } else {
      setStep1Errors({});
    }
  }, [formData.company_name, formData.address, formData.support_email, formData.website, currentStep]);

  // Real-time Zod validation for Step 3
  useEffect(() => {
    if (currentStep !== 3) {
      setStep3Errors({});
      return;
    }
    const result = onboardingStep3Schema.safeParse({
      primary_market: formData.primary_market,
      epr_registration_number: formData.epr_registration_number,
      bis_r_number: formData.bis_r_number,
      iec_code: formData.iec_code,
      morth_manufacturer_code: formData.morth_manufacturer_code,
      eu_authorized_representative_name: formData.eu_authorized_representative_name,
      eu_authorized_representative_address: formData.eu_authorized_representative_address,
      eu_contact_email: formData.eu_contact_email,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        const key = String(e.path[0]);
        errs[key] = e.message;
      });
      setStep3Errors(errs);
    } else {
      setStep3Errors({});
    }
  }, [
    formData.primary_market,
    formData.epr_registration_number,
    formData.bis_r_number,
    formData.iec_code,
    formData.morth_manufacturer_code,
    formData.eu_authorized_representative_name,
    formData.eu_authorized_representative_address,
    formData.eu_contact_email,
    currentStep,
  ]);

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

  const handleComplete = async () => {
    setLoading(true);
    const companyName = user?.company_name || formData.company_name;
    if (!companyName) {
      toast.error("Company name is missing. Please refresh the page or contact support.");
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
        eu_authorized_representative_name: formData.eu_authorized_representative_name,
        eu_authorized_representative_address: formData.eu_authorized_representative_address,
        eu_contact_email: formData.eu_contact_email,
        morth_manufacturer_code: formData.morth_manufacturer_code,
        data_visibility: { primary_market: formData.primary_market },
        onboarding_completed: true,
      });
      if (response.data) {
        updateUser(response.data);
      } else {
        updateUser({ onboarding_completed: true });
      }
      try {
        await refreshUser();
      } catch {
        // safe to proceed
      }
      router.push(productRoutes(user?.product_type).dashboard);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(
        apiError.response?.data?.error || apiError.message || "Failed to save profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.support_email);
  const isStep1Valid =
    formData.company_name?.trim() !== "" &&
    formData.address.trim() !== "" &&
    emailValid;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 3:
        return Object.keys(step3Errors).length === 0;
      default:
        return true;
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Memoized by value (not recreated every render) — the hook's effect depends
  // on this object's identity, and an unstable identity here previously caused
  // an infinite fetch loop: fetch succeeds -> setState -> re-render -> new
  // object literal -> effect re-fires -> fetch again, every ~500ms forever,
  // which is what was showing up as UI flicker on the review step.
  const readinessDraft = useMemo(
    () => ({
      primary_market: formData.primary_market,
      epr_registration_number: formData.epr_registration_number,
      bis_r_number: formData.bis_r_number,
      iec_code: formData.iec_code,
      eu_authorized_representative_name: formData.eu_authorized_representative_name,
      eu_authorized_representative_address: formData.eu_authorized_representative_address,
      eu_contact_email: formData.eu_contact_email,
      morth_manufacturer_code: formData.morth_manufacturer_code,
    }),
    [
      formData.primary_market,
      formData.epr_registration_number,
      formData.bis_r_number,
      formData.iec_code,
      formData.eu_authorized_representative_name,
      formData.eu_authorized_representative_address,
      formData.eu_contact_email,
      formData.morth_manufacturer_code,
    ],
  );

  const { readiness, loading: readinessLoading } = useOnboardingReadiness(
    readinessDraft,
    currentStep
  );

  return (
    <OnboardingShell>
      <StepIndicator steps={steps} currentStep={currentStep} />

      <StepHeader
        stepNumber={currentStep}
        totalSteps={steps.length}
        title={steps[currentStep - 1].title}
        description={steps[currentStep - 1].description}
      />

      <motion.div className="bg-muted rounded-md p-6 relative overflow-visible">
        <AnimatePresence mode="wait" custom={direction}>
          <AnimatedStep stepKey={currentStep} direction={direction}>
            {currentStep === 1 && (
              <StepCompanyProfile
                formData={formData}
                onChange={updateField}
                errors={step1Errors}
              />
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <p className="text-muted-foreground text-sm">
                  Select the markets where you plan to sell your batteries. This helps us show
                  relevant compliance requirements.
                </p>
                <MarketSelector
                  value={formData.primary_market}
                  onChange={(v) => updateField("primary_market", v)}
                />
              </div>
            )}

            {currentStep === 3 && (
              <StepComplianceSetup
                formData={formData}
                onChange={updateField}
                onUploadSuccess={() => refreshUser()}
                certificateStatuses={{
                  epr: user?.epr_status,
                  bis: user?.bis_status,
                  pli: user?.pli_status,
                }}
                readiness={readiness}
                errors={step3Errors}
              />
            )}

            {currentStep === 4 && (
              <ReviewSummary
                formData={formData}
                onEdit={(step) => {
                  setDirection(-1);
                  setCurrentStep(step);
                }}
                readiness={readiness}
              />
            )}
          </AnimatedStep>
        </AnimatePresence>

        <OnboardingNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          canProceed={canProceed()}
          loading={loading}
          onBack={handleBack}
          onNext={handleNext}
          onComplete={handleComplete}
          canLaunch={(() => {
            if (readinessLoading || !readiness) return false;
            const markets =
              formData.primary_market === "both" ? ["india", "eu"] : [formData.primary_market];
            const scores: number[] = [];
            if (markets.includes("india") && readiness.india) scores.push(readiness.india.score);
            if (markets.includes("eu") && readiness.eu) scores.push(readiness.eu.score);
            return scores.length > 0 ? Math.min(...scores) >= 50 : true;
          })()}
          readinessLoading={readinessLoading}
          onNavigateToStep={(step) => {
            setDirection(step < currentStep ? -1 : 1);
            setCurrentStep(step);
          }}
        />
      </motion.div>

      {currentStep === 3 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground text-sm"
        >
          Don&apos;t have these details?{" "}
          <button type="button" onClick={handleNext} className="text-(--brand-link) hover:underline">
            Skip for now
          </button>
        </motion.p>
      )}
    </OnboardingShell>
  );
}

export default OnboardingPage;
