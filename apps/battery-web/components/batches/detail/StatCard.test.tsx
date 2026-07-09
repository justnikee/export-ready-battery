import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./StatCard";
import { Battery } from "lucide-react";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(
      <StatCard
        label="Quantity"
        value="1,234"
        icon={<Battery data-testid="icon" />}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      />,
    );
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders icon", () => {
    render(
      <StatCard
        label="Test"
        value="100"
        icon={<Battery data-testid="icon" />}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders a filled card container", () => {
    const { container } = render(
      <StatCard
        label="Test"
        value="100"
        icon={<Battery />}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      />,
    );
    expect(container.firstChild).toHaveClass("bg-background", "rounded-md");
  });

  it("applies monospace styling to label and value", () => {
    render(
      <StatCard
        label="Quantity"
        value="1,234"
        icon={<Battery />}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      />,
    );
    expect(screen.getByText("Quantity")).toHaveClass("font-mono");
    expect(screen.getByText("1,234")).toHaveClass("font-mono");
  });
});
