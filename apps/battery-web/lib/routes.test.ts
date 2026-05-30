import { describe, it, expect } from "vitest";
import {
  productRoutes,
  routesFromPathname,
  stripProductPrefix,
  prefixProductPath,
  dashboardPathFromPathname,
} from "./routes";

describe("productRoutes", () => {
  it("returns battery routes by default", () => {
    const routes = productRoutes();
    expect(routes.login).toBe("/login");
    expect(routes.dashboard).toBe("/dashboard");
    expect(routes.batches).toBe("/dashboard/batches");
  });

  it("returns textile routes when given TEXTILE", () => {
    const routes = productRoutes("TEXTILE");
    expect(routes.login).toBe("/login");
    expect(routes.dashboard).toBe("/dashboard");
    expect(routes.batches).toBe("/dashboard/batches");
  });

  it("returns battery routes for unknown product types", () => {
    const routes = productRoutes("UNKNOWN");
    expect(routes.login).toBe("/login");
    expect(routes.batches).toBe("/dashboard/batches");
  });
});

describe("routesFromPathname", () => {
  it("detects battery from /battery/login", () => {
    const routes = routesFromPathname("/login");
    expect(routes.login).toBe("/login");
  });

  it("detects textile from /textile/dashboard", () => {
    const routes = routesFromPathname("/dashboard");
    expect(routes.dashboard).toBe("/dashboard");
  });

  it("returns battery routes for root path (flat URL structure)", () => {
    const routes = routesFromPathname("/");
    expect(routes.login).toBe("/login");
    expect(routes.dashboard).toBe("/dashboard");
  });
});

describe("stripProductPrefix", () => {
  it("removes /battery prefix", () => {
    expect(stripProductPrefix("/dashboard")).toBe("/dashboard");
  });

  it("removes /textile prefix", () => {
    expect(stripProductPrefix("/login")).toBe("/login");
  });

  it("returns root when only prefix is present", () => {
    expect(stripProductPrefix("/")).toBe("/");
  });

  it("returns unmodified path without prefix", () => {
    expect(stripProductPrefix("/docs")).toBe("/docs");
  });
});

describe("prefixProductPath", () => {
  it("adds battery prefix to plain path", () => {
    expect(prefixProductPath("/login", "/settings")).toBe(
      "/settings",
    );
  });

  it("does not double-prefix when target already has prefix", () => {
    expect(prefixProductPath("/login", "/settings")).toBe(
      "/settings",
    );
  });
});

describe("dashboardPathFromPathname", () => {
  it("returns dashboard root without subpath", () => {
    expect(dashboardPathFromPathname("/login")).toBe("/dashboard");
  });

  it("appends subpath", () => {
    expect(dashboardPathFromPathname("/login", "/batches")).toBe(
      "/dashboard/batches",
    );
  });
});
