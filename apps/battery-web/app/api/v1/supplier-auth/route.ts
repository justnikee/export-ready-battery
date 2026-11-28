import { NextResponse, type NextRequest } from "next/server";
import { proxySupplierAuthToBatteryApi } from "@/lib/auth-api-proxy";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");
  if (action !== "login" && action !== "logout" && action !== "session") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return proxySupplierAuthToBatteryApi(req, action);
}
