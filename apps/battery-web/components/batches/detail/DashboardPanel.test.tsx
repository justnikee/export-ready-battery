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

  it("renders a bordered panel container", () => {
    const { container } = render(
      <DashboardPanel>
        <p>Content</p>
      </DashboardPanel>,
    );
    expect(container.firstChild).toHaveClass("border", "border-border");
  });

  it("applies the given id for anchor scrolling", () => {
    const { container } = render(
      <DashboardPanel id="activation-checklist">
        <p>Content</p>
      </DashboardPanel>,
    );
    expect(container.firstChild).toHaveAttribute("id", "activation-checklist");
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
