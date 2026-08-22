import { describe, expect, it } from "vitest";
import { canIssueProductionArtifacts } from "./production-artifacts";

describe("canIssueProductionArtifacts", () => {
  it("never allows DRAFT", () => {
    expect(canIssueProductionArtifacts("DRAFT")).toBe(false);
    expect(canIssueProductionArtifacts("")).toBe(false);
    expect(canIssueProductionArtifacts(undefined)).toBe(false);
  });

  it("allows ACTIVE and ARCHIVED", () => {
    expect(canIssueProductionArtifacts("ACTIVE")).toBe(true);
    expect(canIssueProductionArtifacts("ARCHIVED")).toBe(true);
  });
});
