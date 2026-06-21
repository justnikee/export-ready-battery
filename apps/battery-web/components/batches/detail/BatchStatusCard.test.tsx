import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchStatusCard } from "./BatchStatusCard";
import { createMockBatch } from "./__mocks__/batch.mock";

describe("BatchStatusCard", () => {
  it("renders the lifecycle stepper and a single export-readiness section", () => {
    render(
      <BatchStatusCard
        batch={createMockBatch({ status: "DRAFT" })}
        activationBlockerCount={2}
        passportCount={0}
        complianceScore={85}
        region="INDIA"
      />,
    );
    // Stepper stages
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Activated")).toBeInTheDocument();
    // One readiness section (not a competing "Export Readiness %")
    expect(screen.getByText("Export readiness")).toBeInTheDocument();
    // Supporting chips, not the stage-level ones
    expect(screen.getByText("Specs")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
    expect(screen.getByText("Certificates")).toBeInTheDocument();
  });

  it("does not duplicate stage signals as readiness chips", () => {
    render(
      <BatchStatusCard
        batch={createMockBatch({ status: "ACTIVE" })}
        activationBlockerCount={0}
        passportCount={10}
        complianceScore={90}
        region="INDIA"
      />,
    );
    // "Passports" appears only as a stepper stage label ("Passports issued"),
    // never as a duplicate readiness chip labelled exactly "Passports".
    expect(screen.queryByText("Passports")).not.toBeInTheDocument();
    expect(screen.getByText("Passports issued")).toBeInTheDocument();
  });

  it("shows the Carbon chip for EU but not India", () => {
    const { rerender } = render(
      <BatchStatusCard
        batch={createMockBatch({ status: "ACTIVE", market_region: "EU" })}
        activationBlockerCount={0}
        passportCount={5}
        complianceScore={90}
        region="EU"
      />,
    );
    expect(screen.getByText("Carbon")).toBeInTheDocument();

    rerender(
      <BatchStatusCard
        batch={createMockBatch({ status: "ACTIVE", market_region: "INDIA" })}
        activationBlockerCount={0}
        passportCount={5}
        complianceScore={90}
        region="INDIA"
      />,
    );
    expect(screen.queryByText("Carbon")).not.toBeInTheDocument();
  });
});
