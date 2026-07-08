import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SidebarSkeleton } from "./SidebarSkeleton";
import { getProductConfigByType } from "@/lib/products";

describe("SidebarSkeleton", () => {
  it("renders one group header per non-collapsible nav group, matching the real sidebar's counts", () => {
    const { container } = render(<SidebarSkeleton isCollapsed={false} />);
    const navGroups = getProductConfigByType(undefined).navGroups;
    const expandedGroups = navGroups.filter((g) => !g.collapsible);

    // One item row per real nav item, across all expanded groups.
    const expectedItemRows = expandedGroups.reduce(
      (sum, g) => sum + g.items.length,
      0,
    );
    const itemRows = container.querySelectorAll("nav > div > div.flex.items-center.gap-3");
    expect(itemRows.length).toBe(expectedItemRows);
  });

  it("uses the expanded width class when isCollapsed is false", () => {
    const { container } = render(<SidebarSkeleton isCollapsed={false} />);
    expect(container.querySelector(".md\\:w-60")).not.toBeNull();
  });

  it("uses the collapsed width class when isCollapsed is true", () => {
    const { container } = render(<SidebarSkeleton isCollapsed={true} />);
    expect(container.querySelector(".md\\:w-16")).not.toBeNull();
  });
});
