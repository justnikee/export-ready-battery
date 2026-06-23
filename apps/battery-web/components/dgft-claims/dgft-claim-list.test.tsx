import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider } from "@/context/auth-context";
import DGFTClaimsPage from "./dgft-claim-list";

const mockGet = vi.fn();

vi.mock("@/lib/api", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
  refreshAccessToken: () => Promise.resolve(null),
  setAccessToken: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/dgft-claims",
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithAuth(ui: React.ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("DGFTClaimsPage", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderWithAuth(<DGFTClaimsPage />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it("renders empty state when no claims", async () => {
    mockGet.mockResolvedValue({ data: { claims: [], total: 0 } });
    renderWithAuth(<DGFTClaimsPage />);
    await waitFor(() => {
      expect(screen.getByText("No claims yet")).toBeTruthy();
    });
    expect(screen.getByText(/DGFT export incentive claim/)).toBeTruthy();
  });

  it("renders claim list with correct data", async () => {
    mockGet.mockResolvedValue({
      data: {
        claims: [
          {
            id: "claim-1",
            scheme_type: "RODTEP",
            status: "DRAFT",
            claim_period_start: "2026-01-01",
            claim_period_end: "2026-03-31",
            hsn_code: "8507.60",
            destination_country: "DE",
            export_value_inr: 1500000,
            export_quantity: 500,
            estimated_claim_amount: 22500,
            created_at: "2026-05-30T10:00:00Z",
            updated_at: "2026-05-30T10:00:00Z",
          },
        ],
        total: 1,
      },
    });
    renderWithAuth(<DGFTClaimsPage />);
    await waitFor(() => {
      expect(screen.getByText("RODTEP")).toBeTruthy();
    });
    expect(screen.getByText("8507.60")).toBeTruthy();
    expect(screen.getByText(/DRAFT/)).toBeTruthy();
  });

  it("opens new claim dialog", async () => {
    mockGet.mockResolvedValue({ data: { claims: [], total: 0 } });
    renderWithAuth(<DGFTClaimsPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /New Claim/i })).toBeTruthy();
    });
    fireEvent.click(screen.getAllByRole("button", { name: /New Claim/i })[0]);
    expect(screen.getByRole("heading", { name: "New DGFT Claim" })).toBeTruthy();
  });

  it("filters by scheme type", async () => {
    mockGet.mockResolvedValue({ data: { claims: [], total: 0 } });
    renderWithAuth(<DGFTClaimsPage />);
    await waitFor(() => {
      expect(screen.getByText("No claims yet")).toBeTruthy();
    });
    // The scheme filter select should be present
    expect(screen.getByText("All Schemes")).toBeTruthy();
  });
});
