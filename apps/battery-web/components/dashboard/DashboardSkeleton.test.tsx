import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardSkeleton } from "./DashboardSkeleton";

describe("DashboardSkeleton", () => {
  it("renders a busy status region", () => {
    render(<DashboardSkeleton />);
    const region = screen.getByRole("status", { name: /loading dashboard/i });
    expect(region).toHaveAttribute("aria-busy", "true");
  });

  it("renders the 3-column KPI row matching the loaded dashboard", () => {
    const { container } = render(<DashboardSkeleton />);
    // battery-dashboard-page.tsx KPI row: grid grid-cols-1 sm:grid-cols-3 gap-4
    const kpiRow = container.querySelector(".sm\\:grid-cols-3");
    expect(kpiRow?.children.length).toBe(3);
  });

  it("renders a 5-row recent-batches table matching the loaded dashboard", () => {
    const { container } = render(<DashboardSkeleton />);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(5);
  });

  it("renders the production chart and batch-status donut at their real pixel sizes", () => {
    const { container } = render(<DashboardSkeleton />);
    // ProductionChart.tsx uses h-[280px] (== h-70); BatchStatusChart.tsx uses
    // h-[160px] w-[160px] (== h-40 w-40) — must match so swapping in real
    // content causes no layout shift.
    expect(container.querySelector(".h-70")).not.toBeNull();
    expect(container.querySelector(".h-40.w-40")).not.toBeNull();
  });
});
