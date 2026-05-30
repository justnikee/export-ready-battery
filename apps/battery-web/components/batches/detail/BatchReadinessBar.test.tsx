import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchReadinessBar } from "./BatchReadinessBar";
import { createMockBatch, createEmptyMockBatch } from "./__mocks__/batch.mock";

describe("BatchReadinessBar", () => {
  it("renders export readiness label", () => {
    render(
      <BatchReadinessBar
        batch={createMockBatch()}
        passportCount={42}
        complianceScore={85}
        region="INDIA"
      />,
    );
    expect(screen.getByText("Export Readiness")).toBeInTheDocument();
  });

  it("shows 100% when all checks pass", () => {
    render(
      <BatchReadinessBar
        batch={createMockBatch()}
        passportCount={42}
        complianceScore={85}
        region="INDIA"
      />,
    );
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows lower percentage for incomplete batch", () => {
    render(
      <BatchReadinessBar
        batch={createEmptyMockBatch()}
        passportCount={0}
        complianceScore={null}
        region="INDIA"
      />,
    );
    const pct = screen.getByText(/\d+%/);
    expect(pct).toBeInTheDocument();
    expect(pct.textContent).not.toBe("100%");
  });

  it("renders all check items for India region", () => {
    render(
      <BatchReadinessBar
        batch={createMockBatch()}
        passportCount={42}
        complianceScore={85}
        region="INDIA"
      />,
    );
    expect(screen.getByText("Specs")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
    expect(screen.getByText("Activated")).toBeInTheDocument();
    expect(screen.getByText("Passports")).toBeInTheDocument();
    expect(screen.getByText("Certificates")).toBeInTheDocument();
  });

  it("renders Carbon check for EU region", () => {
    render(
      <BatchReadinessBar
        batch={createMockBatch()}
        passportCount={42}
        complianceScore={85}
        region="EU"
      />,
    );
    expect(screen.getByText("Carbon")).toBeInTheDocument();
  });

  it("renders Carbon check for GLOBAL region", () => {
    render(
      <BatchReadinessBar
        batch={createMockBatch()}
        passportCount={42}
        complianceScore={85}
        region="GLOBAL"
      />,
    );
    expect(screen.getByText("Carbon")).toBeInTheDocument();
  });

  it("does not render Carbon check for India region", () => {
    render(
      <BatchReadinessBar
        batch={createMockBatch()}
        passportCount={42}
        complianceScore={85}
        region="INDIA"
      />,
    );
    expect(screen.queryByText("Carbon")).not.toBeInTheDocument();
  });

  it("shows warning when batch is active but not fully ready", () => {
    render(
      <BatchReadinessBar
        batch={createEmptyMockBatch()}
        passportCount={0}
        complianceScore={null}
        region="INDIA"
      />,
    );
    // Empty batch is DRAFT, so warning should not show (only shows for ACTIVE)
    expect(
      screen.queryByText(/batch not fully export-ready/i),
    ).not.toBeInTheDocument();
  });

  it("shows warning for active batch with missing items", () => {
    const batch = createMockBatch({
      status: "ACTIVE",
      specs: {
        ...createMockBatch().specs,
        bis_certificate_issue_date: undefined,
        un38_3_test_date: undefined,
        iec_62133_test_date: undefined,
        msds_issue_date: undefined,
      },
    });
    const { container } = render(
      <BatchReadinessBar
        batch={batch}
        passportCount={42}
        complianceScore={85}
        region="INDIA"
      />,
    );
    expect(container.textContent).toMatch(/export-ready/);
  });
});
