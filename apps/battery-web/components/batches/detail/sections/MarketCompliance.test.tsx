import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarketCompliance } from "./MarketCompliance";
import { createMockBatch, createEmptyMockBatch } from "../__mocks__/batch.mock";

describe("MarketCompliance", () => {
  it("renders section title", () => {
    render(<MarketCompliance batch={createMockBatch()} />);
    expect(screen.getByText("Market & Compliance")).toBeInTheDocument();
  });

  it("shows target market based on region", () => {
    render(<MarketCompliance batch={createMockBatch()} />);
    expect(screen.getByText("IN")).toBeInTheDocument();
  });

  it("shows GLOBAL for global region", () => {
    const batch = createMockBatch({ market_region: "GLOBAL" });
    render(<MarketCompliance batch={batch} />);
    expect(screen.getByText("GLOBAL")).toBeInTheDocument();
  });

  it("shows certifications as norms", () => {
    render(<MarketCompliance batch={createMockBatch()} />);
    expect(screen.getByText("BIS")).toBeInTheDocument();
    expect(screen.getByText("UN38.3")).toBeInTheDocument();
  });

  it("shows GLOBAL for empty batch default region", () => {
    render(<MarketCompliance batch={createEmptyMockBatch()} />);
    expect(screen.getByText("GLOBAL")).toBeInTheDocument();
  });
});
