import { describe, expect, it } from "vitest";
import {
  getPasswordRequirements,
  isPasswordValid,
  MIN_PASSWORD_LENGTH,
} from "./password-policy";

describe("password-policy (S-13)", () => {
  it("requires min length, letter, and number", () => {
    expect(isPasswordValid("short1a")).toBe(false);
    expect(isPasswordValid("alllettersonly")).toBe(false);
    expect(isPasswordValid("123456789012")).toBe(false);
    expect(isPasswordValid("correcthorse1")).toBe(true);
    expect(MIN_PASSWORD_LENGTH).toBe(12);
  });

  it("rejects common passwords", () => {
    expect(isPasswordValid("password1234")).toBe(false);
    const reqs = getPasswordRequirements("password1234");
    expect(reqs.find((r) => r.id === "common")?.met).toBe(false);
  });

  it("rejects email as password when email provided", () => {
    expect(isPasswordValid("user@example.com", "user@example.com")).toBe(false);
    expect(isPasswordValid("goodpassword1", "user@example.com")).toBe(true);
  });
});
