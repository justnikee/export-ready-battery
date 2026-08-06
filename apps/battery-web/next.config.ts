import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// API origin for next/image remotePatterns (CSP connect-src is set per-request
// in proxy.ts with nonces — S-15).
const apiOrigin = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
).replace("/api/v1", "");

// Hostname/protocol of the API origin so next/image can serve logos/docs the
// backend returns as absolute URLs (dev: http://localhost:8080).
const apiUrl = (() => {
  try {
    return new URL(apiOrigin);
  } catch {
    return new URL("http://localhost:8080");
  }
})();

/**
 * Static security headers (everything except CSP).
 * CSP is applied per-request in proxy.ts with a fresh nonce so production
 * script-src does not need 'unsafe-inline' (S-15 / ADR 019).
 */
const securityHeaders = [
  {
    // Prevent MIME type sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Prevent clickjacking (belt-and-suspenders alongside CSP frame-ancestors)
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Only sent on HTTPS; informs browser to always use HTTPS for 1 year
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Stop browsers from sending Referer header to third-party sites
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Restrict powerful features
    key: "Permissions-Policy",
    value: "camera=(), microphone=()",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: false,
  images: {
    // Logos and compliance docs are served from Supabase public storage
    // (<project>.supabase.co) and, in some deployments, directly from the API
    // origin. Both must be allow-listed or next/image throws "unconfigured host".
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port || undefined,
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply static security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
