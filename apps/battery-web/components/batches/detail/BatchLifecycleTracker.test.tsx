import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BatchLifecycleTracker } from "./BatchLifecycleTracker";

describe("BatchLifecycleTracker", () => {
  it("tells a draft with blockers to clear requirements", () => {
    render(<BatchLifecycleTracker status="DRAFT" activationBlockerCount={3} passportCount={0} />);
    expect(screen.getByText(/clear 3 activation requirements/i)).toBeInTheDocument();
  });

  it("tells a compliance-ready draft to activate (credits are per passport)", () => {
    render(<BatchLifecycleTracker status="DRAFT" activationBlockerCount={0} passportCount={0} />);
    expect(screen.getByText(/activate this batch/i)).toBeInTheDocument();
    expect(screen.getByText(/1 per passport/i)).toBeInTheDocument();
  });

  it("states N credits when the draft already has passports", () => {
    render(<BatchLifecycleTracker status="DRAFT" activationBlockerCount={0} passportCount={200} />);
    expect(screen.getByText(/uses 200 activation credits/i)).toBeInTheDocument();
  });

  it("tells an active batch with no passports to add passports", () => {
    render(<BatchLifecycleTracker status="ACTIVE" activationBlockerCount={0} passportCount={0} />);
    expect(screen.getByText(/add passports/i)).toBeInTheDocument();
  });

  it("reports a fully active batch with passports as available", () => {
    render(<BatchLifecycleTracker status="ACTIVE" activationBlockerCount={0} passportCount={50} />);
    expect(screen.getByText(/labels, passports & compliance reports are available/i)).toBeInTheDocument();
  });

  it("marks an archived batch read-only", () => {
    render(<BatchLifecycleTracker status="ARCHIVED" activationBlockerCount={0} passportCount={10} />);
    expect(screen.getByText(/archived — read-only/i)).toBeInTheDocument();
  });

  it("renders all four lifecycle stages", () => {
    render(<BatchLifecycleTracker status="DRAFT" activationBlockerCount={1} passportCount={0} />);
    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Compliance ready")).toBeInTheDocument();
    expect(screen.getByText("Activated")).toBeInTheDocument();
    expect(screen.getByText("Passports issued")).toBeInTheDocument();
  });
});
