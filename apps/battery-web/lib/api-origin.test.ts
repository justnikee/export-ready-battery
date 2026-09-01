import { describe, it, expect } from "vitest";
import { getApiV1Base, getOAuthStartPath } from "./api-origin";

describe("getApiV1Base", () => {
  it("uses same-origin /api/v1 in the browser so auth cookies stay first-party", () => {
    expect(typeof window).toBe("object");
    expect(getApiV1Base()).toBe("/api/v1");
  });
});

describe("getOAuthStartPath", () => {
  it("starts Google OAuth on the same origin", () => {
    expect(getOAuthStartPath("google")).toBe("/api/v1/auth/google");
  });
});
