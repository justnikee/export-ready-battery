import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegistryVerificationsTab } from "./RegistryVerificationsTab";
import type { RegistryVerification } from "@/lib/types";

const defaultProps = {
  batchId: "batch-123",
  verifications: [] as RegistryVerification[],
  verificationsLoading: false,
  onRefresh: vi.fn(),
};

function createMockVerification(
  overrides: Partial<RegistryVerification> = {},
): RegistryVerification {
  return {
    id: "rv-1",
    tenant_id: "tenant-1",
    batch_id: "batch-123",
    registry_type: "bis",
    certificate_no: "R-91234567",
    status: "verified",
    trust_tier: "official_api",
    verified_at: "2026-05-20T10:00:00Z",
    expires_at: "2026-08-20T10:00:00Z",
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

describe("RegistryVerificationsTab", () => {
  it("renders header section", () => {
    render(<RegistryVerificationsTab {...defaultProps} />);
    expect(
      screen.getByText("Registry checks"),
    ).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders auto-verify button", () => {
    render(<RegistryVerificationsTab {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Run all registry checks/i }),
    ).toBeInTheDocument();
  });

  it("shows all 4 registry cards when no verifications exist", () => {
    render(<RegistryVerificationsTab {...defaultProps} />);
    expect(screen.getByText("BIS")).toBeInTheDocument();
    expect(screen.getByText("CPCB EPR")).toBeInTheDocument();
    expect(screen.getByText("EU NANDO")).toBeInTheDocument();
    expect(screen.getByText("UN38.3")).toBeInTheDocument();
  });

  it("renders verification status for existing checks", () => {
    const verifications = [
      createMockVerification({ registry_type: "bis", status: "verified" }),
      createMockVerification({
        id: "rv-2",
        registry_type: "cpcb",
        status: "error",
        trust_tier: "self_declared",
        error_message: "Registry timeout",
      }),
    ];
    render(
      <RegistryVerificationsTab {...defaultProps} verifications={verifications} />,
    );
    expect(screen.getByText("Official API")).toBeInTheDocument();
    expect(screen.getAllByText("Self-declared").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Registry timeout")).toBeInTheDocument();
  });

  it("shows certificate number when available", () => {
    const verifications = [
      createMockVerification({ certificate_no: "R-91234567" }),
    ];
    render(
      <RegistryVerificationsTab {...defaultProps} verifications={verifications} />,
    );
    expect(screen.getByText("R-91234567")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <RegistryVerificationsTab {...defaultProps} verificationsLoading={true} />,
    );
    expect(
      screen.getByText("Registry checks"),
    ).toBeInTheDocument();
  });

  it("shows re-verify buttons for each registry", () => {
    render(<RegistryVerificationsTab {...defaultProps} />);
    const buttons = screen.getAllByRole("button", { name: /Re-check/i });
    expect(buttons.length).toBe(4);
  });

  it("labels CPCB format-only as Format valid, not Registry Verified", () => {
    const verifications = [
      createMockVerification({
        registry_type: "cpcb",
        status: "format_valid",
        trust_tier: "format_valid",
        certificate_no: "B-29016/2024-25/CPCB",
      }),
    ];
    render(
      <RegistryVerificationsTab {...defaultProps} verifications={verifications} />,
    );
    expect(screen.getByText("Format valid")).toBeInTheDocument();
    expect(screen.queryByText("Registry Verified")).not.toBeInTheDocument();
    expect(screen.getByText(/Format checked:/)).toBeInTheDocument();
  });
});
