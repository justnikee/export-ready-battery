import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

function b64url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHs256(
  payload: Record<string, unknown>,
  secret: string,
): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `${header}.${body}.${sig}`;
}

function requestWithCookie(path: string, token?: string) {
  const headers = new Headers();
  if (token !== undefined) {
    headers.set("cookie", `auth_token=${token}`);
  }
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy S-08 JWT verification", () => {
  const secret = "proxy-test-jwt-secret-at-least-32-chars";

  beforeEach(() => {
    vi.resetModules();
    process.env.JWT_SECRET = secret;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it("verifyAuthToken accepts a valid HS256 token", async () => {
    const { verifyAuthToken } = await import("./proxy");
    const token = signHs256(
      {
        tenant_id: "t1",
        product_type: "BATTERY",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      secret,
    );
    const claims = await verifyAuthToken(token);
    expect(claims).not.toBeNull();
    expect(claims?.product_type).toBe("BATTERY");
  });

  it("verifyAuthToken rejects wrong signature", async () => {
    const { verifyAuthToken } = await import("./proxy");
    const token = signHs256(
      { exp: Math.floor(Date.now() / 1000) + 3600, product_type: "BATTERY" },
      "wrong-secret-xxxxxxxxxxxxxxxxxxxxxx",
    );
    expect(await verifyAuthToken(token)).toBeNull();
  });

  it("verifyAuthToken rejects expired token", async () => {
    const { verifyAuthToken } = await import("./proxy");
    const token = signHs256(
      {
        exp: Math.floor(Date.now() / 1000) - 60,
        product_type: "BATTERY",
      },
      secret,
    );
    expect(await verifyAuthToken(token)).toBeNull();
  });

  it("handleProxy redirects garbage auth_token away from dashboard", async () => {
    const { handleProxy } = await import("./proxy");
    const res = await handleProxy(
      requestWithCookie("/dashboard", "not.a.real.jwt"),
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get("location") || "";
    expect(loc).toContain("/login");
  });

  it("handleProxy allows dashboard with valid token", async () => {
    const { handleProxy } = await import("./proxy");
    const token = signHs256(
      {
        tenant_id: "t1",
        product_type: "BATTERY",
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      secret,
    );
    const res = await handleProxy(requestWithCookie("/dashboard", token));
    // next() has no redirect
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("handleProxy redirects to login when cookie missing", async () => {
    const { handleProxy } = await import("./proxy");
    const res = await handleProxy(requestWithCookie("/dashboard"));
    expect(res.headers.get("location") || "").toContain("/login");
  });

  it("handleProxy redirects valid session from /login to /dashboard", async () => {
    const { handleProxy } = await import("./proxy");
    const token = signHs256(
      {
        exp: Math.floor(Date.now() / 1000) + 3600,
        product_type: "BATTERY",
      },
      secret,
    );
    const res = await handleProxy(requestWithCookie("/login", token));
    expect(res.headers.get("location") || "").toContain("/dashboard");
  });

  it("handleProxy does not 500 /login when JWT_SECRET is missing but a cookie is present", async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = "production";
    const { handleProxy } = await import("./proxy");
    const res = await handleProxy(
      requestWithCookie("/login", "header.payload.signature"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("handleProxy does not treat forged cookie as logged-in on /login", async () => {
    const { handleProxy } = await import("./proxy");
    const res = await handleProxy(
      requestWithCookie("/login", "forged.token.value"),
    );
    // Should stay on login (next), not bounce to dashboard
    expect(res.headers.get("location")).toBeNull();
  });

  // S-15: CSP is set per-request with nonce, not script-src unsafe-inline
  it("handleProxy sets CSP with nonce and without script unsafe-inline", async () => {
    const { handleProxy } = await import("./proxy");
    const { cspAllowsUnsafeInlineScripts } = await import("./lib/csp");
    const token = signHs256(
      {
        exp: Math.floor(Date.now() / 1000) + 3600,
        product_type: "BATTERY",
      },
      secret,
    );
    const res = await handleProxy(requestWithCookie("/dashboard", token));
    const csp = res.headers.get("Content-Security-Policy") || "";
    expect(csp).toContain("script-src");
    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp).toContain("'strict-dynamic'");
    expect(cspAllowsUnsafeInlineScripts(csp)).toBe(false);
  });

  it("handleProxy sets CSP on login redirect too", async () => {
    const { handleProxy } = await import("./proxy");
    const res = await handleProxy(requestWithCookie("/dashboard"));
    const csp = res.headers.get("Content-Security-Policy") || "";
    expect(csp).toContain("'strict-dynamic'");
  });
});
