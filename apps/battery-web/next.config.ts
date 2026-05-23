import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// API origin for CSP connect-src
const apiOrigin = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
).replace("/api/v1", "");

/** @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP */
const contentSecurityPolicy = [
  // Only allow scripts from self and necessary CDNs (no unsafe-inline in prod)
  `default-src 'self'`,
  // Scripts: self + Next.js runtime (requires 'unsafe-eval' in dev HMR only)
  isDev
    ? `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
    : `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com`,
  // Stylesheets: self + inline styles used by shadcn/ui
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,
  // Images: self + data URIs for base64 QR codes
  `img-src 'self' data: blob:`,
  // API calls + websocket for HMR in dev
  isDev
    ? `connect-src 'self' ${apiOrigin} ws://localhost:*`
    : `connect-src 'self' ${apiOrigin}`,
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
  reactCompiler: true,
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

export default nextConfig;
