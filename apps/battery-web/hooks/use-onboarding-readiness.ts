"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

export interface Gap {
  field: string;
  market?: string;
  regulation?: string;
  message: string;
  severity: "ERROR" | "WARNING";
}

export interface MarketReadiness {
  score: number;
  valid: boolean;
  gaps?: Gap[];
}

export interface ReadinessResult {
  india?: MarketReadiness;
  eu?: MarketReadiness;
}

interface DraftProfile {
  primary_market: string;
  epr_registration_number: string;
  bis_r_number: string;
  iec_code: string;
  eu_authorized_representative_name: string;
  eu_authorized_representative_address: string;
  eu_contact_email: string;
  morth_manufacturer_code: string;
}

export function useOnboardingReadiness(draft: DraftProfile, step: number) {
  const enabled = step === 3 || step === 4;
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Use a ref to track the latest enabled state so async callbacks
  // can bail out if the user has navigated away from steps 3/4.
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const fetchReadiness = useCallback(async () => {
    if (!enabledRef.current) return;
    setLoading(true);

    const controller = new AbortController();
    try {
      const response = await api.post("/auth/readiness", draft, {
        signal: controller.signal,
      });
      if (enabledRef.current) {
        setReadiness(response.data);
      }
    } catch {
      if (enabledRef.current) {
        setReadiness(null);
      }
    } finally {
      if (enabledRef.current) {
        setLoading(false);
      }
    }
  }, [draft]);

  useEffect(() => {
    if (!enabled) {
      setReadiness(null);
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      fetchReadiness();
    }, 500);
    return () => clearTimeout(timer);
  }, [draft, enabled, fetchReadiness]);

  return { readiness, loading, refetch: fetchReadiness };
}
