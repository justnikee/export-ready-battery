import { describe, it, expect } from "vitest";
import { cn, toApiError } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "active")).toBe("base active");
  });

  it("resolves Tailwind conflicts via tailwind-merge", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("toApiError", () => {
  it("returns the object when given an object", () => {
    const err = { response: { data: { error: "boom" } } };
    expect(toApiError(err)).toBe(err);
  });

  it("returns empty object for null", () => {
    expect(toApiError(null)).toEqual({});
  });

  it("returns empty object for primitives", () => {
    expect(toApiError("string")).toEqual({});
    expect(toApiError(42)).toEqual({});
  });
});
