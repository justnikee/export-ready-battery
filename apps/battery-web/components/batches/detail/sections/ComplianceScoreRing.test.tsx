import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComplianceScoreRing } from "./ComplianceScoreRing";

describe("ComplianceScoreRing", () => {
  it("renders score percentage", () => {
    render(<ComplianceScoreRing score={85} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("shows 'Passed' for score >= 80", () => {
    render(<ComplianceScoreRing score={85} />);
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByText("All checks passed")).toBeInTheDocument();
  });

  it("shows 'Partial' for score between 50 and 79", () => {
    render(<ComplianceScoreRing score={65} />);
    expect(screen.getByText("Partial")).toBeInTheDocument();
    expect(screen.getByText("Some issues need attention")).toBeInTheDocument();
  });

  it("shows 'Failing' for score < 50", () => {
    render(<ComplianceScoreRing score={30} />);
    expect(screen.getByText("Failing")).toBeInTheDocument();
    expect(screen.getByText("Critical issues found")).toBeInTheDocument();
  });

  it("renders SVG ring", () => {
    const { container } = render(<ComplianceScoreRing score={75} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelectorAll("circle").length).toBe(2);
  });
});
