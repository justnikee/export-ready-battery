import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { TopBarSkeleton } from "./TopBarSkeleton";

describe("TopBarSkeleton", () => {
  it("renders a sticky h-14 header matching the real DashboardTopBar", () => {
    const { container } = render(<TopBarSkeleton />);
    const header = container.querySelector("header.sticky.h-14");
    expect(header).not.toBeNull();
  });

  it("renders 5 right-side placeholders (quota, bell, language, theme, avatar)", () => {
    const { container } = render(<TopBarSkeleton />);
    const rightGroup = container.querySelector("header > div:last-child");
    expect(rightGroup?.children.length).toBe(5);
  });
});
