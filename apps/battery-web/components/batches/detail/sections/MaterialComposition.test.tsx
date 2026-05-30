import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MaterialComposition } from "./MaterialComposition";
import { createMockBatch, createEmptyMockBatch } from "../__mocks__/batch.mock";

describe("MaterialComposition", () => {
  it("renders section title", () => {
    render(<MaterialComposition batch={createMockBatch()} />);
    expect(screen.getByText("Material Composition")).toBeInTheDocument();
  });

  it("renders material bars with percentages", () => {
    render(<MaterialComposition batch={createMockBatch()} />);
    expect(screen.getByText("Cobalt")).toBeInTheDocument();
    expect(screen.getByText("5%")).toBeInTheDocument();
    expect(screen.getByText("Lithium")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
  });

  it("renders empty state when no material composition", () => {
    render(<MaterialComposition batch={createEmptyMockBatch()} />);
    expect(screen.getByText("No material data recorded")).toBeInTheDocument();
  });

  it("renders empty state when all percentages are zero/undefined", () => {
    const batch = createMockBatch({
      specs: {
        ...createMockBatch().specs,
        material_composition: {},
      },
    });
    render(<MaterialComposition batch={batch} />);
    expect(screen.getByText("No material data recorded")).toBeInTheDocument();
  });

  it("renders progress bars for each material", () => {
    const { container } = render(<MaterialComposition batch={createMockBatch()} />);
    const bars = container.querySelectorAll(".h-full");
    expect(bars.length).toBeGreaterThan(0);
  });
});
