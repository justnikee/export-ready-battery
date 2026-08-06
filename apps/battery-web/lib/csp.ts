/**
 * Content-Security-Policy helpers (S-15).
 *
 * Production script-src uses per-request nonces + 'strict-dynamic' instead of
 * 'unsafe-inline'. Next.js attaches the nonce to framework scripts when the
 * CSP header is present on the request (see proxy.ts + root layout).
 *
 * style-src still allows 'unsafe-inline' for shadcn/Tailwind runtime styles —
 * that is a separate, lower-risk residual than executable inline scripts.
 */

export type CspBuildOptions = {
  nonce: string;
  isDev: boolean;
  /** API origin without /api/v1 (for connect-src). */
  apiOrigin: string;
};

/** Cryptographically random nonce, base64-encoded (CSP 'nonce-…' value). */
export function generateCspNonce(): string {
  // Edge/runtime-safe: Web Crypto is available in Next proxy (Node + Edge).
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64 without Node Buffer (works in Edge)
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Build a full CSP header value.
 * Production: no script 'unsafe-inline'. Dev: adds 'unsafe-eval' for React HMR.
 */
export function buildContentSecurityPolicy(opts: CspBuildOptions): string {
  const { nonce, isDev, apiOrigin } = opts;
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    // Host allowlists are ignored by browsers that honor strict-dynamic for
    // nonced scripts, but keep Razorpay for older engines / report clarity.
    "https://checkout.razorpay.com",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");

  const connectSrc = isDev
    ? `'self' ${apiOrigin} https://cdn.jsdelivr.net https://*.supabase.co ws://localhost:*`
    : `'self' ${apiOrigin} https://cdn.jsdelivr.net https://*.supabase.co`;

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    // shadcn/ui + many component libs still need inline styles
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https://*.supabase.co`,
    `connect-src ${connectSrc}`,
    `frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com`,
    `worker-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    ...(!isDev ? [`upgrade-insecure-requests`] : []),
  ];

  return directives.join("; ");
}

/** True if a CSP string still allows executable inline scripts without a nonce. */
export function cspAllowsUnsafeInlineScripts(csp: string): boolean {
  // Match script-src … 'unsafe-inline' but not style-src's unsafe-inline.
  const scriptSrc = csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith("script-src"));
  if (!scriptSrc) return false;
  return /'unsafe-inline'/.test(scriptSrc);
}

export function resolveApiOriginForCsp(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(
    "/api/v1",
    "",
  );
}
