import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewTab } from "./OverviewTab";
import { createMockBatch } from "../__mocks__/batch.mock";
import type { CertExpiryResult } from "../types";

const mockGetCertificateExpiry = (
  _dateStr: string | undefined,
  _validityMonths: number,
): CertExpiryResult => ({
  status: "valid",
  daysRemaining: 365,
});

describe("OverviewTab", () => {
  it("renders QuickStats section", () => {
    render(
      <OverviewTab
        batch={createMockBatch()}
        passportCount={42}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("Passports")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
  });

  it("renders CoreSpecs section", () => {
    render(
      <OverviewTab
        batch={createMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("Core Specifications")).toBeInTheDocument();
    expect(screen.getByText("LFP")).toBeInTheDocument();
  });

  it("renders MarketCompliance section", () => {
    render(
      <OverviewTab
        batch={createMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("Market & Compliance")).toBeInTheDocument();
  });

  it("renders CertificateStatus section", () => {
    render(
      <OverviewTab
        batch={createMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("Certificate Tracker")).toBeInTheDocument();
  });

  it("renders MaterialComposition section", () => {
    render(
      <OverviewTab
        batch={createMockBatch()}
        getCertificateExpiry={mockGetCertificateExpiry}
      />,
    );
    expect(screen.getByText("Material Composition")).toBeInTheDocument();
  });
});
