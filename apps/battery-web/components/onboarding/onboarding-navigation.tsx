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
  const backBtn = (
    <button
      type="button"
      onClick={onBack}
      disabled={currentStep === 1}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 500,
        transition: "all 0.15s",
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.1)",
        color: currentStep === 1 ? "rgba(100,116,139,0.5)" : "#94a3b8",
        cursor: currentStep === 1 ? "not-allowed" : "pointer",
      }}
    >
      <ArrowLeft style={{ width: 15, height: 15 }} />
      Back
    </button>
  );

  if (currentStep < totalSteps) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "12px" }}>
        {backBtn}
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            background: canProceed ? "#10b981" : "rgba(16,185,129,0.3)",
            color: canProceed ? "#fff" : "rgba(255,255,255,0.4)",
            border: "none",
            cursor: canProceed ? "pointer" : "not-allowed",
            transition: "all 0.15s",
            boxShadow: canProceed ? "0 0 20px rgba(16,185,129,0.25)" : "none",
          }}
        >
          Continue
          <ArrowRight style={{ width: 15, height: 15 }} />
        </button>
      </div>
    );
  }

  if (readinessLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "12px" }}>
        {backBtn}
        <button
          type="button"
          disabled
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            background: "rgba(16,185,129,0.3)",
            color: "rgba(255,255,255,0.4)",
            border: "none",
            cursor: "not-allowed",
          }}
        >
          <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "rgba(255,255,255,0.7)", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
          Checking readiness...
        </button>
      </div>
    );
  }

  if (canLaunch) {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "12px" }}>
        {backBtn}
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            background: loading ? "rgba(16,185,129,0.4)" : "#10b981",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            boxShadow: loading ? "none" : "0 0 20px rgba(16,185,129,0.25)",
          }}
        >
          {loading ? (
            <>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
              Setting up...
            </>
          ) : (
            <>
              <Sparkles style={{ width: 15, height: 15 }} />
              Launch Dashboard
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: "12px" }}>
      {backBtn}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onNavigateToStep?.(3)}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500,
            background: "#f59e0b",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
            transition: "all 0.15s",
          }}
        >
          <AlertTriangle style={{ width: 15, height: 15 }} />
          Complete Compliance Setup
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          style={{
            fontSize: "12px",
            color: "#475569",
            background: "none",
            border: "none",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? "Setting up..." : "Skip for now — I'll add compliance details later"}
        </button>
      </div>
    </div>
  );
}
