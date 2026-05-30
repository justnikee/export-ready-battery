import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import AnalyticsPage from "./battery-analytics-page";

// Mock auth context
vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({ user: null }),
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
    // When user is null, the component shows a loading spinner
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
