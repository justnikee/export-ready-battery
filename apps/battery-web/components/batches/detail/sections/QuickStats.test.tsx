import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuickStats } from "./QuickStats";
import { createMockBatch, createEmptyMockBatch } from "../__mocks__/batch.mock";

describe("QuickStats", () => {
  it("renders all four stat cards", () => {
    render(<QuickStats batch={createMockBatch()} passportCount={42} />);
    expect(screen.getByText("Passports")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
    expect(screen.getByText("Passports")).toBeInTheDocument();
    expect(screen.getByText("Gaps")).toBeInTheDocument();
  });

  it("displays correct values for active batch", () => {
    render(<QuickStats batch={createMockBatch()} passportCount={42} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getAllByText("42").length).toBeGreaterThan(0);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0); // gaps = 1 when score < 100
  });

  it("shows -- for missing compliance score", () => {
    render(<QuickStats batch={createEmptyMockBatch()} passportCount={0} />);
    expect(screen.getByText("--%")).toBeInTheDocument();
  });

  it("shows gap count when compliance score is below 100", () => {
    const batch = createMockBatch({ compliance_score: 75 });
    render(<QuickStats batch={batch} passportCount={42} />);
    expect(screen.getByText("1")).toBeInTheDocument(); // gaps = 1
  });
});
