/**
 * Browser-facing API prefix.
 *
 * Auth cookies (refresh_token / auth_token) are first-party only when the
 * browser talks to the same origin as the Next.js app. next.config.ts
 * rewrites `/api/v1/:path*` to NEXT_PUBLIC_API_URL so the real battery-api
 * still handles the request.
 *
 * Server-side (RSC / Node tests without `window`) keeps the absolute env URL.
 */
export function getApiV1Base(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  ).replace(/\/$/, "");
}

/** Same-origin OAuth start path (proxied to battery-api). */
export function getOAuthStartPath(
  provider: "google" | "microsoft" = "google",
): string {
  return `/api/v1/auth/${provider}`;
}
