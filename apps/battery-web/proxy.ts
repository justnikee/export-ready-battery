import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { type ProductSlug } from "@/lib/products";

const adminPrefixes = ["/admin"];

// Transient pages — skip ALL auth logic (e.g. OAuth callback carries tokens in the URL,
// so an existing session cookie must not redirect it away and lose the params)
const bypassRoutes = ["/auth/callback"];

const productProtectedRoute =
  /^\/(dashboard|onboarding)(\/|$)/;
const productAuthRoute =
  /^\/(login|register|forgot-password|reset-password)(\/|$)/;

interface TokenProductClaims {
  product_type?: string;
  exp?: number;
}

let hasWarnedMissingJwtSecret = false;

function getProxyJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (jwtSecret) {
    return jwtSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET must be configured in the frontend runtime so the proxy can verify auth token product claims.",
    );
  }

  if (!hasWarnedMissingJwtSecret) {
    hasWarnedMissingJwtSecret = true;
    console.warn(
      "JWT_SECRET is not configured in the frontend runtime; proxy verification will fall back to product cookies in development.",
    );
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

async function productFromVerifiedToken(token?: string) {
  const jwtSecret = getProxyJwtSecret();
  if (!token || !jwtSecret) {
    return null;
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

    const claims = JSON.parse(
      decodeBase64Url(payloadPart),
    ) as TokenProductClaims;
    if (
      typeof claims.exp === "number" &&
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    if (claims.product_type === "BATTERY") {
      return "battery";
    }
  } catch {
    return null;
  }

  return null;
}

async function preferredProduct(
  request: NextRequest,
): Promise<ProductSlug> {
  const tokenProduct = await productFromVerifiedToken(
    request.cookies.get("auth_token")?.value,
  );
  if (tokenProduct) {
    return tokenProduct;
  }

  return "battery";
}

function redirectToPath(request: NextRequest, pathname: string) {
  const url = new URL(pathname, request.url);
  url.search = request.nextUrl.search;
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  return handleProxy(request);
}

async function handleProxy(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Never interfere with bypass routes
  if (bypassRoutes.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  const productProtectedMatch = pathname.match(productProtectedRoute);
  const productAuthMatch = pathname.match(productAuthRoute);

  if (productProtectedMatch && !token) {
    const loginUrl = new URL("/login", request.url);
    const redirectTo = request.nextUrl.search
      ? `${pathname}${request.nextUrl.search}`
      : pathname;
    loginUrl.searchParams.set("redirect", redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  if (productAuthMatch && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAdminRoute = adminPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isAdminRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    const redirectTo = request.nextUrl.search
      ? `${pathname}${request.nextUrl.search}`
      : pathname;
    loginUrl.searchParams.set("redirect", redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public assets
     * - p/[uuid] (public passport pages)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|p/).*)",
  ],
};
