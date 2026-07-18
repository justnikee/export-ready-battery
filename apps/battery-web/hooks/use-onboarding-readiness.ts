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
  company_name: string;
  address: string;
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
  // can bail out if the user has navigated away from steps 3/4. Synced in an
  // effect (not written during render) so it stays a pure read on every render.
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  });

  // Tracks the in-flight request's controller so a newer call can cancel a
  // still-pending older one — without this, a slow earlier response could
  // resolve after a newer one and clobber it with stale readiness data.
  const abortRef = useRef<AbortController | null>(null);

  const fetchReadiness = useCallback(async () => {
    if (!enabledRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const response = await api.post("/auth/readiness", draft, {
        signal: controller.signal,
      });
      if (enabledRef.current && !controller.signal.aborted) {
        setReadiness(response.data);
      }
    } catch {
      if (enabledRef.current && !controller.signal.aborted) {
        setReadiness(null);
      }
    } finally {
      if (enabledRef.current && !controller.signal.aborted) {
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
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [draft, enabled, fetchReadiness]);

  return { readiness, loading, refetch: fetchReadiness };
}
