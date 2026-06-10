import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "./battery-dashboard-page";

vi.mock("@/context/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      tenant_id: "tenant-1",
      email: "test@example.com",
      company_name: "Acme Battery Co",
      product_type: "BATTERY",
    },
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/dashboard/ProductionChart", () => ({
  ProductionChart: () => <div data-testid="production-chart" />,
}));
vi.mock("@/components/dashboard/BatchStatusChart", () => ({
  BatchStatusChart: () => <div data-testid="batch-status-chart" />,
}));
vi.mock("@/components/dashboard/ScanMap", () => ({
  ScanMap: () => <div data-testid="scan-map" />,
}));

describe("DashboardPage", () => {
  it("renders stats and recent batches from /dashboard/stats, /batches/chart-data and /batches/recent", async () => {
    render(<DashboardPage />);

    // Recent batch name comes from GET /batches/recent
    await waitFor(() => {
      expect(screen.getByText("June Production Run")).toBeInTheDocument();
    });

    // total_passports from GET /dashboard/stats
    expect(screen.getByText("120")).toBeInTheDocument();

    // Chart renders once /batches/chart-data resolves
    expect(screen.getByTestId("production-chart")).toBeInTheDocument();
  });
});
