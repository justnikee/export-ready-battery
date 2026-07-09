import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComplianceTab } from "./ComplianceTab";
import { createMockBatch } from "../__mocks__/batch.mock";
import type { ComplianceGap, CertificateAnchor } from "@/lib/types";
import type { CertExpiryResult } from "../types";

const mockGetCertificateExpiry = (
  _dateStr: string | undefined,
  _validityMonths: number,
): CertExpiryResult => ({
  status: "valid",
  expiryDate: "2027-01-15",
  daysRemaining: 365,
});

const defaultProps = {
  batch: createMockBatch(),
  user: null,
  complianceScore: 85,
  complianceGaps: [] as ComplianceGap[],
  complianceLoading: false,
  anchors: [] as CertificateAnchor[],
  anchorsLoading: false,
  getCertificateExpiry: mockGetCertificateExpiry,
  onDownloadComplianceReport: vi.fn(),
  onFetchBatch: vi.fn(),
  onSetConfirmCert: vi.fn(),
  patchingKey: null as string | null,
  isEU: false,
  isGlobal: false,
};

describe("ComplianceTab", () => {
  it("renders compliance engine section", () => {
    render(<ComplianceTab {...defaultProps} />);
    expect(screen.getByText("Compliance Engine")).toBeInTheDocument();
  });

  it("renders score ring with score", () => {
    render(<ComplianceTab {...defaultProps} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("shows passed status when score >= 80 and no errors", () => {
    render(<ComplianceTab {...defaultProps} />);
    expect(screen.getAllByText("Passed").length).toBeGreaterThan(0);
  });

  it("shows 'All compliance checks passed' when no gaps", () => {
    render(<ComplianceTab {...defaultProps} />);
    expect(
      screen.getByText(/All compliance checks passed/i),
    ).toBeInTheDocument();
  });

  it("renders blocking issues when errors exist", () => {
    const gaps: ComplianceGap[] = [
      {
        field: "specs.bis_number",
        message: "BIS number is required",
        severity: "ERROR",
        regulation: "BIS IS 16046",
      },
    ];
    render(<ComplianceTab {...defaultProps} complianceScore={60} complianceGaps={gaps} />);
    expect(screen.getByText("Blocking Issues (1)")).toBeInTheDocument();
    expect(screen.getByText("specs.bis_number")).toBeInTheDocument();
  });

  it("renders warnings when warnings exist", () => {
    const gaps: ComplianceGap[] = [
      {
        field: "specs.warranty_months",
        message: "Warranty should be at least 24 months",
        severity: "WARNING",
        regulation: "EU Battery Regulation",
      },
    ];
    render(<ComplianceTab {...defaultProps} complianceScore={90} complianceGaps={gaps} />);
    expect(screen.getByText("Advisory Warnings (1)")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<ComplianceTab {...defaultProps} complianceLoading={true} complianceScore={null} />);
    expect(screen.getByText(/Compliance Engine/i)).toBeInTheDocument();
  });

  it("renders blockchain anchors section", () => {
    render(<ComplianceTab {...defaultProps} />);
    expect(screen.getByText("Blockchain Anchors")).toBeInTheDocument();
  });

  it("renders carbon calculator for EU market", () => {
    const { container } = render(<ComplianceTab {...defaultProps} isEU={true} />);
    expect(container.querySelector("#carbon-calculator")).toBeInTheDocument();
  });

  it("renders carbon calculator for global market", () => {
    const { container } = render(<ComplianceTab {...defaultProps} isGlobal={true} />);
    expect(container.querySelector("#carbon-calculator")).toBeInTheDocument();
  });

  it("shows org-level certificates when user prop provided", () => {
    render(
      <ComplianceTab
        {...defaultProps}
        user={{ bis_r_number: "R-91234567", epr_registration_number: "EPR-001" }}
      />,
    );
    expect(screen.getByText("EPR Registration")).toBeInTheDocument();
    expect(screen.getByText("EPR: EPR-001")).toBeInTheDocument();
  });
});
