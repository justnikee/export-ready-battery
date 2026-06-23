import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoreSpecs } from "./CoreSpecs";
import { createMockBatch, createEmptyMockBatch } from "../__mocks__/batch.mock";

describe("CoreSpecs", () => {
  it("renders section title", () => {
    render(<CoreSpecs batch={createMockBatch()} />);
    expect(screen.getByText("Core Specifications")).toBeInTheDocument();
  });

  it("renders spec values", () => {
    render(<CoreSpecs batch={createMockBatch()} />);
    expect(screen.getByText("LFP")).toBeInTheDocument();
    expect(screen.getByText("100Ah")).toBeInTheDocument();
    expect(screen.getByText("3.2V")).toBeInTheDocument();
    expect(screen.getByText("25kg")).toBeInTheDocument();
    expect(screen.getByText("Test Mfg")).toBeInTheDocument();
    expect(screen.getByText("India")).toBeInTheDocument();
  });

  it("renders N/A for missing values", () => {
    render(<CoreSpecs batch={createEmptyMockBatch()} />);
    const naValues = screen.getAllByText("N/A");
    expect(naValues.length).toBeGreaterThan(0);
  });

  it("renders email link when present", () => {
    render(<CoreSpecs batch={createMockBatch()} />);
    const link = screen.getByText("test@example.com");
    expect(link).toBeInTheDocument();
    expect(link.tagName.toLowerCase()).toBe("a");
    expect(link).toHaveAttribute("href", "mailto:test@example.com");
  });

  it("renders address when present", () => {
    render(<CoreSpecs batch={createMockBatch()} />);
    expect(screen.getByText("123 Factory Rd, Shenzhen")).toBeInTheDocument();
  });

  it("renders recyclable status", () => {
    render(<CoreSpecs batch={createMockBatch()} />);
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("renders cell source with color", () => {
    const batch = createMockBatch({
      specs: { ...createMockBatch().specs, cell_source: "IMPORTED" },
    });
    render(<CoreSpecs batch={batch} />);
    expect(screen.getByText("IMPORTED")).toBeInTheDocument();
  });

  it("renders battery category", () => {
    const batch = createMockBatch({
      specs: { ...createMockBatch().specs, battery_category: "EV" },
    });
    render(<CoreSpecs batch={batch} />);
    expect(screen.getByText("EV")).toBeInTheDocument();
  });

  it("renders HSN code", () => {
    const batch = createMockBatch({
      specs: { ...createMockBatch().specs, hsn_code: "8507.60" },
    });
    render(<CoreSpecs batch={batch} />);
    expect(screen.getByText("8507.60")).toBeInTheDocument();
  });

  it("renders BIS number", () => {
    const batch = createMockBatch({
      specs: { ...createMockBatch().specs, bis_number: "R-12345" },
    });
    render(<CoreSpecs batch={batch} />);
    expect(screen.getByText("R-12345")).toBeInTheDocument();
  });

  it("renders EPR number", () => {
    const batch = createMockBatch({
      specs: { ...createMockBatch().specs, epr_number: "EPR-001" },
    });
    render(<CoreSpecs batch={batch} />);
    expect(screen.getByText("EPR-001")).toBeInTheDocument();
  });

  it("renders lifetime cycles", () => {
    const batch = createMockBatch({
      specs: { ...createMockBatch().specs, expected_lifetime_cycles: 3000 },
    });
    render(<CoreSpecs batch={batch} />);
    expect(screen.getByText("3,000")).toBeInTheDocument();
  });

  it("renders warranty months", () => {
    const batch = createMockBatch({
      specs: { ...createMockBatch().specs, warranty_months: 36 },
    });
    render(<CoreSpecs batch={batch} />);
    expect(screen.getByText("36 months")).toBeInTheDocument();
  });
});
