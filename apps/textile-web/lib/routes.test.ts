import { describe, it, expect } from "vitest";
import {
  productRoutes,
  routesFromPathname,
  stripProductPrefix,
  prefixProductPath,
  dashboardPathFromPathname,
} from "./routes";

describe("productRoutes", () => {
  it("returns flat routes by default", () => {
    const routes = productRoutes();
    expect(routes.login).toBe("/login");
    expect(routes.dashboard).toBe("/dashboard");
    expect(routes.batches).toBe("/dashboard/batches");
  });

  it("returns flat routes when given TEXTILE", () => {
    const routes = productRoutes("TEXTILE");
    expect(routes.login).toBe("/login");
    expect(routes.dashboard).toBe("/dashboard");
    expect(routes.batches).toBe("/dashboard/batches");
  });

  it("returns flat routes for unknown product types", () => {
    const routes = productRoutes("UNKNOWN");
    expect(routes.login).toBe("/login");
    expect(routes.batches).toBe("/dashboard/batches");
  });
});

describe("routesFromPathname", () => {
  it("returns flat routes regardless of pathname", () => {
    const routes = routesFromPathname("/dashboard");
    expect(routes.login).toBe("/login");
    expect(routes.dashboard).toBe("/dashboard");
  });

  it("returns flat routes for any path segment", () => {
    const routes = routesFromPathname("/login");
    expect(routes.dashboard).toBe("/dashboard");
  });

  it("returns flat routes for root path", () => {
    const routes = routesFromPathname("/");
    expect(routes.login).toBe("/login");
    expect(routes.dashboard).toBe("/dashboard");
  });
});

describe("stripProductPrefix", () => {
  it("returns path unchanged (no prefix stripping in flat routing)", () => {
    expect(stripProductPrefix("/dashboard")).toBe("/dashboard");
  });

  it("returns login path unchanged", () => {
    expect(stripProductPrefix("/login")).toBe("/login");
  });

  it("returns nested path unchanged", () => {
    expect(stripProductPrefix("/dashboard/batches")).toBe("/dashboard/batches");
  });

  it("returns unmodified path without prefix", () => {
    expect(stripProductPrefix("/docs")).toBe("/docs");
  });
});

describe("prefixProductPath", () => {
  it("returns target path unchanged (no prefix added in flat routing)", () => {
    expect(prefixProductPath("/dashboard", "/settings")).toBe("/settings");
  });

  it("does not double-prefix when target already has prefix", () => {
    expect(prefixProductPath("/login", "/dashboard/settings")).toBe(
      "/dashboard/settings",
    );
  });
});

describe("dashboardPathFromPathname", () => {
  it("returns /dashboard root without subpath", () => {
    expect(dashboardPathFromPathname("/login")).toBe("/dashboard");
  });

  it("appends subpath to /dashboard", () => {
    expect(dashboardPathFromPathname("/login", "/batches")).toBe(
      "/dashboard/batches",
    );
  });
});
