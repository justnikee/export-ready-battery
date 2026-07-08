import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV === "development";

// API origin for CSP connect-src
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

/** @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP */
const contentSecurityPolicy = [
  // Only allow scripts from self and necessary CDNs (no unsafe-inline in prod)
  `default-src 'self'`,
  // Scripts: self + Razorpay checkout (needed in dev too — without it the
  // billing page can't open the payment modal on localhost) + Next.js dev
  // runtime (requires 'unsafe-eval' for HMR only)
  isDev
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com`
    : `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com`,
  // Stylesheets: self + inline styles used by shadcn/ui
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,
  // Images: self + data URIs for base64 QR codes + Supabase storage (logo,
  // compliance docs) loaded directly as <img> (e.g. the topbar/sidebar avatar,
  // which isn't proxied through next/image's optimizer)
  `img-src 'self' data: blob: https://*.supabase.co`,
  // API calls + websocket for HMR in dev + jsdelivr CDN for the scan activity world map
  isDev
    ? `connect-src 'self' ${apiOrigin} https://cdn.jsdelivr.net ws://localhost:*`
    : `connect-src 'self' ${apiOrigin} https://cdn.jsdelivr.net`,
  // Razorpay checkout iframe
  `frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com`,
  // Workers (Next.js)
  `worker-src 'self' blob:`,
  // Prevent clickjacking
  `frame-ancestors 'none'`,
  // Limit form actions
  `form-action 'self'`,
  // Upgrade HTTP → HTTPS in production
  ...(!isDev ? [`upgrade-insecure-requests`] : []),
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
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
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
