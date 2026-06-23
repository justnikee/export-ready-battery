import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DownloadsTab } from "./DownloadsTab";

const defaultProps = {
  isDraft: false,
  isEU: false,
  isGlobal: false,
  hasCarbonFootprint: false,
  onPrintLabels: vi.fn(),
  onDownloadQR: vi.fn(),
  onExportCSV: vi.fn(),
  onExportAuditCSV: vi.fn(),
  onDownloadComplianceReport: vi.fn(),
  onExportComplianceDeclaration: vi.fn(),
  onExportDueDiligence: vi.fn(),
};

describe("DownloadsTab", () => {
  it("renders all sections", () => {
    render(<DownloadsTab {...defaultProps} />);
    expect(screen.getByText("Passport Documents")).toBeInTheDocument();
    expect(screen.getByText("Compliance Documents")).toBeInTheDocument();
    expect(screen.getByText("Audit & Traceability")).toBeInTheDocument();
  });

  it("renders download cards with correct formats", () => {
    render(<DownloadsTab {...defaultProps} />);
    expect(screen.getAllByText("PDF").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ZIP").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CSV").length).toBeGreaterThan(0);
  });

  it("calls onPrintLabels when clicked", () => {
    render(<DownloadsTab {...defaultProps} />);
    const btn = screen.getByRole("button", { name: /Print Labels/i });
    fireEvent.click(btn);
    expect(defaultProps.onPrintLabels).toHaveBeenCalled();
  });

  it("disables buttons when batch is draft", () => {
    render(<DownloadsTab {...defaultProps} isDraft={true} />);
    const labelsBtn = screen.getByRole("button", { name: /Print Labels/i });
    expect(labelsBtn).toBeDisabled();
  });

  it("shows EU documents when isEU is true", () => {
    render(<DownloadsTab {...defaultProps} isEU={true} />);
    expect(screen.getByText("Carbon Declaration")).toBeInTheDocument();
    expect(screen.getByText("Due Diligence")).toBeInTheDocument();
  });

  it("shows EU documents when isGlobal is true", () => {
    render(<DownloadsTab {...defaultProps} isGlobal={true} />);
    expect(screen.getByText("Carbon Declaration")).toBeInTheDocument();
    expect(screen.getByText("Due Diligence")).toBeInTheDocument();
  });
});
