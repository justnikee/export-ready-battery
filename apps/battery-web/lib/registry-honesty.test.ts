import { describe, expect, it } from "vitest";
import {
  isLedgerOrPortalVerified,
  registryStatusLabel,
  trustTierLabel,
} from "./registry-honesty";

describe("trustTierLabel", () => {
  it("does not call format-only checks registry verified", () => {
    expect(trustTierLabel("format_valid")).toBe("Format valid");
    expect(trustTierLabel("registry_verified")).toBe("Registry lookup");
    expect(trustTierLabel("official_api")).toBe("Official API");
    expect(trustTierLabel("self_declared")).toBe("Self-declared");
  });
});

describe("isLedgerOrPortalVerified", () => {
  it("rejects format-only outcomes", () => {
    expect(isLedgerOrPortalVerified("format_valid", "format_valid")).toBe(false);
    expect(isLedgerOrPortalVerified("verified", "format_valid")).toBe(false);
    expect(isLedgerOrPortalVerified("verified", "self_declared")).toBe(false);
  });

  it("accepts portal scrape or official API", () => {
    expect(isLedgerOrPortalVerified("verified", "registry_verified")).toBe(true);
    expect(isLedgerOrPortalVerified("verified", "official_api")).toBe(true);
  });
});

describe("registryStatusLabel", () => {
  it("labels format_valid separately from verified", () => {
    expect(registryStatusLabel("format_valid")).toBe("Format valid");
    expect(registryStatusLabel("verified")).toBe("Found in registry");
  });
});
