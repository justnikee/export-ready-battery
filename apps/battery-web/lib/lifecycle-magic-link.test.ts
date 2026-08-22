import { describe, expect, it } from "vitest";
import { MAGIC_LINK_ACTIONS, magicLinkActionsForStatus } from "./lifecycle-magic-link";

describe("magicLinkActionsForStatus", () => {
  it("offers SHIP only from ACTIVE", () => {
    expect(magicLinkActionsForStatus("ACTIVE").map((a) => a.action)).toEqual(["SHIP"]);
  });

  it("offers INSTALL only from SHIPPED", () => {
    expect(magicLinkActionsForStatus("SHIPPED").map((a) => a.action)).toEqual(["INSTALL"]);
  });

  it("offers recycle + circularity from IN_SERVICE", () => {
    expect(magicLinkActionsForStatus("IN_SERVICE").map((a) => a.action)).toEqual([
      "RECYCLE",
      "REMANUFACTURE",
      "REUSE",
      "REPURPOSE",
    ]);
  });

  it("offers CLOSE from remanufactured / reused / repurposed", () => {
    for (const status of ["REMANUFACTURED", "REUSED", "REPURPOSED", "RECYCLED"]) {
      expect(magicLinkActionsForStatus(status).map((a) => a.action)).toEqual(["CLOSE"]);
    }
  });

  it("offers recycle, circularity, and CLOSE from RECALLED", () => {
    expect(magicLinkActionsForStatus("RECALLED").map((a) => a.action)).toEqual([
      "RECYCLE",
      "REMANUFACTURE",
      "REUSE",
      "REPURPOSE",
      "CLOSE",
    ]);
  });

  it("offers nothing from CREATED or END_OF_LIFE", () => {
    expect(magicLinkActionsForStatus("CREATED")).toEqual([]);
    expect(magicLinkActionsForStatus("END_OF_LIFE")).toEqual([]);
  });

  it("every catalog action is a known partner transition", () => {
    const actions = MAGIC_LINK_ACTIONS.map((a) => a.action);
    expect(actions).toContain("REMANUFACTURE");
    expect(actions).toContain("REUSE");
    expect(actions).toContain("REPURPOSE");
    expect(actions).not.toContain("RECALL");
    expect(actions).not.toContain("ACTIVATE");
  });
});
