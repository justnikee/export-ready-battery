import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SustainabilityCard } from "./SustainabilityCard";
import { createMockBatch, createEmptyMockBatch } from "../__mocks__/batch.mock";

describe("SustainabilityCard", () => {
  it("renders section title", () => {
    render(<SustainabilityCard batch={createMockBatch()} />);
    expect(screen.getByText("Sustainability")).toBeInTheDocument();
  });

  it("renders carbon footprint", () => {
    render(<SustainabilityCard batch={createMockBatch()} />);
    expect(screen.getByText("Carbon Footprint")).toBeInTheDocument();
    expect(screen.getByText("120 kg CO2e")).toBeInTheDocument();
  });

  it("shows recyclable status", () => {
    render(<SustainabilityCard batch={createMockBatch()} />);
    expect(screen.getByText("Recyclable")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(<SustainabilityCard batch={createEmptyMockBatch()} />);
    expect(screen.getByText("Not calculated")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("shows carbon result when available", () => {
    const batch = createMockBatch({
      carbon_footprint_result: { total: 120, breakdown: {} },
    });
    render(<SustainabilityCard batch={batch} />);
    expect(screen.getByText("Carbon Result")).toBeInTheDocument();
    expect(screen.getByText("Calculated")).toBeInTheDocument();
  });
});
