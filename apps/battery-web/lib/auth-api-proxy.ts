import { NextRequest, NextResponse } from "next/server";

/** Battery-api origin (no /api/v1 suffix). */
export function batteryApiOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
  ).replace(/\/api\/v1\/?$/, "");
}

/**
 * Proxy /api/v1/auth/* to battery-api, forwarding Cookie and Set-Cookie.
 * Vercel external rewrites drop inbound cookies, which caused
 * "OAuth state mismatch" and "Refresh token cookie missing".
 */
export async function proxyAuthToBatteryApi(
  req: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const dest = `${batteryApiOrigin()}/api/v1/auth/${pathSegments.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) {
    headers.set("cookie", cookie);
  }
  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  const accept = req.headers.get("accept");
  if (accept) {
    headers.set("accept", accept);
  }

  const host = req.headers.get("host") || req.nextUrl.host;
  headers.set("X-Forwarded-Host", host);
  headers.set(
    "X-Forwarded-Proto",
    req.nextUrl.protocol.replace(":", "") || "https",
  );
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    headers.set("X-Forwarded-For", xff);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(dest, init);

  const outHeaders = new Headers();
  const location = upstream.headers.get("location");
  if (location) {
    outHeaders.set("location", location);
  }
  const upstreamCt = upstream.headers.get("content-type");
  if (upstreamCt) {
    outHeaders.set("content-type", upstreamCt);
  }

  const res = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];
  for (const c of setCookies) {
    res.headers.append("Set-Cookie", c);
  }

  return res;
}
