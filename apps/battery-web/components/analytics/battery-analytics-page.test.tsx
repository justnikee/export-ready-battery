import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AnalyticsPage from "./battery-analytics-page";

// Mock auth context
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: { tenant_id: "test-tenant" } }),
}));

// Mock entitlements
vi.mock("@/hooks/use-entitlements", () => ({
  useEntitlements: () => ({
    has: () => false,
    requiredPlanFor: () => "GROWTH",
    labelFor: () => "",
  }),
}));

// Mock queries
vi.mock("@/hooks/use-queries", () => ({
  useAnalyticsOverview: () => ({ data: null, isLoading: true, refetch: vi.fn() }),
  useGapsByRegulation: () => ({ data: [], isLoading: true, refetch: vi.fn() }),
  useActionFeed: () => ({ data: [], isLoading: true, refetch: vi.fn() }),
  useDGFTValue: () => ({ data: null, isLoading: true, refetch: vi.fn() }),
}));

// Mock API
vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe("AnalyticsPage", () => {
  it("renders loading state initially", () => {
    render(<AnalyticsPage />);
    // When queries are loading, the component shows a loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
