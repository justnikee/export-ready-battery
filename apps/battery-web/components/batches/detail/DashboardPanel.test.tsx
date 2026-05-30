import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardPanel } from "./DashboardPanel";

describe("DashboardPanel", () => {
  it("renders children", () => {
    render(
      <DashboardPanel>
        <p data-testid="child">Content</p>
      </DashboardPanel>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <DashboardPanel className="custom-class">
        <p>Content</p>
      </DashboardPanel>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders corner squares", () => {
    const { container } = render(
      <DashboardPanel>
        <p>Content</p>
      </DashboardPanel>,
    );
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(4);
  });

  it("renders without padding when noPadding is true", () => {
    const { container } = render(
      <DashboardPanel noPadding>
        <p>Content</p>
      </DashboardPanel>,
    );
    expect(container.firstChild).not.toHaveClass("p-4");
  });
});
