import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CertificateStatus } from "./CertificateStatus";
import { createMockBatch, createEmptyMockBatch } from "../__mocks__/batch.mock";
import type { CertExpiryResult } from "../types";

const mockGetCertificateExpiry = (
  _dateStr: string | undefined,
  _validityMonths: number,
): CertExpiryResult => ({
  status: "valid",
  expiryDate: "2027-01-15",
  daysRemaining: 365,
});

const mockGetExpired = (
  _dateStr: string | undefined,
  _validityMonths: number,
): CertExpiryResult => ({
  status: "expired",
  expiryDate: "2024-01-15",
  daysRemaining: null,
});

const mockGetWarning = (
  _dateStr: string | undefined,
  _validityMonths: number,
): CertExpiryResult => ({
  status: "warning",
  expiryDate: "2026-08-07",
  daysRemaining: 30,
});

describe("CertificateStatus", () => {
  it("renders section title", () => {
    render(
      <CertificateStatus
        batch={createMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("Certificate Tracker")).toBeInTheDocument();
  });

  it("renders empty state when no certificates", () => {
    render(
      <CertificateStatus
        batch={createEmptyMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("No certificates uploaded yet")).toBeInTheDocument();
  });

  it("renders certificate cards for valid certs", () => {
    render(
      <CertificateStatus
        batch={createMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("BIS IS 16046")).toBeInTheDocument();
    expect(screen.getByText("UN38.3")).toBeInTheDocument();
    expect(screen.getByText("IEC 62133")).toBeInTheDocument();
    expect(screen.getByText("MSDS")).toBeInTheDocument();
  });

  it("shows valid badge for valid certs", () => {
    render(
      <CertificateStatus
        batch={createMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getAllByText("365d left").length).toBeGreaterThan(0);
  });

  it("shows expired badge for expired certs", () => {
    render(
      <CertificateStatus
        batch={createMockBatch()}
        getCertificateExpiry={mockGetExpired}
      />,
    );
    expect(screen.getAllByText("Expired").length).toBeGreaterThan(0);
  });

  it("shows warning badge for expiring certs", () => {
    render(
      <CertificateStatus
        batch={createMockBatch()}
        getCertificateExpiry={mockGetWarning}
      />,
    );
    expect(screen.getAllByText("30d left").length).toBeGreaterThan(0);
  });
});
