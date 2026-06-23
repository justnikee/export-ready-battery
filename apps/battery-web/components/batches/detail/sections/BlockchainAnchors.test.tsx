import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlockchainAnchors } from "./BlockchainAnchors";
import type { CertificateAnchor } from "@/lib/types";

const mockAnchors: CertificateAnchor[] = [
  {
    id: "anchor-1",
    cert_type: "BIS",
    file_hash: "abc123def456",
    status: "confirmed",
    anchored_at: "2024-01-15T10:00:00Z",
    ots_proof: "proof-1",
  },
  {
    id: "anchor-2",
    cert_type: "UN38.3",
    file_hash: "xyz789uvw012",
    status: "pending",
  },
];

describe("BlockchainAnchors", () => {
  it("renders section title", () => {
    render(<BlockchainAnchors anchors={[]} anchorsLoading={false} />);
    expect(screen.getByText("Blockchain Anchors")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<BlockchainAnchors anchors={[]} anchorsLoading={true} />);
    expect(screen.getByText("Loading anchors...")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    render(<BlockchainAnchors anchors={[]} anchorsLoading={false} />);
    expect(
      screen.getByText(/No certificates anchored yet/i),
    ).toBeInTheDocument();
  });

  it("renders anchor items", () => {
    render(<BlockchainAnchors anchors={mockAnchors} anchorsLoading={false} />);
    expect(screen.getByText("BIS")).toBeInTheDocument();
    expect(screen.getByText("UN38.3")).toBeInTheDocument();
  });

  it("shows confirmed badge for confirmed anchors", () => {
    render(<BlockchainAnchors anchors={mockAnchors} anchorsLoading={false} />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("shows pending badge for pending anchors", () => {
    render(<BlockchainAnchors anchors={mockAnchors} anchorsLoading={false} />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders verify link when ots_proof exists", () => {
    render(<BlockchainAnchors anchors={mockAnchors} anchorsLoading={false} />);
    const verifyLink = screen.getByText("Verify");
    expect(verifyLink).toBeInTheDocument();
    expect(verifyLink.closest("a")).toHaveAttribute("href", expect.stringContaining("opentimestamps.org"));
  });
});
