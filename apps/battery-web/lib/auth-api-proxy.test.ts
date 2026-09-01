import { describe, it, expect } from "vitest";
import { batteryApiOrigin } from "./auth-api-proxy";

describe("batteryApiOrigin", () => {
  it("strips /api/v1 from NEXT_PUBLIC_API_URL", () => {
    const original = process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_API_URL = "https://130.210.34.184.nip.io/api/v1";
    expect(batteryApiOrigin()).toBe("https://130.210.34.184.nip.io");
    process.env.NEXT_PUBLIC_API_URL = original;
  });
});
