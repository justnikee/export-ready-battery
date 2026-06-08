"use client";

import { ArrowLeft, ArrowRight, Sparkles, AlertTriangle } from "lucide-react";

interface OnboardingNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
  canLaunch?: boolean;
  onNavigateToStep?: (step: number) => void;
  readinessLoading?: boolean;
}

export function OnboardingNavigation({
  currentStep,
  totalSteps,
  canProceed,
  loading,
  onBack,
  onNext,
  onComplete,
  canLaunch = true,
  onNavigateToStep,
  readinessLoading = false,
}: OnboardingNavigationProps) {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t border-border">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 1}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-none text-sm font-medium transition-all ${
          currentStep === 1
            ? "text-muted-foreground cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {currentStep < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-none bg-primary text-primary-foreground text-sm hover:bg-primary/90 focus:outline-none focus:ring-[3px] focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : readinessLoading ? (
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-none bg-primary text-primary-foreground text-sm opacity-50 cursor-not-allowed transition-all"
        >
          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          Checking readiness...
        </button>
      ) : canLaunch ? (
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-none bg-primary text-primary-foreground text-sm hover:bg-primary/90 focus:outline-none focus:ring-[3px] focus:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Launch Dashboard
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onNavigateToStep?.(3)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-none bg-amber-500 text-white text-sm hover:bg-amber-600 focus:outline-none focus:ring-[3px] focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <AlertTriangle className="w-4 h-4" />
          Complete Compliance Setup
        </button>
      )}
    </div>
  );
}
