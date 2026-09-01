import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  cspAllowsUnsafeInlineScripts,
  generateCspNonce,
} from "./csp";

describe("CSP S-15", () => {
  it("generateCspNonce returns non-empty base64-ish string", () => {
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a.length).toBeGreaterThan(8);
    expect(a).not.toBe(b);
  });

  it("production script-src has nonce + strict-dynamic, no unsafe-inline", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "testnonce123",
      isDev: false,
      apiOrigin: "https://api.example.com",
    });
    expect(csp).toContain("'nonce-testnonce123'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("https://checkout.razorpay.com");
    expect(csp).toContain("https://lumberjack.razorpay.com");
    expect(csp).toContain("https://api.razorpay.com");
    expect(cspAllowsUnsafeInlineScripts(csp)).toBe(false);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("dev script-src allows unsafe-eval but still not unsafe-inline", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "devnonce",
      isDev: true,
      apiOrigin: "http://localhost:8080",
    });
    expect(csp).toContain("'unsafe-eval'");
    expect(cspAllowsUnsafeInlineScripts(csp)).toBe(false);
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("style-src may still use unsafe-inline (shadcn residual)", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "n",
      isDev: false,
      apiOrigin: "https://api.example.com",
    });
    expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
  });
});
