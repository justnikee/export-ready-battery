import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CertificateView, type PassportViewData } from "./certificate-view";
import {
  PASSPORT_FEB_2027_CAPTION,
  PASSPORT_NOT_IN_FORCE,
  PASSPORT_RESTRICTED_LINE,
} from "@/lib/passport-honesty";

vi.mock("@/lib/document-url", () => ({
  openPublicPassportDocument: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function lmtPassport(
  overrides: Partial<PassportViewData> = {},
): PassportViewData {
  return {
    passport: {
      uuid: "11111111-1111-1111-1111-111111111111",
      serial_number: "BPAN-LMT-001",
      status: "ACTIVE",
      manufacture_date: "2026-01-15",
    },
    specs: {
      chemistry: "LFP",
      battery_category: "LMT",
      capacity: "2.5 kWh",
      voltage: "48V",
      recycled_content_pct: 12,
    },
    tenant: { company_name: "Demo Packs Pvt Ltd" },
    model_name: "LMT-48",
    market_region: "EU",
    product_type: "BATTERY",
    carbon_performance_class: "B",
    access_tier: "PUBLIC",
    ...overrides,
  };
}

describe("CertificateView (Wave 3 public honesty)", () => {
  it("shows identity for an LMT lot without CPCB-verified or Art. 7 class theater", () => {
    render(<CertificateView passport={lmtPassport()} locale="en" />);

    expect(screen.getAllByText("BPAN-LMT-001").length).toBeGreaterThan(0);
    expect(screen.getByText("LMT")).toBeInTheDocument();
    expect(screen.getByText("Demo Packs Pvt Ltd")).toBeInTheDocument();

    expect(screen.queryByText("CPCB verified")).not.toBeInTheDocument();
    expect(screen.queryByText(/Lab Certified/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Official Battery Pack Aadhaar/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Battery Passport Registry")).not.toBeInTheDocument();
    expect(screen.queryByText("Fiber Supplier")).not.toBeInTheDocument();
    expect(screen.queryByText(/ZDHC/i)).not.toBeInTheDocument();

    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getAllByText(PASSPORT_FEB_2027_CAPTION).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Article 7/i)).not.toBeInTheDocument();
  });

  it("shows Not in force / Not provided when carbon class is absent", () => {
    render(
      <CertificateView
        passport={lmtPassport({
          carbon_performance_class: undefined,
          specs: {
            chemistry: "LFP",
            battery_category: "LMT",
            recycled_content_pct: null,
          },
        })}
        locale="en"
      />,
    );

    expect(screen.getAllByText(PASSPORT_NOT_IN_FORCE).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Due diligence report")).toBeInTheDocument();
  });

  it("tells a public scanner that repair/dismantling is not on this page", () => {
    render(<CertificateView passport={lmtPassport()} locale="en" />);
    expect(screen.getByText(PASSPORT_RESTRICTED_LINE)).toBeInTheDocument();
    expect(screen.queryByText("Repair History")).not.toBeInTheDocument();
    expect(screen.queryByText("Ownership Records")).not.toBeInTheDocument();
  });
});
