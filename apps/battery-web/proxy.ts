import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildContentSecurityPolicy,
  generateCspNonce,
  resolveApiOriginForCsp,
} from "@/lib/csp";
import { type ProductSlug } from "@/lib/products";

const adminPrefixes = ["/admin"];

// Transient pages — skip ALL auth logic
const bypassRoutes = ["/auth/callback"];

const productProtectedRoute = /^\/(dashboard|onboarding)(\/|$)/;
const productAuthRoute =
  /^\/(login|register|forgot-password|reset-password)(\/|$)/;

interface TokenClaims {
  product_type?: string;
  exp?: number;
  tenant_id?: string;
}

let hasWarnedMissingJwtSecret = false;

/** Exported for tests. */
export function getProxyJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (jwtSecret) {
    return jwtSecret;
  }

  // Never throw here: after Google OAuth the API sets an auth_token cookie, and
  // a throw 500s /login. Missing secret → treat as logged out (fail closed).
  if (!hasWarnedMissingJwtSecret) {
    hasWarnedMissingJwtSecret = true;
    const msg =
      process.env.NODE_ENV === "production"
        ? "JWT_SECRET is not set on the frontend; auth cookies cannot be verified. Set it in Vercel to the same value as battery-api."
        : "JWT_SECRET is not configured in the frontend runtime; protected-route verification falls back to cookie presence in development only.";
    console.error(msg);
  }

  return null;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function base64UrlToBytes(value: string) {
  const decoded = decodeBase64Url(value);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

/**
 * Cryptographically verify HS256 JWT (signature + exp).
 * Returns claims on success, null if missing/invalid/expired.
 * S-08: used to gate dashboard shell, not mere cookie presence.
 */
export async function verifyAuthToken(
  token?: string,
): Promise<TokenClaims | null> {
  if (!token) {
    return null;
  }

  const jwtSecret = getProxyJwtSecret();
  // Production always has secret (throws above). Dev without secret: presence-only
  // fallback so local work isn't blocked — never use this path in production.
  if (!jwtSecret) {
    return process.env.NODE_ENV !== "production" ? { product_type: "BATTERY" } : null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [headerPart, payloadPart, signaturePart] = parts;

  try {
    const header = JSON.parse(decodeBase64Url(headerPart)) as {
      alg?: string;
    };
    if (header.alg !== "HS256") {
      return null;
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );

    if (!isValid) {
      return null;
    }

    const claims = JSON.parse(decodeBase64Url(payloadPart)) as TokenClaims;
    if (
      typeof claims.exp === "number" &&
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

/** @deprecated use verifyAuthToken; kept for product preference helpers */
export async function productFromVerifiedToken(
  token?: string,
): Promise<ProductSlug | null> {
  const claims = await verifyAuthToken(token);
  if (!claims) {
    return null;
  }
  if (claims.product_type === "BATTERY") {
    return "battery";
  }
  return null;
}

function redirectToLogin(
  request: NextRequest,
  pathname: string,
  csp: string,
) {
  const loginUrl = new URL("/login", request.url);
  const redirectTo = request.nextUrl.search
    ? `${pathname}${request.nextUrl.search}`
    : pathname;
  loginUrl.searchParams.set("redirect", redirectTo);
  const res = NextResponse.redirect(loginUrl);
  // Drop invalid/expired/forged cookie so it doesn't keep failing verification.
  res.cookies.set({
    name: "auth_token",
    value: "",
    path: "/",
    maxAge: 0,
  });
  res.headers.set("Content-Security-Policy", csp);
  return res;
}

/** Attach S-15 nonce CSP to a response (and request headers for Next.js). */
export function withCsp(
  request: NextRequest,
  response: NextResponse,
  nonce: string,
  csp: string,
): NextResponse {
  // Request headers: Next extracts nonce from CSP for framework scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // If this is already a NextResponse.next with request override, rebuild so
  // request headers carry the nonce into RSC render.
  if (response.status === 200 && !response.headers.get("location")) {
    const next = NextResponse.next({
      request: { headers: requestHeaders },
    });
    // Preserve cookies set on the original response (e.g. cleared auth_token)
    response.cookies.getAll().forEach((c) => {
      next.cookies.set(c);
    });
    next.headers.set("Content-Security-Policy", csp);
    return next;
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export function proxy(request: NextRequest) {
  return handleProxy(request);
}

export async function handleProxy(request: NextRequest) {
  const nonce = generateCspNonce();
  const isDev = process.env.NODE_ENV === "development";
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev,
    apiOrigin: resolveApiOriginForCsp(),
  });

  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Never interfere with bypass routes (still attach CSP)
  if (bypassRoutes.some((route) => pathname === route)) {
    return withCsp(request, NextResponse.next(), nonce, csp);
  }

  const productProtectedMatch = pathname.match(productProtectedRoute);
  const productAuthMatch = pathname.match(productAuthRoute);
  const isAdminRoute = adminPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  // S-08: verify signature + expiry, not mere presence of auth_token.
  const claims = await verifyAuthToken(token);
  const isAuthenticated = claims !== null;

  if ((productProtectedMatch || isAdminRoute) && !isAuthenticated) {
    return redirectToLogin(request, pathname, csp);
  }

  // Logged-in users hitting auth pages → dashboard (only if token is *valid*)
  if (productAuthMatch && isAuthenticated) {
    const res = NextResponse.redirect(new URL("/dashboard", request.url));
    res.headers.set("Content-Security-Policy", csp);
    return res;
  }

  return withCsp(request, NextResponse.next(), nonce, csp);
}

export const config = {
  // Include public passport pages (/p/*) so they get nonce CSP too (S-15).
  // Still skip static assets and Next internals.
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.webp$|.*\\.ico$|.*\\.mp4$|.*\\.woff2$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
