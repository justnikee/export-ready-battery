// Local types for batch detail page components
import type { Batch, Passport, CertificateAnchor, ComplianceGap } from "@/lib/types";

export type MarketRegion = "INDIA" | "EU" | "GLOBAL";

export type DetailTab = "overview" | "passports" | "compliance" | "downloads" | "registry";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface BatchResponse {
  batch: Batch;
  passport_count?: number;
}

export interface PassportsResponse {
  passports: Passport[];
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  has_more?: boolean;
}

export interface ActivationBlockers {
  blocking: string[];
  warnings: string[];
}

export type CertExpiryStatus = "valid" | "warning" | "expired" | "unset";

export interface CertExpiryResult {
  status: CertExpiryStatus;
  expiryDate: string | null;
  daysRemaining: number | null;
}

export interface BlockerAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
}

export interface InlineFixFieldDef {
  type: "select" | "number" | "text";
  options?: { value: string; label: string }[];
}
