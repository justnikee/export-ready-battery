import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PLIFinancialCard } from "./PLIFinancialCard";
import { createMockBatch, createEmptyMockBatch } from "../__mocks__/batch.mock";

describe("PLIFinancialCard", () => {
  it("renders section title", () => {
    render(<PLIFinancialCard batch={createMockBatch()} />);
    expect(screen.getByText("PLI & Financial")).toBeInTheDocument();
  });

  it("shows DVA percentage", () => {
    render(<PLIFinancialCard batch={createMockBatch()} />);
    expect(screen.getByText("Domestic Value Add")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
  });

  it("shows PLI eligible badge when DVA >= 50%", () => {
    render(<PLIFinancialCard batch={createMockBatch()} />);
    expect(screen.getByText("PLI Eligible")).toBeInTheDocument();
  });

  it("shows empty state when no financial data", () => {
    render(<PLIFinancialCard batch={createEmptyMockBatch()} />);
    expect(screen.getByText("No financial data recorded")).toBeInTheDocument();
  });

  it("shows sale price and import cost", () => {
    const batch = createMockBatch({
      specs: {
        ...createMockBatch().specs,
        sale_price_inr: 150000,
        import_cost_inr: 60000,
      },
    });
    render(<PLIFinancialCard batch={batch} />);
    expect(screen.getByText("Sale Price")).toBeInTheDocument();
    expect(screen.getByText(/150,000/)).toBeInTheDocument();
    expect(screen.getByText("Import Cost")).toBeInTheDocument();
    expect(screen.getByText(/60,000/)).toBeInTheDocument();
  });
});
