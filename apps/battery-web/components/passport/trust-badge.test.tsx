import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrustBadge } from "./trust-badge";

describe("TrustBadge", () => {
  it("renders Self-Declared by default", () => {
    render(<TrustBadge />);
    expect(screen.getByText("Self-Declared")).toBeInTheDocument();
  });

  it("does not present LAB_CERTIFIED as independently verified", () => {
    render(<TrustBadge tier="LAB_CERTIFIED" />);
    expect(screen.getByText("Self-Declared")).toBeInTheDocument();
    expect(screen.queryByText("Lab Certified")).not.toBeInTheDocument();
  });

  it("still shows Blockchain Anchored when the hash is timestamped", () => {
    render(<TrustBadge tier="BLOCKCHAIN_ANCHORED" />);
    expect(screen.getByText("Blockchain Anchored")).toBeInTheDocument();
  });
});
